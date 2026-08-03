/**
 * Waline 用 path 作为一条内容的唯一标识，读和写必须用完全相同的字符串。
 *
 * 本站是 SSG 目录式 URL，浏览器里的 location.pathname 带尾斜杠（/posts/xxx/），
 * 而文章页顶部的阅读量/评论数元素是按 `/posts/${slug}` 拼的（不带尾斜杠）。
 * 两者不一致会导致评论确实存在、顶部计数却恒为 0。
 *
 * 统一去掉尾斜杠作为规范形式，与手工拼接的那种写法对齐，也不依赖具体托管平台
 * 对尾斜杠的处理方式。
 */
export function walinePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}
