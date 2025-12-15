"""
初始化数据库数据
运行: python init_data.py
"""
from sqlmodel import Session
from app.database import engine
from app.models.category import Category

def init_categories():
    """初始化番剧分类"""
    categories = [
        {"name": "进击的巨人", "cover_image": None},
        {"name": "赛博朋克边缘行者", "cover_image": None},
        {"name": "鬼灭之刃", "cover_image": None},
        {"name": "咒术回战", "cover_image": None},
        {"name": "间谍过家家", "cover_image": None},
        {"name": "葬送的芙莉莲", "cover_image": None},
        {"name": "其他", "cover_image": None},
    ]

    with Session(engine) as session:
        for cat_data in categories:
            existing = session.query(Category).filter(Category.name == cat_data["name"]).first()
            if not existing:
                category = Category(**cat_data)
                session.add(category)
                print(f"✅ 添加分类: {cat_data['name']}")
            else:
                print(f"⏭️  分类已存在: {cat_data['name']}")

        session.commit()
        print("\n✅ 数据初始化完成！")

if __name__ == "__main__":
    print("=" * 50)
    print("初始化 Project Neon 数据")
    print("=" * 50 + "\n")

    try:
        init_categories()
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
