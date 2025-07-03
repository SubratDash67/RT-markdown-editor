import React, { useMemo, useState, useEffect } from 'react';
import { renderMarkdown, getWordCount, getCharacterCount, getReadingTime } from '../../utils/markdown';

const MarkdownPreview = ({ content, showStats = true }) => {
  const [liveContent, setLiveContent] = useState(content);

  // Listen for real-time content updates
  useEffect(() => {
    const handleContentUpdate = (event) => {
      if (event.detail?.content !== undefined) {
        setLiveContent(event.detail.content);
      }
    };

    window.addEventListener('ytextChange', handleContentUpdate);
    return () => {
      window.removeEventListener('ytextChange', handleContentUpdate);
    };
  }, []);

  // Update content when prop changes
  useEffect(() => {
    setLiveContent(content);
  }, [content]);

  const renderedContent = useMemo(() => {
    return renderMarkdown(liveContent);
  }, [liveContent]);

  const stats = useMemo(() => {
    if (!showStats) return null;
    
    return {
      words: getWordCount(liveContent),
      characters: getCharacterCount(liveContent),
      readingTime: getReadingTime(liveContent),
    };
  }, [liveContent, showStats]);

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
