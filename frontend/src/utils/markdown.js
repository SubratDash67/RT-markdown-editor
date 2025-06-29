import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItToc from 'markdown-it-table-of-contents';
import markdownItTaskLists from 'markdown-it-task-lists';
import { full as markdownItEmoji } from 'markdown-it-emoji';
import DOMPurify from 'dompurify';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
})
  .use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.headerLink(),
    permalinkBefore: true,
    permalinkSymbol: '#'
  })
  .use(markdownItToc, {
    includeLevel: [1, 2, 3, 4, 5, 6],
    containerClass: 'table-of-contents'
  })
  .use(markdownItTaskLists, {
    enabled: true,
    label: true,
    labelAfter: true
  })
  .use(markdownItEmoji);

md.renderer.rules.table_open = () => '<div class="table-wrapper"><table>';
md.renderer.rules.table_close = () => '</table></div>';

md.renderer.rules.code_block = (tokens, idx) => {
  const token = tokens[idx];
  const langName = token.info ? token.info.trim() : '';
  const langClass = langName ? ` language-${langName}` : '';
  
  return `<pre class="code-block${langClass}"><code${langClass}>${md.utils.escapeHtml(token.content)}</code></pre>`;
};

export const renderMarkdown = (content) => {
  if (!content) return '';
  const rendered = md.render(content);
  return DOMPurify.sanitize(rendered);
};

export const getWordCount = (content) => {
  if (!content) return 0;
  return content.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const getCharacterCount = (content) => {
  return content ? content.length : 0;
};

export const getReadingTime = (content) => {
  const wordsPerMinute = 200;
  const wordCount = getWordCount(content);
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes;
};
