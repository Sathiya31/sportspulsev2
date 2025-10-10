export interface TocItem {
  id: string;
  text: string;
  level: number;
}

// Generate table of contents from markdown content
export function generateTableOfContents(markdown: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length; // 2 for ##, 3 for ###
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    toc.push({ id, text, level });
  }

  return toc;
}

// Add IDs to headings in HTML for linking
export function addHeadingIds(html: string): string {
  return html.replace(
    /<h([23])>(.*?)<\/h\1>/g,
    (match, level, content) => {
      const text = content.replace(/<[^>]*>/g, ''); // Remove any HTML tags
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      return `<h${level} id="${id}">${content}</h${level}>`;
    }
  );
}