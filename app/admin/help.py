"""
管理后台帮助文档页面
"""
from sqladmin import BaseView, expose
from starlette.requests import Request
from starlette.templating import Jinja2Templates
from pathlib import Path

# 设置模板目录
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))


class HelpView(BaseView):
    name = "帮助文档"
    icon = "fa-solid fa-circle-question"
    
    @expose("/help", methods=["GET"])
    async def help_page(self, request: Request):
        return templates.TemplateResponse("help.html", {"request": request})
