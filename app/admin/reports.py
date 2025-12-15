"""
数据报表视图
"""
import csv
import io
import json
from datetime import datetime, timedelta
from sqladmin import BaseView, expose
from sqlmodel import Session, select, func
from starlette.requests import Request
from starlette.responses import HTMLResponse, StreamingResponse

from app.database import engine
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.models.category import Category


class ReportsView(BaseView):
    name = "数据报表"
    icon = "fa-solid fa-chart-bar"
    
    def is_accessible(self, request: Request) -> bool:
        return request.session.get("admin_id") is not None
    
    @expose("/reports", methods=["GET"])
    async def reports(self, request: Request):
        # 检查是否是导出请求
        export_type = request.query_params.get("export")
        if export_type:
            return await self._export_csv(export_type)
        
        days = int(request.query_params.get("days", 7))
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        with Session(engine) as session:
            chart_labels = []
            user_data = []
            post_data = []
            
            for i in range(days):
                date = start_date + timedelta(days=i)
                date_str = date.strftime("%m-%d")
                chart_labels.append(date_str)
                
                day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)
                
                user_count = session.exec(
                    select(func.count(User.id)).where(
                        User.created_at >= day_start,
                        User.created_at < day_end
                    )
                ).one()
                user_data.append(user_count)
                
                post_count = session.exec(
                    select(func.count(Post.id)).where(
                        Post.created_at >= day_start,
                        Post.created_at < day_end
                    )
                ).one()
                post_data.append(post_count)
            
            # 分类统计
            category_stats = []
            categories = session.exec(select(Category)).all()
            for cat in categories:
                count = session.exec(
                    select(func.count(Post.id)).where(Post.category_id == cat.id)
                ).one()
                category_stats.append({"name": cat.name, "post_count": count})
            category_stats.sort(key=lambda x: x["post_count"], reverse=True)
            
            # 活跃用户 TOP 10
            top_users_query = session.exec(
                select(User.username, func.count(Post.id).label("post_count"))
                .join(Post, Post.user_id == User.id)
                .group_by(User.id)
                .order_by(func.count(Post.id).desc())
                .limit(10)
            ).all()
            top_users = [{"username": u[0], "post_count": u[1]} for u in top_users_query]
            
            # 热门动态 TOP 10
            top_posts = session.exec(
                select(Post).order_by(Post.view_count.desc()).limit(10)
            ).all()
        
        html = generate_reports_html(days, chart_labels, user_data, post_data, 
                                     category_stats, top_users, top_posts)
        return HTMLResponse(content=html)
    
    async def _export_csv(self, export_type: str):
        """导出 CSV 文件"""
        output = io.StringIO()
        writer = csv.writer(output)
        
        with Session(engine) as session:
            if export_type == "users":
                writer.writerow(["ID", "用户名", "邮箱", "是否验证", "注册时间"])
                users = session.exec(select(User).order_by(User.created_at.desc())).all()
                for user in users:
                    writer.writerow([
                        user.id, user.username, user.email,
                        "是" if user.is_verified else "否",
                        user.created_at.strftime("%Y-%m-%d %H:%M:%S")
                    ])
                filename = f"users_{datetime.now().strftime('%Y%m%d')}.csv"
                
            elif export_type == "posts":
                writer.writerow(["ID", "用户ID", "内容", "媒体类型", "分类ID", "浏览量", "创建时间"])
                posts = session.exec(select(Post).order_by(Post.created_at.desc())).all()
                for post in posts:
                    writer.writerow([
                        post.id, post.user_id,
                        post.content[:100] if post.content else "",
                        post.media_type, post.category_id, post.view_count,
                        post.created_at.strftime("%Y-%m-%d %H:%M:%S")
                    ])
                filename = f"posts_{datetime.now().strftime('%Y%m%d')}.csv"
                
            elif export_type == "comments":
                writer.writerow(["ID", "用户ID", "动态ID", "内容", "创建时间"])
                comments = session.exec(select(Comment).order_by(Comment.created_at.desc())).all()
                for comment in comments:
                    writer.writerow([
                        comment.id, comment.user_id, comment.post_id,
                        comment.content[:100] if comment.content else "",
                        comment.created_at.strftime("%Y-%m-%d %H:%M:%S")
                    ])
                filename = f"comments_{datetime.now().strftime('%Y%m%d')}.csv"
            else:
                return HTMLResponse("<script>location.href='/admin/reports'</script>")
        
        output.seek(0)
        bom = '\ufeff'
        content = bom + output.getvalue()
        
        return StreamingResponse(
            iter([content.encode('utf-8')]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )


def generate_reports_html(days, chart_labels, user_data, post_data, 
                          category_stats, top_users, top_posts):
    """生成报表 HTML"""
    
    # 分类统计行
    cat_rows = ""
    for cat in category_stats:
        cat_rows += f"<tr><td>{cat['name']}</td><td class='text-end'>{cat['post_count']}</td></tr>"
    if not category_stats:
        cat_rows = '<tr><td colspan="2" class="text-center text-muted py-3">暂无数据</td></tr>'
    
    # 活跃用户行
    user_rows = ""
    for u in top_users:
        user_rows += f"<tr><td>{u['username']}</td><td class='text-end'>{u['post_count']}</td></tr>"
    if not top_users:
        user_rows = '<tr><td colspan="2" class="text-center text-muted py-3">暂无数据</td></tr>'
    
    # 热门动态行
    post_rows = ""
    for p in top_posts:
        content = (p.content[:30] + "...") if p.content and len(p.content) > 30 else (p.content or "")
        post_rows += f"<tr><td><div class='text-truncate' style='max-width:150px'>{content}</div></td><td class='text-end'>{p.view_count}</td></tr>"
    if not top_posts:
        post_rows = '<tr><td colspan="2" class="text-center text-muted py-3">暂无数据</td></tr>'
    
    btn_7 = "btn-primary" if days == 7 else "btn-outline-secondary"
    btn_30 = "btn-primary" if days == 30 else "btn-outline-secondary"
    btn_90 = "btn-primary" if days == 90 else "btn-outline-secondary"
    
    return f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数据报表 - Project Neon 管理后台</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {{ background: #f8f9fa; }}
        .sidebar {{ width: 250px; min-height: 100vh; background: #2c3e50; }}
        .sidebar a {{ color: rgba(255,255,255,0.8); text-decoration: none; padding: 12px 20px; display: block; }}
        .sidebar a:hover, .sidebar a.active {{ background: rgba(255,255,255,0.1); color: #fff; }}
        .main-content {{ margin-left: 250px; padding: 20px; }}
    </style>
</head>
<body>
    <div class="d-flex">
        <!-- 侧边栏 -->
        <div class="sidebar position-fixed">
            <div class="p-3 text-white">
                <h5><i class="fa-solid fa-bolt me-2"></i>Project Neon</h5>
            </div>
            <nav>
                <a href="/admin/dashboard"><i class="fa-solid fa-chart-line me-2"></i>仪表盘</a>
                <a href="/admin/reports" class="active"><i class="fa-solid fa-chart-bar me-2"></i>数据报表</a>
                <hr class="mx-3 border-secondary">
                <a href="/admin/user/list"><i class="fa-solid fa-user me-2"></i>用户管理</a>
                <a href="/admin/post/list"><i class="fa-solid fa-newspaper me-2"></i>动态管理</a>
                <a href="/admin/category/list"><i class="fa-solid fa-folder me-2"></i>分类管理</a>
                <a href="/admin/comment/list"><i class="fa-solid fa-comment me-2"></i>评论管理</a>
                <a href="/admin/notification/list"><i class="fa-solid fa-bell me-2"></i>通知管理</a>
                <a href="/admin/site-config/list"><i class="fa-solid fa-cog me-2"></i>网站配置</a>
                <a href="/admin/media/list"><i class="fa-solid fa-images me-2"></i>媒体库</a>
                <a href="/admin/admin-user/list"><i class="fa-solid fa-user-shield me-2"></i>管理员</a>
                <hr class="mx-3 border-secondary">
                <a href="/admin/logout"><i class="fa-solid fa-sign-out-alt me-2"></i>退出登录</a>
            </nav>
        </div>
        
        <!-- 主内容 -->
        <div class="main-content flex-grow-1">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2><i class="fa-solid fa-chart-bar me-2"></i>数据报表</h2>
                    <p class="text-muted mb-0">查看系统数据统计和趋势分析</p>
                </div>
                <div>
                    <a href="/admin/reports?export=users" class="btn btn-outline-primary btn-sm me-1">
                        <i class="fa-solid fa-download me-1"></i>导出用户
                    </a>
                    <a href="/admin/reports?export=posts" class="btn btn-outline-success btn-sm me-1">
                        <i class="fa-solid fa-download me-1"></i>导出动态
                    </a>
                    <a href="/admin/reports?export=comments" class="btn btn-outline-info btn-sm">
                        <i class="fa-solid fa-download me-1"></i>导出评论
                    </a>
                </div>
            </div>
            
            <!-- 时间范围 -->
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body py-2">
                    <span class="me-3 text-muted">时间范围：</span>
                    <div class="btn-group">
                        <a href="/admin/reports?days=7" class="btn btn-sm {btn_7}">近7天</a>
                        <a href="/admin/reports?days=30" class="btn btn-sm {btn_30}">近30天</a>
                        <a href="/admin/reports?days=90" class="btn btn-sm {btn_90}">近90天</a>
                    </div>
                </div>
            </div>
            
            <!-- 趋势图表 -->
            <div class="row mb-4">
                <div class="col-xl-6 mb-4">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header bg-white py-3">
                            <h6 class="m-0 text-primary"><i class="fa-solid fa-user-plus me-2"></i>用户注册趋势</h6>
                        </div>
                        <div class="card-body">
                            <canvas id="userChart" height="200"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-xl-6 mb-4">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header bg-white py-3">
                            <h6 class="m-0 text-success"><i class="fa-solid fa-newspaper me-2"></i>动态发布趋势</h6>
                        </div>
                        <div class="card-body">
                            <canvas id="postChart" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 数据表格 -->
            <div class="row">
                <div class="col-xl-4 mb-4">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header bg-white py-3">
                            <h6 class="m-0 text-info"><i class="fa-solid fa-folder me-2"></i>分类统计</h6>
                        </div>
                        <div class="card-body p-0">
                            <table class="table table-hover mb-0">
                                <thead class="table-light"><tr><th>分类名称</th><th class="text-end">动态数</th></tr></thead>
                                <tbody>{cat_rows}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-xl-4 mb-4">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header bg-white py-3">
                            <h6 class="m-0 text-warning"><i class="fa-solid fa-trophy me-2"></i>活跃用户 TOP 10</h6>
                        </div>
                        <div class="card-body p-0">
                            <table class="table table-hover mb-0">
                                <thead class="table-light"><tr><th>用户名</th><th class="text-end">动态数</th></tr></thead>
                                <tbody>{user_rows}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-xl-4 mb-4">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header bg-white py-3">
                            <h6 class="m-0 text-danger"><i class="fa-solid fa-fire me-2"></i>热门动态 TOP 10</h6>
                        </div>
                        <div class="card-body p-0">
                            <table class="table table-hover mb-0">
                                <thead class="table-light"><tr><th>内容</th><th class="text-end">浏览量</th></tr></thead>
                                <tbody>{post_rows}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
    new Chart(document.getElementById('userChart'), {{
        type: 'line',
        data: {{
            labels: {json.dumps(chart_labels)},
            datasets: [{{
                label: '新注册用户',
                data: {json.dumps(user_data)},
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                fill: true,
                tension: 0.3
            }}]
        }},
        options: {{
            responsive: true,
            plugins: {{ legend: {{ display: false }} }},
            scales: {{ y: {{ beginAtZero: true, ticks: {{ stepSize: 1 }} }} }}
        }}
    }});
    
    new Chart(document.getElementById('postChart'), {{
        type: 'line',
        data: {{
            labels: {json.dumps(chart_labels)},
            datasets: [{{
                label: '新发布动态',
                data: {json.dumps(post_data)},
                borderColor: '#1cc88a',
                backgroundColor: 'rgba(28, 200, 138, 0.1)',
                fill: true,
                tension: 0.3
            }}]
        }},
        options: {{
            responsive: true,
            plugins: {{ legend: {{ display: false }} }},
            scales: {{ y: {{ beginAtZero: true, ticks: {{ stepSize: 1 }} }} }}
        }}
    }});
    </script>
</body>
</html>
"""
