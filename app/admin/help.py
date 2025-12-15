"""
管理后台帮助文档页面
"""
from sqladmin import BaseView, expose
from starlette.requests import Request
from starlette.responses import HTMLResponse


class HelpView(BaseView):
    name = "帮助文档"
    icon = "fa-solid fa-circle-question"
    
    @expose("/help", methods=["GET"])
    async def help_page(self, request: Request):
        html = generate_help_html()
        return HTMLResponse(content=html)


def generate_help_html():
    """生成帮助文档 HTML"""
    return """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>帮助文档 - Project Neon 管理后台</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { background: #f8f9fa; padding: 20px; }
        .help-section { margin-bottom: 2rem; }
        .help-section h5 { color: #4e73df; border-bottom: 2px solid #4e73df; padding-bottom: 0.5rem; }
        pre { background: #2c3e50; color: #ecf0f1; padding: 1rem; border-radius: 0.5rem; }
        code { color: #e74c3c; }
        .back-btn { margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container-fluid">
        <a href="/admin" class="btn btn-outline-secondary back-btn"><i class="fa-solid fa-arrow-left me-2"></i>返回管理后台</a>
        
        <div class="">
            <div class="mb-4">
                <h2><i class="fa-solid fa-circle-question me-2"></i>管理后台使用指南</h2>
                <p class="text-muted">V2.4.2 | 更新日期 2025-12-13</p>
            </div>
            
            <!-- 快速开始 -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="fa-solid fa-rocket me-2"></i>快速开始</h5>
                </div>
                <div class="card-body">
                    <table class="table table-bordered mb-3">
                        <tr><td width="150"><strong>管理后台地址</strong></td><td><code>http://localhost:8000/admin</code></td></tr>
                        <tr><td><strong>默认账户</strong></td><td><code>admin</code></td></tr>
                        <tr><td><strong>默认密码</strong></td><td><code>Admin123</code></td></tr>
                    </table>
                    <p class="mb-0 text-muted">创建新管理员：在「管理员管理」中点击「新建」，填写账号和密码</p>
                </div>
            </div>
            
            <!-- 用户管理 -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0"><i class="fa-solid fa-user me-2"></i>用户管理</h5>
                </div>
                <div class="card-body">
                    <ul>
                        <li>查看、搜索所有注册用户</li>
                        <li>编辑用户信息</li>
                        <li><strong>封禁/解封用户</strong></li>
                    </ul>
                    <div class="alert alert-info mb-0">
                        <strong>封禁操作：</strong>勾选「已封禁」→ 填写「封禁原因」→ 可选填「封禁截止时间」（留空=永久封禁）
                    </div>
                </div>
            </div>
            
            <!-- 网站配置 -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0"><i class="fa-solid fa-cog me-2"></i>网站配置</h5>
                </div>
                <div class="card-body">
                    <h6>📷 图片链接从哪里来？</h6>
                    <div class="alert alert-success">
                        <strong>方式一（推荐）：</strong>先在前端发布动态上传图片 → 去「媒体库」找到图片 → 复制「文件路径」<br>
                        <strong>方式二：</strong>直接填写外部图片URL，如 <code>https://example.com/logo.png</code>
                    </div>
                    
                    <h6 class="mt-4">🎨 外观设置</h6>
                    <table class="table table-sm table-bordered">
                        <tr><td><code>site_logo</code></td><td>网站Logo图片</td><td><code>/uploads/images/logo.png</code></td></tr>
                        <tr><td><code>site_favicon</code></td><td>浏览器标签页图标</td><td><code>/uploads/images/favicon.ico</code></td></tr>
                        <tr><td><code>primary_color</code></td><td>主题色</td><td><code>#6366f1</code>(紫) <code>#10b981</code>(绿)</td></tr>
                        <tr><td><code>banner_images</code></td><td>轮播图</td><td><code>["/uploads/b1.jpg", "/uploads/b2.jpg"]</code></td></tr>
                    </table>
                    
                    <div class="alert alert-danger mt-3">
                        <strong>⚠️ 图片尺寸规范（重要！）</strong>
                        <ul class="mb-0 mt-2">
                            <li><strong>Logo</strong>：建议 200x50 像素，PNG透明背景</li>
                            <li><strong>Favicon</strong>：32x32 像素，.ico 或 .png 格式</li>
                            <li><strong>轮播图</strong>：建议 1920x600 像素，保持统一比例</li>
                            <li><strong>背景图</strong>：建议 1920x1080 像素</li>
                        </ul>
                        <p class="mb-0 mt-2 text-dark"><small>图片尺寸不对会影响网站UI显示效果，请严格按照规范上传！</small></p>
                    </div>
                    
                    <h6 class="mt-4">📝 内容设置</h6>
                    <table class="table table-sm table-bordered">
                        <tr><td><code>site_name</code></td><td>网站名称</td><td><code>闪电社区</code></td></tr>
                        <tr><td><code>site_description</code></td><td>网站描述</td><td><code>ACG爱好者的聚集地</code></td></tr>
                        <tr><td><code>nav_labels</code></td><td>导航菜单</td><td><code>{"home": "首页", "community": "闪电社区", "ai": "MU AI", "profile": "我的"}</code></td></tr>
                    </table>
                    
                    <h6 class="mt-4">⚡ 功能开关</h6>
                    <table class="table table-sm table-bordered">
                        <tr><td><code>enable_ai_chat</code></td><td>启用AI聊天</td><td><code>true</code> 或 <code>false</code></td></tr>
                        <tr><td><code>enable_registration</code></td><td>允许注册</td><td><code>true</code> 或 <code>false</code></td></tr>
                        <tr><td><code>require_email_verify</code></td><td>要求邮箱验证</td><td><code>true</code> 或 <code>false</code></td></tr>
                    </table>
                    
                    <h6 class="mt-4">🤖 AI设置</h6>
                    <table class="table table-sm table-bordered">
                        <tr><td><code>ai_name</code></td><td>AI名字</td><td><code>Mu</code></td></tr>
                        <tr><td><code>ai_welcome_message</code></td><td>欢迎语</td><td><code>你好呀～我是Mu✨</code></td></tr>
                        <tr><td><code>ai_system_prompt</code></td><td>AI人设提示词</td><td>定义AI性格和风格</td></tr>
                    </table>
                </div>
            </div>
            
            <!-- 媒体库 -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-warning text-dark">
                    <h5 class="mb-0"><i class="fa-solid fa-images me-2"></i>媒体库</h5>
                </div>
                <div class="card-body">
                    <ul>
                        <li>查看所有上传的图片和视频</li>
                        <li><strong>获取图片路径</strong>：点击查看详情，复制「文件路径」字段</li>
                    </ul>
                    <div class="alert alert-warning mb-0">
                        <strong>提示：</strong>配置网站Logo等图片时，先在这里找到图片，复制路径填入配置
                    </div>
                </div>
            </div>
            
            <!-- 管理员管理 -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-secondary text-white">
                    <h5 class="mb-0"><i class="fa-solid fa-user-shield me-2"></i>管理员管理</h5>
                </div>
                <div class="card-body">
                    <h6>角色说明</h6>
                    <table class="table table-sm table-bordered">
                        <tr><td><code>super_admin</code></td><td>超级管理员</td><td>所有权限，可管理其他管理员</td></tr>
                        <tr><td><code>operator</code></td><td>运营人员</td><td>基础权限，不能管理管理员</td></tr>
                    </table>
                    <p class="text-muted mb-0">注意：只有超级管理员可以访问此功能</p>
                </div>
            </div>
            
            <!-- 前端配置说明 -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-purple text-white" style="background: #6366f1;">
                    <h5 class="mb-0"><i class="fa-solid fa-code me-2"></i>前端配置说明</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-warning">
                        <strong>⚠️ 重要：</strong>后台修改配置后，前端需要<strong>刷新页面</strong>才能看到变化！
                    </div>
                    <p>后端通过 <code>GET /system/config</code> API 返回配置，前端需要正确使用这些数据：</p>
                    <table class="table table-sm table-bordered">
                        <thead><tr><th>配置项</th><th>API 返回字段</th><th>用途</th></tr></thead>
                        <tbody>
                            <tr><td><code>site_name</code></td><td><code>site_name</code></td><td>网站标题、Logo旁文字</td></tr>
                            <tr><td><code>nav_labels</code></td><td><code>nav_labels</code></td><td>导航菜单文字</td></tr>
                            <tr><td><code>ai_name</code></td><td><code>ai.name</code></td><td>AI助手名字</td></tr>
                            <tr><td><code>ai_welcome_message</code></td><td><code>ai.welcome_message</code></td><td>AI欢迎语</td></tr>
                        </tbody>
                    </table>
                    <p class="text-muted mb-0">如果修改配置后前端没有变化，请检查前端是否正确调用了 <code>/system/config</code> API 并使用返回的数据。</p>
                </div>
            </div>
            
            <!-- 常见问题 -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-dark text-white">
                    <h5 class="mb-0"><i class="fa-solid fa-question-circle me-2"></i>常见问题</h5>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <strong>Q: 忘记管理员密码怎么办？</strong>
                        <p class="text-muted mb-0">A: 让其他超级管理员在「管理员管理」中编辑你的账号，重新设置密码</p>
                    </div>
                    <div class="mb-3">
                        <strong>Q: 如何修改网站Logo？</strong>
                        <p class="text-muted mb-0">A: 在「网站配置」中找到 <code>site_logo</code>，填入图片URL</p>
                    </div>
                    <div class="mb-3">
                        <strong>Q: 配置修改后前端没更新？</strong>
                        <p class="text-muted mb-0">A: 1. 刷新前端页面 2. 检查前端是否正确使用了 <code>/system/config</code> API 返回的数据</p>
                    </div>
                    <div class="mb-0">
                        <strong>Q: 如何添加社交链接？</strong>
                        <p class="text-muted mb-0">A: 在 <code>social_links</code> 填入JSON：<code>[{"name": "GitHub", "url": "https://github.com/xxx", "icon": "github"}]</code></p>
                    </div>
                </div>
            </div>
            
            <!-- 邮件配置 -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-danger text-white">
                    <h5 class="mb-0"><i class="fa-solid fa-envelope me-2"></i>邮件服务配置</h5>
                </div>
                <div class="card-body">
                    <p>编辑项目根目录的 <code>.env</code> 文件：</p>
                    <pre><code># QQ邮箱示例
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your_email@qq.com
SMTP_PASSWORD=your_auth_code  # 授权码，不是登录密码
FROM_EMAIL=your_email@qq.com
FRONTEND_URL=http://localhost:5173</code></pre>
                    <p class="text-muted mb-0">获取QQ邮箱授权码：登录QQ邮箱 → 设置 → 账户 → 开启SMTP服务 → 发短信获取授权码</p>
                </div>
            </div>
            
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
"""
