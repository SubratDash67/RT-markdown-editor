import React from 'react';
import { useCollaborativeEditor } from '../hooks/useCollaborativeEditor';
import { useDocument } from '../contexts/DocumentContext';

const ClearDefaultContentButton = () => {
  const { clearDefaultContent } = useCollaborativeEditor();
  const { currentDocument, updateDocument } = useDocument();

  const handleClearContent = async () => {
    if (window.confirm('This will clear all content from the current document. Are you sure?')) {
      // Clear Y.js content
      clearDefaultContent();
      
      // Clear database content
      if (currentDocument) {
        await updateDocument(currentDocument.id, { content: '' });
      }
      
      console.log('Document content cleared');
    }
  };

  // Only show this button in development or if content contains default text
  const shouldShow = process.env.NODE_ENV === 'development' || 
                    currentDocument?.content?.includes('Welcome to your new document') ||
                    currentDocument?.content?.includes('Start typing here...');

  if (!shouldShow) return null;

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
