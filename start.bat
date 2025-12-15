@echo off
echo 🚀 启动 Project Neon 后端服务...

REM 检查虚拟环境
if not exist "venv" (
    echo 📦 创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
call venv\Scripts\activate

REM 安装依赖
echo 📥 安装依赖...
pip install -r requirements.txt

REM 检查 .env 文件
if not exist ".env" (
    echo ⚠️  未找到 .env 文件，从 .env.example 复制...
    copy .env.example .env
    echo ⚠️  请编辑 .env 文件，填入必要的配置（SECRET_KEY 和 OPENAI_API_KEY）
    pause
    exit /b 1
)

REM 创建上传目录
if not exist "uploads\images" mkdir uploads\images
if not exist "uploads\videos" mkdir uploads\videos

REM 启动服务
echo ✅ 启动服务...
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
