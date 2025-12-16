/**
 * LETAVERSE 莱塔宇宙 - 站点配置
 * 支持客户自定义 Logo、背景、导航标签等元素
 * 配置从后端 /system/config API 获取
 */

// 社交链接配置
export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

// AI 助手配置
export interface AIConfig {
  name: string;
  name_cn: string;
  title: string;
  title_cn: string;
  greeting: string;
  greeting_cn: string;
}

// 功能开关配置
export interface FeaturesConfig {
  ai_chat: boolean;
  registration: boolean;
  email_verify: boolean;
}

// 项目模块配置
export interface ProjectConfig {
  name: string;
  nameCn: string;
  description: string;
  descriptionCn: string;
  features: string[];
  featuresCn: string[];
  icon?: string;
}

// 世界观数据库配置
export interface WorldDatabaseConfig {
  // 标题
  title: string;
  titleCn: string;
  subtitle: string;
  subtitleCn: string;
  // 档案记录标题
  archiveTitle: string;
  archiveTitleCn: string;
  // 世界观段落 (支持多段)
  paragraphs: Array<{
    title: string;
    titleCn: string;
    content: string;
    contentCn: string;
    highlightText?: string;      // 高亮文字
    highlightTextCn?: string;
    highlightColor?: string;     // 高亮颜色 (cyber-cyan, soul-purple, lightning-cyan)
  }>;
  // 底部两个卡片
  cards: Array<{
    title: string;
    titleCn: string;
    description: string;
    descriptionCn: string;
  }>;
}

// 首页内容配置
export interface HomeContentConfig {
  intro: {
    en: string;
    zh: string;
  };
  worldBackground: {
    en: string;
    zh: string;
  };
}

// 联系信息配置
export interface ContactConfig {
  department: string;
  departmentCn: string;
  email?: string;
  social?: {
    discord?: string;
    twitter?: string;
    github?: string;
  };
}

// 站点配置接口 - 与后端 /system/config 返回格式对应
export interface SiteConfig {
  // 品牌信息
  siteName: string;
  siteNameCn: string;
  communityName: string;
  communityNameCn: string;
  slogan: string;
  sloganCn: string;

  // AI 助手信息 (兼容旧格式)
  aiName: string;
  aiNameCn: string;
  aiTitle: string;
  aiTitleCn: string;
  aiGreeting: string;
  aiGreetingCn: string;
  
  // AI 助手配置 (新格式，来自后端)
  ai?: AIConfig;

  // 资源路径
  logo?: string;
  favicon?: string;
  backgroundImage?: string;
  heroBackground?: string;
  kanbanGirl?: string;
  defaultAvatar?: string;

  // 社交链接
  socialLinks?: SocialLink[];
  
  // 功能开关
  features?: FeaturesConfig;

  // 首页内容 (来自后端)
  intro?: {
    en: string;
    zh: string;
  };
  worldBackground?: {
    en: string;
    zh: string;
  };
  
  // 世界观数据库配置
  worldDatabase?: WorldDatabaseConfig;

  // 导航标签（i18n key 或直接文字）
  navLabels?: {
    home?: string;
    community?: string;
    agent?: string;
    profile?: string;
  };

  // 装饰性文字保持英文的列表
  decorativeTextKeepEnglish: string[];

  // 首页内容 (兼容旧格式)
  homeContent: HomeContentConfig;

  // 项目模块
  projects: ProjectConfig[];

  // 联系信息
  contact: ContactConfig;
  
  // 后端原始配置
  _backendConfig?: Record<string, unknown>;
}

// 默认站点配置
export const defaultSiteConfig: SiteConfig = {
  // 品牌信息
  siteName: 'LETAVERSE',
  siteNameCn: '莱塔宇宙',
  communityName: 'Lightning Community',
  communityNameCn: '闪电社区',
  slogan: 'The soul is infinite, yet bound by the limits of flesh.',
  sloganCn: '灵魂无限，却受制于肉体的局限。',

  // AI 助手信息
  aiName: 'Mu AI',
  aiNameCn: '穆爱',
  aiTitle: 'Central Brain',
  aiTitleCn: '中枢脑',
  aiGreeting: 'Welcome to Lightning Community. I am Mu AI, your virtual guide. Here, the soul resonates with its digital self.',
  aiGreetingCn: '欢迎来到闪电社区，我是穆爱，你的虚拟向导。在这里，灵魂与数字自我产生共鸣。',

  // 资源路径
  logo: '/assets/letaverselogo.jpg',
  favicon: '/assets/favicon.jpg',
  backgroundImage: '/assets/bg_cyberpunk.jpg',
  kanbanGirl: '/assets/ai_kanban_fixed.png',
  defaultAvatar: '/assets/default_avatar.jpg',

  // 导航标签
  navLabels: {
    home: 'nav.home',
    community: 'nav.community',
    agent: 'nav.agent',
    profile: 'nav.profile',
  },

  // 装饰性文字保持英文
  decorativeTextKeepEnglish: [
    'SYSTEM ONLINE',
    'SYNC RATE',
    'LETAVERSE',
    'LIGHTNING COMMUNITY',
    'Mu AI',
    'Central Brain',
    'L Converter',
    'ACGM Metaverse',
  ],

  // 首页内容
  homeContent: {
    intro: {
      en: 'From the Lightning Community, Z-generation ACGM creators build worlds through animation, comics, games, music, imagination, and light. They are the true natives of the metaverse, seeking balance at the intersection of reality and fantasy, and discovering the frequency where the universe and the self harmonize.',
      zh: '来自闪电社区的 Z 世代 ACGM 创作者们通过动画、漫画、游戏、音乐、想象力和光来构建世界。他们是元宇宙的真正原住民，在现实与幻想的交汇处寻求平衡，并发现宇宙与自我和谐的频率。',
    },
    worldBackground: {
      en: 'In a future timeline, the boundary between reality and the virtual world has completely collapsed. Humanity has become lost within a manipulated digital realm, and the real world is on the verge of disintegration. To awaken humankind and restore the balance between the virtual and the real, future humans created a mysterious device known as the Lightning Converter (L Converter). They traveled back through time to the year 2025, when human consciousness had not yet been fully digitized, and from that point began constructing "Lightning Community" — a virtual metaverse city of lightning that bridges reality and the future.',
      zh: '在未来的时间线中，现实与虚拟世界的界限已完全消失。人类迷失在被操控的数字领域中，现实世界濒临崩溃。为了唤醒人类并恢复虚拟与现实之间的平衡，未来的人类创造了一种名为"闪电转换器"（L Converter）的神秘装置。他们穿越时空回到 2025 年，那时人类的意识尚未完全数字化，并以此为起点开始构建"闪电社区"——一个连接现实与未来的虚拟元宇宙闪电之城。',
    },
  },

  // 世界观数据库
  worldDatabase: {
    title: 'World Database',
    titleCn: '世界观数据库',
    subtitle: 'Database',
    subtitleCn: 'Database',
    archiveTitle: '📂 Archive: 2025-RE',
    archiveTitleCn: '📂 档案记录: 2025-RE',
    paragraphs: [
      {
        title: 'Reality Collapse',
        titleCn: '现实崩塌',
        content: 'In a future timeline, as the "Singularity" erupts, the physical boundary between reality and the virtual world has been completely erased. Human consciousness begins uploading to the cloud network on a massive scale, and physical bodies gradually become relics of the old era.',
        contentCn: '在未来的时间线中，随着"奇点"的爆发，现实与虚拟世界的物理界限已被完全抹除。人类意识开始大规模上传至云端网络，实体肉身逐渐成为旧时代的遗物。',
      },
      {
        title: 'Lightning Plan',
        titleCn: '闪电计划',
        content: 'To prevent humanity from losing itself in the endless data void, the surviving "Watchers" created a mysterious cross-dimensional device — L Converter (Lightning Converter). It is not only a bridge connecting different dimensions, but also the core engine that grants "soul" to data.',
        contentCn: '为了防止人类在无尽的数据虚空中迷失自我，幸存的"守望者"们创造了跨维度的神秘装置——L Converter (闪电转换器)。它不仅是连接不同维度的桥梁，更是赋予数据以"灵魂"的核心引擎。',
        highlightText: 'L Converter',
        highlightTextCn: '闪电转换器',
        highlightColor: 'lightning-cyan',
      },
      {
        title: 'Mu AI',
        titleCn: 'Mu AI',
        content: 'As the central intelligence of this plan, Mu is responsible for managing the ecological balance of the entire metaverse. She is both a guide for new residents and the absolute law that maintains this virtual utopia.',
        contentCn: '作为这一计划的中枢智能，Mu (缪) 负责管理整个元宇宙的生态平衡。她既是引导新居民的向导，也是维护这一虚拟乌托邦的绝对法则。',
        highlightText: 'Mu',
        highlightTextCn: '缪',
        highlightColor: 'soul-purple',
      },
    ],
    cards: [
      {
        title: 'Gen-Z Creators',
        titleCn: 'Z世代创作者',
        description: 'This is the native community of the metaverse. We build this ever-expanding digital universe through animation, illustration, game development, and music production.',
        descriptionCn: '这里是元宇宙的原住民社区。我们通过动画、插画、游戏开发和音乐制作，共同构建这个不断扩张的数字宇宙。',
      },
      {
        title: 'L Converter',
        titleCn: 'L Converter',
        description: 'A "virtual avatar" conversion platform designed for anime fans. Here, your passion is not just data, but your true "form" in the metaverse.',
        descriptionCn: '专为二次元爱好者打造的"虚拟化身"转换平台。在这里，你的热爱不仅仅是数据，而是你在元宇宙中真实的"形态"。',
      },
    ],
  },

  // 项目模块
  projects: [
    {
      name: 'L Converter',
      nameCn: '闪电转换器',
      description: 'A virtual avatar metaverse social platform designed for fans of the 2D world. Create your own OC character, step into a virtual universe, interact with like-minded users, produce creative content, and showcase your virtual identity.',
      descriptionCn: '面向 2D 世界爱好者的虚拟化身元宇宙社交平台。创建你自己的原创角色，步入虚拟宇宙，与志同道合的用户互动，创作创意内容，并展示你的虚拟身份。',
      features: ['Avatar Creation', 'Virtual Social', 'Community Hub'],
      featuresCn: ['头像创建', '虚拟社交', '社区中心'],
      icon: '⚡',
    },
    {
      name: 'VTuber & Music Project',
      nameCn: 'VTuber & 音乐企划',
      description: 'Virtual Idol incubation platform for individual creators and groups.',
      descriptionCn: '面向个人创作者和团体的虚拟偶像孵化平台。',
      features: ['Stage and Ranking', 'Virtual Weekly', 'Creator Incubation'],
      featuresCn: ['阶段和排名', '虚拟周刊', '创作者孵化'],
      icon: '🎵',
    },
  ],

  // 联系信息
  contact: {
    department: 'Balance Committee',
    departmentCn: '平衡委员会',
  },
};

export default defaultSiteConfig;
