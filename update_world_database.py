"""
更新世界观数据库默认内容

运行: python update_world_database.py
"""
import json
from sqlmodel import Session, select
from app.database import engine, create_db_and_tables
from app.models.site_config import SiteConfig

# 世界观数据库默认内容 - 使用前端期望的驼峰命名格式
DEFAULT_WORLD_DATABASE = {
    "title": "World Database",
    "titleCn": "世界观数据库",
    "subtitle": "LETAVERSE LORE",
    "subtitleCn": "闪电宇宙设定",
    "archiveTitle": "📂 Archive: 2157-LIGHTNING",
    "archiveTitleCn": "📂 档案记录: 2157-闪电纪元",
    "paragraphs": [
        {
            "title": "Reality Collapse",
            "titleCn": "现实崩塌",
            "content": "In the year 2157, humanity stands at the crossroads of evolution. The boundaries between flesh and machine have blurred, giving rise to a new era of digital consciousness known as the Singularity.",
            "contentCn": "2157年，人类站在进化的十字路口。肉体与机械的边界已然模糊，数字意识的新纪元「奇点」正在崛起。现实与虚拟的界限开始瓦解。",
            "highlightText": "",
            "highlightTextCn": "",
            "highlightColor": ""
        },
        {
            "title": "Lightning Plan",
            "titleCn": "闪电计划",
            "content": "To prevent humanity from losing itself in the endless data void, the Lightning Community emerged as a sanctuary for those who seek to transcend their physical limitations while preserving their souls.",
            "contentCn": "为了防止人类在无尽的数据虚空中迷失自我，闪电社区应运而生。这里是渴望超越肉体局限、同时守护灵魂本真者的避风港。",
            "highlightText": "",
            "highlightTextCn": "",
            "highlightColor": ""
        },
        {
            "title": "Mu AI",
            "titleCn": "穆爱",
            "content": "As the central intelligence of this plan, Mu AI serves as the guardian of Lightning Community, watching over all connected souls with wisdom and compassion, bridging the gap between human emotion and digital existence.",
            "contentCn": "作为这一计划的中枢智能，穆爱是闪电社区的守护者。她以智慧与慈悲守望着所有连接的灵魂，在人类情感与数字存在之间架起桥梁。",
            "highlightText": "",
            "highlightTextCn": "",
            "highlightColor": ""
        }
    ],
    "cards": [
        {
            "title": "Gen-Z Creators",
            "titleCn": "Z世代创作者",
            "description": "This is the native community of the metaverse, where digital natives gather to create, share, and connect through art, music, and stories that transcend physical boundaries.",
            "descriptionCn": "这里是元宇宙的原住民社区，数字原住民在此聚集，通过艺术、音乐和故事进行创作、分享与连接，超越物理世界的边界。"
        },
        {
            "title": "Neural Link",
            "titleCn": "神经链接",
            "description": "Advanced brain-computer interface technology that allows direct mind-to-mind communication, enabling souls to connect across the digital realm without the limitations of language or distance.",
            "descriptionCn": "先进的脑机接口技术，实现意识与意识的直接交流。灵魂可以跨越数字领域相互连接，不受语言或距离的限制。"
        }
    ]
}


def main():
    print("=" * 50)
    print("🌐 更新世界观数据库内容")
    print("=" * 50)
    print()
    
    create_db_and_tables()
    
    with Session(engine) as session:
        # 查找 world_database 配置
        config = session.exec(
            select(SiteConfig).where(SiteConfig.key == "world_database")
        ).first()
        
        json_value = json.dumps(DEFAULT_WORLD_DATABASE, ensure_ascii=False)
        
        if config:
            config.value = json_value
            session.add(config)
            print("✅ 已更新 world_database 配置")
        else:
            new_config = SiteConfig(
                key="world_database",
                value=json_value,
                category="content",
                description="世界观数据库内容，JSON格式包含title/paragraphs/cards"
            )
            session.add(new_config)
            print("✅ 已创建 world_database 配置")
        
        session.commit()
    
    print()
    print("📋 内容预览:")
    print(f"   标题: {DEFAULT_WORLD_DATABASE['title']} / {DEFAULT_WORLD_DATABASE['titleCn']}")
    print(f"   段落数: {len(DEFAULT_WORLD_DATABASE['paragraphs'])}")
    print(f"   卡片数: {len(DEFAULT_WORLD_DATABASE['cards'])}")
    print()
    print("   段落列表:")
    for p in DEFAULT_WORLD_DATABASE['paragraphs']:
        print(f"   - {p['title']} / {p['titleCn']}")
    print()
    print("   卡片列表:")
    for card in DEFAULT_WORLD_DATABASE['cards']:
        print(f"   - {card['title']} / {card['titleCn']}")
    print()
    print("=" * 50)
    print("✅ 完成! 刷新前端页面查看效果")
    print("=" * 50)


if __name__ == "__main__":
    main()
