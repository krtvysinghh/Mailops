/**
 * Feature 97: Email-to-Blog Auto-Publisher
 * 
 * Ingests inbound emails sent to blog@yourdomain.com and converts them
 * into clean Markdown blog posts published to static JSON feeds/R2.
 */

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  author: string;
  markdownContent: string;
  tags: string[];
  publishedAt: Date;
  isDraft: boolean;
}

const blogPosts = new Map<string, BlogPost>();

export function convertHtmlToMarkdown(html: string): string {
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<br\s*[\/]?>/gi, '\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<[^>]+>/g, '');
  return md.trim();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

export function processPublishEmail(
  from: string,
  subject: string,
  htmlOrText: string,
  authorizedSenders: string[]
): BlogPost | null {
  const senderClean = from.toLowerCase().trim();
  const isAuthorized = authorizedSenders.some(s => s.toLowerCase().trim() === senderClean);
  if (!isAuthorized) {
    return null;
  }

  const isDraft = subject.startsWith('[DRAFT]');
  const cleanTitle = subject.replace(/^\[DRAFT\]\s*/i, '').trim();
  const slug = slugify(cleanTitle) || `post-${Date.now()}`;
  const markdownContent = convertHtmlToMarkdown(htmlOrText);

  // Extract tags from hashtags in title or footer
  const tagMatches = markdownContent.match(/#([a-zA-Z0-9_-]+)/g) || [];
  const tags = Array.from(new Set(tagMatches.map(t => t.substring(1))));

  const post: BlogPost = {
    id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    slug,
    title: cleanTitle,
    author: from,
    markdownContent,
    tags,
    publishedAt: new Date(),
    isDraft,
  };

  blogPosts.set(post.id, post);
  return post;
}

export function listPublishedPosts(includeDrafts = false): BlogPost[] {
  return Array.from(blogPosts.values())
    .filter(p => includeDrafts || !p.isDraft)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
