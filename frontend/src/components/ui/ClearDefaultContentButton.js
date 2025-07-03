import React from 'react';
import { useDocument } from '../../contexts/DocumentContext';

const ClearDefaultContentButton = () => {
  const { currentDocument, updateDocument } = useDocument();

  const handleClearContent = async () => {
    if (window.confirm('This will clear all content from the current document. Are you sure?')) {
      // Clear database content
      if (currentDocument) {
        await updateDocument(currentDocument.id, { content: '' });
      }
      
      // Emit event to clear Y.js content if it exists
      const clearEvent = new CustomEvent('clearYjsContent');
      window.dispatchEvent(clearEvent);
      
      console.log('Document content cleared');
    }
  };

  // Only show this button if content contains default text
  const hasDefaultContent = currentDocument?.content?.includes('Welcome to your new document') ||
                           currentDocument?.content?.includes('Start typing here...') ||
                           currentDocument?.content?.includes('Welcome to Real-Time Markdown');

  if (!hasDefaultContent) return null;

  return (
    <button
      onClick={handleClearContent}
      className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
      title="Clear default content"
    >
      Clear Default Content
    </button>
  );
};

export default ClearDefaultContentButton;
