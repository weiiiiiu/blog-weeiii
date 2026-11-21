export const siteInfo: SiteInfo = {
  author: "You", // Required
  social: {
    email: "YourName@gmail.com", // Required
    github: "https://github.com/yourname", // Required
  },
  timeZone: "Asia/Shanghai", // Required, e.g. 'North America/New York', 'Asia/Shanghai'
  domain: "https://yourname.com", // Required,Used to generate rss at build time
  friends: [
    {
      name: "Sansui233",
      link: "https://sansui233.com/",
    },
  ],
  GAId: "", // Optional, GA4 ID or VITE_GA_ID env; see docs/analytics.md
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
