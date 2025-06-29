import { useState, useCallback, useRef, useEffect } from 'react';
import { useDocument } from '../contexts/DocumentContext';

export const useEditor = (initialContent = '') => {
  const { currentDocument, updateDocument } = useDocument();
  const [content, setContent] = useState(initialContent);
  const [isModified, setIsModified] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeoutRef = useRef(null);
  const editorRef = useRef(null);

  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    setIsModified(true);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (currentDocument && newContent !== currentDocument.content) {
        saveDocument(newContent);
      }
    }, 2000);
  }, [currentDocument]);

  const saveDocument = useCallback(async (contentToSave = content) => {
    if (!currentDocument) return;
    
    try {
      await updateDocument(currentDocument.id, { 
        content: contentToSave,
        updated_at: new Date().toISOString()
      });
      setIsModified(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  }, [currentDocument, content, updateDocument]);

  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveDocument();
  }, [saveDocument]);

  useEffect(() => {
    if (currentDocument && currentDocument.content !== content) {
      setContent(currentDocument.content || '');
      setIsModified(false);
    }
  }, [currentDocument]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        forceSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [forceSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    content,
    isModified,
    lastSaved,
    editorRef,
    handleContentChange,
    forceSave,
  };
};
