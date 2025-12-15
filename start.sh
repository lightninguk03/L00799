#!/bin/bash

echo "🚀 启动 Project Neon 后端服务..."

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "📥 安装依赖..."
pip3 install -r requirements.txt

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，从 .env.example 复制..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件，填入必要的配置（SECRET_KEY 和 OPENAI_API_KEY）"
    exit 1
fi

# 创建上传目录
mkdir -p uploads/images uploads/videos

# 启动服务
echo "✅ 启动服务..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
