export const siteConfig = {
  name: "垫饥的饭",
  shortName: "垫饥",
  title: "垫饥的饭",
  titleSuffix: "垫饥的饭 | 官方站",
  description:
    "垫饥的饭内容站：把想法、网页作品和游戏作品持续发布成一个可浏览、可试玩、可合作的创作宇宙。",
  siteUrl: import.meta.env.PUBLIC_SITE_URL || "https://is.gd/dianjidefanplus2",
  email: "1750429451@qq.com",
  wechat: "milkpad",
  ogImage: "/assets/og-cover.svg",
  keywords: ["内容站", "网页作品", "独立游戏", "创作", "文科生转型", "垫饥的饭"]
};

export const analyticsConfig = {
  plausibleDomain: import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN || "",
  gaMeasurementId: import.meta.env.PUBLIC_GA_MEASUREMENT_ID || ""
};

export const formConfig = {
  resendApiKey: import.meta.env.RESEND_API_KEY || "",
  resendFrom: import.meta.env.FORM_FROM_EMAIL || "",
  notifyTo: import.meta.env.FORM_NOTIFY_TO || siteConfig.email
};
