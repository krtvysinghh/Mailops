export interface Article {
  id: string;
  title: string;
  content: string;
  tags: string[];
}
const articles: Map<string, Article> = new Map();
const threadLinks: Map<string, string[]> = new Map();

export function createArticle(title: string, content: string, tags: string[]): string {
  const id = Math.random().toString(36).substr(2, 9);
  articles.set(id, { id, title, content, tags });
  return id;
}

export function searchArticles(query: string): Article[] {
  const q = query.toLowerCase();
  return Array.from(articles.values()).filter(a => 
    a.title.toLowerCase().includes(q) || 
    a.content.toLowerCase().includes(q) ||
    a.tags.some(t => t.toLowerCase().includes(q))
  );
}

export function linkArticleToThread(articleId: string, threadId: string): void {
  const links = threadLinks.get(threadId) || [];
  if (!links.includes(articleId)) {
    links.push(articleId);
    threadLinks.set(threadId, links);
  }
}

export function getRelatedArticles(threadId: string): Article[] {
  const links = threadLinks.get(threadId) || [];
  return links.map(id => articles.get(id)!).filter(Boolean);
}