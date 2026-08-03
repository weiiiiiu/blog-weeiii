export const siteInfo: SiteInfo = {
  author: "Zhong Wei", // 显示在页面上的作者名
  social: {
    email: "weeiii826@gmail.com",
    github: "https://github.com/weiiiiiu",
  },
  timeZone: "Asia/Shanghai",
  domain: "https://blog-weeiii.pages.dev", // 用于生成 RSS。以后绑了自己的域名记得改这里
  friends: [],
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
  walineApi?: string; // Waline 评论系统后端地址
  GAId?: string; // Google Analytics id
};
