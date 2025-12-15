"""
管理后台自定义视图 - 使用 FastAPI 原生路由
"""
import csv
import io
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, StreamingResponse, RedirectResponse
from sqlmodel import Session, select, func

from app.database import engine
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.models.category import Category
from app.models.notification import Notification
from app.models.media import Media
from app.models.admin_user import AdminUser
from app.models.site_config import SiteConfig
from app.config import settings

router = APIRouter()


def check_admin_auth(request: Request):
    """检查管理员认证"""
    return request.session.get("admin_id") is not None


# 使用 /admin-api 前缀的路径
DASHBOARD_URL = "/admin-api/dashboard"
REPORTS_URL = "/admin-api/reports"


@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    """仪表盘页面"""
    if not check_admin_auth(request):
        return RedirectResponse(url="/admin/login", status_code=302)
    
    admin_name = request.session.get("admin_username", "管理员")
    
    with Session(engine) as session:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        stats = {
            "users": session.exec(select(func.count(User.id))).one(),
            "posts": session.exec(select(func.count(Post.id))).one(),
            "comments": session.exec(select(func.count(Comment.id))).one(),
            "categories": session.exec(select(func.count(Category.id))).one(),
            "media": session.exec(select(func.count(Media.id))).one(),
            "unread_notifications": session.exec(
                select(func.count(Notification.id)).where(Notification.is_read == False)
            ).one(),
            "today_users": session.exec(
                select(func.count(User.id)).where(User.created_at >= today)
            ).one(),
            "today_posts": session.exec(
                select(func.count(Post.id)).where(Post.created_at >= today)
            ).one(),
            "admins": session.exec(select(func.count(AdminUser.id))).one(),
            "configs": session.exec(select(func.count(SiteConfig.id))).one(),
        }
        
        recent_users = session.exec(
            select(User).order_by(User.created_at.desc()).limit(5)
        ).all()
        
        recent_posts = session.exec(
            select(Post).order_by(Post.created_at.desc()).limit(5)
        ).all()
    
    return HTMLResponse(content=generate_dashboard_html(admin_name, stats, recent_users, recent_posts))


@router.get("/reports", response_class=HTMLResponse)
async def reports(request: Request):
    """数据报表页面"""
    if not check_admin_auth(request):
        return RedirectResponse(url="/admin/login", status_code=302)
    
    # 检查是否是导出请求
    export_type = request.query_params.get("export")
    if export_type:
        return await export_csv(export_type)
    
    days = int(request.query_params.get("days", 7))
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    with Session(engine) as session:
        chart_labels = []
        user_data = []
        post_data = []
        
        for i in range(days):
            date = start_date + timedelta(days=i)
            chart_labels.append(date.strftime("%m-%d"))
            
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            user_data.append(session.exec(
                select(func.count(User.id)).where(
                    User.created_at >= day_start, User.created_at < day_end
                )
            ).one())
            
            post_data.append(session.exec(
                select(func.count(Post.id)).where(
                    Post.created_at >= day_start, Post.created_at < day_end
                )
            ).one())
        
        # 分类统计
        category_stats = []
        for cat in session.exec(select(Category)).all():
            count = session.exec(
                select(func.count(Post.id)).where(Post.category_id == cat.id)
            ).one()
            category_stats.append({"name": cat.name, "post_count": count})
        category_stats.sort(key=lambda x: x["post_count"], reverse=True)
        
        # 活跃用户 TOP 10
        top_users = [
            {"username": u[0], "post_count": u[1]}
            for u in session.exec(
                select(User.username, func.count(Post.id))
                .join(Post, Post.user_id == User.id)
                .group_by(User.id)
                .order_by(func.count(Post.id).desc())
                .limit(10)
            ).all()
        ]
        
        # 热门动态 TOP 10
        top_posts = session.exec(
            select(Post).order_by(Post.view_count.desc()).limit(10)
        ).all()
    
    return HTMLResponse(content=generate_reports_html(
        days, chart_labels, user_data, post_data, category_stats, top_users, top_posts
    ))


async def export_csv(export_type: str):
    """导出 CSV"""
    output = io.StringIO()
    writer = csv.writer(output)
    
    with Session(engine) as session:
        if export_type == "users":
            writer.writerow(["ID", "用户名", "邮箱", "是否验证", "注册时间"])
            for user in session.exec(select(User).order_by(User.created_at.desc())).all():
                writer.writerow([
                    user.id, user.username, user.email,
                    "是" if user.is_verified else "否",
                    user.created_at.strftime("%Y-%m-%d %H:%M:%S")
                ])
            filename = f"users_{datetime.now().strftime('%Y%m%d')}.csv"
        elif export_type == "posts":
            writer.writerow(["ID", "用户ID", "内容", "媒体类型", "分类ID", "浏览量", "创建时间"])
            for post in session.exec(select(Post).order_by(Post.created_at.desc())).all():
                writer.writerow([
                    post.id, post.user_id, post.content[:100] if post.content else "",
                    post.media_type, post.category_id, post.view_count,
                    post.created_at.strftime("%Y-%m-%d %H:%M:%S")
                ])
            filename = f"posts_{datetime.now().strftime('%Y%m%d')}.csv"
        elif export_type == "comments":
            writer.writerow(["ID", "用户ID", "动态ID", "内容", "创建时间"])
            for c in session.exec(select(Comment).order_by(Comment.created_at.desc())).all():
                writer.writerow([
                    c.id, c.user_id, c.post_id, c.content[:100] if c.content else "",
                    c.created_at.strftime("%Y-%m-%d %H:%M:%S")
                ])
            filename = f"comments_{datetime.now().strftime('%Y%m%d')}.csv"
        else:
            return RedirectResponse(url="/admin-api/reports", status_code=302)
    
    output.seek(0)
    return StreamingResponse(
        iter([('\ufeff' + output.getvalue()).encode('utf-8')]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def generate_dashboard_html(admin_name, stats, recent_users, recent_posts):
    """生成仪表盘 HTML"""
    user_rows = "".join([
        f"<tr><td>{u.username}</td><td>{u.email}</td><td>{u.created_at.strftime('%m-%d %H:%M')}</td></tr>"
        for u in recent_users
    ]) or '<tr><td colspan="3" class="text-center text-muted py-3">暂无数据</td></tr>'
    
    post_rows = "".join([
        f"<tr><td><div class='text-truncate' style='max-width:200px'>{(p.content[:50]+'...' if p.content and len(p.content)>50 else p.content or '')}</div></td><td>{p.user_id}</td><td>{p.created_at.strftime('%m-%d %H:%M')}</td></tr>"
        for p in recent_posts
    ]) or '<tr><td colspan="3" class="text-center text-muted py-3">暂无数据</td></tr>'
    
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>仪表盘 - Project Neon 管理后台</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {{ background: #f8f9fa; }}
        .sidebar {{ width: 250px; min-height: 100vh; background: #2c3e50; }}
        .sidebar a {{ color: rgba(255,255,255,0.8); text-decoration: none; padding: 12px 20px; display: block; }}
        .sidebar a:hover, .sidebar a.active {{ background: rgba(255,255,255,0.1); color: #fff; }}
        .main-content {{ margin-left: 250px; padding: 20px; }}
        .stat-card {{ border-left: 4px solid; }}
        .stat-card:hover {{ transform: translateY(-2px); transition: 0.2s; }}
    </style>
</head>
<body>
    <div class="d-flex">
        <div class="sidebar position-fixed">
            <div class="p-3 text-white"><h5><i class="fa-solid fa-bolt me-2"></i>Project Neon</h5></div>
            <nav>
                <a href="/admin-api/dashboard" class="active"><i class="fa-solid fa-chart-line me-2"></i>仪表盘</a>
                <a href="/admin-api/reports"><i class="fa-solid fa-chart-bar me-2"></i>数据报表</a>
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
        <div class="main-content flex-grow-1">
            <div class="mb-4"><h2><i class="fa-solid fa-chart-line me-2"></i>仪表盘</h2><p class="text-muted">欢迎回来，{admin_name}！</p></div>
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-3"><div class="card stat-card border-0 shadow-sm" style="border-color:#4e73df"><div class="card-body"><div class="d-flex justify-content-between"><div><div class="text-muted small">用户总数</div><div class="h3 mb-0 text-primary">{stats['users']}</div></div><i class="fa-solid fa-users fa-2x text-muted"></i></div></div></div></div>
                <div class="col-xl-3 col-md-6 mb-3"><div class="card stat-card border-0 shadow-sm" style="border-color:#1cc88a"><div class="card-body"><div class="d-flex justify-content-between"><div><div class="text-muted small">动态总数</div><div class="h3 mb-0 text-success">{stats['posts']}</div></div><i class="fa-solid fa-newspaper fa-2x text-muted"></i></div></div></div></div>
                <div class="col-xl-3 col-md-6 mb-3"><div class="card stat-card border-0 shadow-sm" style="border-color:#36b9cc"><div class="card-body"><div class="d-flex justify-content-between"><div><div class="text-muted small">评论总数</div><div class="h3 mb-0 text-info">{stats['comments']}</div></div><i class="fa-solid fa-comments fa-2x text-muted"></i></div></div></div></div>
                <div class="col-xl-3 col-md-6 mb-3"><div class="card stat-card border-0 shadow-sm" style="border-color:#f6c23e"><div class="card-body"><div class="d-flex justify-content-between"><div><div class="text-muted small">分类数量</div><div class="h3 mb-0 text-warning">{stats['categories']}</div></div><i class="fa-solid fa-folder fa-2x text-muted"></i></div></div></div></div>
            </div>
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-3"><div class="card stat-card border-0 shadow-sm" style="border-color:#e74a3b"><div class="card-body"><div class="d-flex justify-content-between"><div><div class="text-muted small">媒体文件</div><div class="h3 mb-0 text-danger">{stats['media']}</div></div><i class="fa-solid fa-images fa-2x text-muted"></i></div></div></div></div>
                <div class="col-xl-3 col-md-6 mb-3"><div class="card stat-card border-0 shadow-sm" style="border-color:#858796"><div class="card-body"><div class="d-flex justify-content-between"><div><div class="text-muted small">未读通知</div><div class="h3 mb-0 text-secondary">{stats['unread_notifications']}</div></div><i class="fa-solid fa-bell fa-2x text-muted"></i></div></div></div></div>
                <div class="col-xl-3 col-md-6 mb-3"><div class="card stat-card border-0 shadow-sm" style="border-color:#5a5c69"><div class="card-body"><div class="d-flex justify-content-between"><div><div class="text-muted small">今日新用户</div><div class="h3 mb-0">{stats['today_users']}</div></div><i class="fa-solid fa-user-plus fa-2x text-muted"></i></div></div></div></div>
                <div class="col-xl-3 col-md-6 mb-3"><div class="card stat-card border-0 shadow-sm" style="border-color:#6f42c1"><div class="card-body"><div class="d-flex justify-content-between"><div><div class="text-muted small">今日动态</div><div class="h3 mb-0" style="color:#6f42c1">{stats['today_posts']}</div></div><i class="fa-solid fa-plus-circle fa-2x text-muted"></i></div></div></div></div>
            </div>
            <div class="row">
                <div class="col-xl-6 mb-4"><div class="card border-0 shadow-sm"><div class="card-header bg-white py-3"><h6 class="m-0 text-primary"><i class="fa-solid fa-user-clock me-2"></i>最近注册用户</h6></div><div class="card-body p-0"><table class="table table-hover mb-0"><thead class="table-light"><tr><th>用户名</th><th>邮箱</th><th>注册时间</th></tr></thead><tbody>{user_rows}</tbody></table></div></div></div>
                <div class="col-xl-6 mb-4"><div class="card border-0 shadow-sm"><div class="card-header bg-white py-3"><h6 class="m-0 text-success"><i class="fa-solid fa-newspaper me-2"></i>最近发布动态</h6></div><div class="card-body p-0"><table class="table table-hover mb-0"><thead class="table-light"><tr><th>内容</th><th>用户ID</th><th>发布时间</th></tr></thead><tbody>{post_rows}</tbody></table></div></div></div>
            </div>
            <div class="card border-0 shadow-sm"><div class="card-header bg-white py-3"><h6 class="m-0 text-secondary"><i class="fa-solid fa-server me-2"></i>系统信息</h6></div><div class="card-body"><div class="row"><div class="col-md-4"><p><strong>应用名称：</strong>{settings.APP_NAME}</p><p><strong>版本：</strong>{settings.VERSION}</p></div><div class="col-md-4"><p><strong>数据库：</strong>SQLite</p><p><strong>框架：</strong>FastAPI + SQLAdmin</p></div><div class="col-md-4"><p><strong>管理员数量：</strong>{stats['admins']}</p><p><strong>配置项数量：</strong>{stats['configs']}</p></div></div></div></div>
        </div>
    </div>
</body>
</html>"""


def generate_reports_html(days, chart_labels, user_data, post_data, category_stats, top_users, top_posts):
    """生成报表 HTML"""
    cat_rows = "".join([f"<tr><td>{c['name']}</td><td class='text-end'>{c['post_count']}</td></tr>" for c in category_stats]) or '<tr><td colspan="2" class="text-center text-muted py-3">暂无数据</td></tr>'
    user_rows = "".join([f"<tr><td>{u['username']}</td><td class='text-end'>{u['post_count']}</td></tr>" for u in top_users]) or '<tr><td colspan="2" class="text-center text-muted py-3">暂无数据</td></tr>'
    post_rows = "".join([f"<tr><td><div class='text-truncate' style='max-width:150px'>{(p.content[:30]+'...' if p.content and len(p.content)>30 else p.content or '')}</div></td><td class='text-end'>{p.view_count}</td></tr>" for p in top_posts]) or '<tr><td colspan="2" class="text-center text-muted py-3">暂无数据</td></tr>'
    btn_7, btn_30, btn_90 = ("btn-primary" if days==7 else "btn-outline-secondary", "btn-primary" if days==30 else "btn-outline-secondary", "btn-primary" if days==90 else "btn-outline-secondary")
    
    return f"""<!DOCTYPE html>
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
        <div class="sidebar position-fixed">
            <div class="p-3 text-white"><h5><i class="fa-solid fa-bolt me-2"></i>Project Neon</h5></div>
            <nav>
                <a href="/admin-api/dashboard"><i class="fa-solid fa-chart-line me-2"></i>仪表盘</a>
                <a href="/admin-api/reports" class="active"><i class="fa-solid fa-chart-bar me-2"></i>数据报表</a>
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
        <div class="main-content flex-grow-1">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div><h2><i class="fa-solid fa-chart-bar me-2"></i>数据报表</h2><p class="text-muted">查看系统数据统计和趋势分析</p></div>
                <div>
                    <a href="/admin-api/reports?export=users" class="btn btn-outline-primary btn-sm me-1"><i class="fa-solid fa-download me-1"></i>导出用户</a>
                    <a href="/admin-api/reports?export=posts" class="btn btn-outline-success btn-sm me-1"><i class="fa-solid fa-download me-1"></i>导出动态</a>
                    <a href="/admin-api/reports?export=comments" class="btn btn-outline-info btn-sm"><i class="fa-solid fa-download me-1"></i>导出评论</a>
                </div>
            </div>
            <div class="card border-0 shadow-sm mb-4"><div class="card-body py-2"><span class="me-3 text-muted">时间范围：</span><div class="btn-group"><a href="/admin-api/reports?days=7" class="btn btn-sm {btn_7}">近7天</a><a href="/admin-api/reports?days=30" class="btn btn-sm {btn_30}">近30天</a><a href="/admin-api/reports?days=90" class="btn btn-sm {btn_90}">近90天</a></div></div></div>
            <div class="row mb-4">
                <div class="col-xl-6 mb-4"><div class="card border-0 shadow-sm h-100"><div class="card-header bg-white py-3"><h6 class="m-0 text-primary"><i class="fa-solid fa-user-plus me-2"></i>用户注册趋势</h6></div><div class="card-body"><canvas id="userChart" height="200"></canvas></div></div></div>
                <div class="col-xl-6 mb-4"><div class="card border-0 shadow-sm h-100"><div class="card-header bg-white py-3"><h6 class="m-0 text-success"><i class="fa-solid fa-newspaper me-2"></i>动态发布趋势</h6></div><div class="card-body"><canvas id="postChart" height="200"></canvas></div></div></div>
            </div>
            <div class="row">
                <div class="col-xl-4 mb-4"><div class="card border-0 shadow-sm h-100"><div class="card-header bg-white py-3"><h6 class="m-0 text-info"><i class="fa-solid fa-folder me-2"></i>分类统计</h6></div><div class="card-body p-0"><table class="table table-hover mb-0"><thead class="table-light"><tr><th>分类名称</th><th class="text-end">动态数</th></tr></thead><tbody>{cat_rows}</tbody></table></div></div></div>
                <div class="col-xl-4 mb-4"><div class="card border-0 shadow-sm h-100"><div class="card-header bg-white py-3"><h6 class="m-0 text-warning"><i class="fa-solid fa-trophy me-2"></i>活跃用户 TOP 10</h6></div><div class="card-body p-0"><table class="table table-hover mb-0"><thead class="table-light"><tr><th>用户名</th><th class="text-end">动态数</th></tr></thead><tbody>{user_rows}</tbody></table></div></div></div>
                <div class="col-xl-4 mb-4"><div class="card border-0 shadow-sm h-100"><div class="card-header bg-white py-3"><h6 class="m-0 text-danger"><i class="fa-solid fa-fire me-2"></i>热门动态 TOP 10</h6></div><div class="card-body p-0"><table class="table table-hover mb-0"><thead class="table-light"><tr><th>内容</th><th class="text-end">浏览量</th></tr></thead><tbody>{post_rows}</tbody></table></div></div></div>
            </div>
        </div>
    </div>
    <script>
    new Chart(document.getElementById('userChart'), {{type:'line',data:{{labels:{json.dumps(chart_labels)},datasets:[{{label:'新注册用户',data:{json.dumps(user_data)},borderColor:'#4e73df',backgroundColor:'rgba(78,115,223,0.1)',fill:true,tension:0.3}}]}},options:{{responsive:true,plugins:{{legend:{{display:false}}}},scales:{{y:{{beginAtZero:true,ticks:{{stepSize:1}}}}}}}}}});
    new Chart(document.getElementById('postChart'), {{type:'line',data:{{labels:{json.dumps(chart_labels)},datasets:[{{label:'新发布动态',data:{json.dumps(post_data)},borderColor:'#1cc88a',backgroundColor:'rgba(28,200,138,0.1)',fill:true,tension:0.3}}]}},options:{{responsive:true,plugins:{{legend:{{display:false}}}},scales:{{y:{{beginAtZero:true,ticks:{{stepSize:1}}}}}}}}}});
    </script>
</body>
</html>"""
