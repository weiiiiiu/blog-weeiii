export const siteInfo: SiteInfo = {
  author: "ZHONG WEI", // 显示在页面上的作者名
  social: {
    email: "weeiii826@gmail.com",
    github: "https://github.com/weiiiiiu",
  },
  timeZone: "Asia/Shanghai",
  domain: "https://blog.006573.xyz", // 用于生成 RSS 和 sitemap 里的绝对链接
  friends: [],
  GAId: "G-F06D4HF1ZQ", // GA4 衡量 ID；留空时读取 VITE_GA_ID，两者都为空时不加载统计
} as const;

type SiteInfo = {
  author: string;
  social: {
    email: string;
    github: string;
  };
  friends?: {
    name: string;
    link: string;
  }[];
  timeZone?: string; // e.g. 'Asia/Shanghai'

  // Sites
  domain: string; // Used to generate rss at build time
  GAId?: string; // Google Analytics id
};
