import React, { useMemo } from 'react';
import { renderMarkdown, getWordCount, getCharacterCount, getReadingTime } from '../../utils/markdown';

const MarkdownPreview = ({ content, showStats = true }) => {
  const renderedContent = useMemo(() => {
    return renderMarkdown(content);
  }, [content]);

  const stats = useMemo(() => {
    if (!showStats) return null;
    
    return {
      words: getWordCount(content),
      characters: getCharacterCount(content),
      readingTime: getReadingTime(content),
    };
  }, [content, showStats]);

  return (
    <div className="h-full w-full bg-gray-50 flex flex-col">
      {showStats && (
        <div className="px-4 py-2 bg-white border-b border-gray-200 text-xs text-gray-500 flex gap-4">
          <span>{stats.words} words</span>
          <span>{stats.characters} characters</span>
          <span>{stats.readingTime} min read</span>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        <div 
          className="markdown-preview p-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
      </div>
    </div>
  );
};

export default MarkdownPreview;
