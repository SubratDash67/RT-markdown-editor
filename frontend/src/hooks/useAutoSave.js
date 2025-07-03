import { useEffect, useRef, useCallback } from 'react';
import { useDocument } from '../contexts/DocumentContext';
import { VersionManager } from '../utils/versionManager';

export const useAutoSave = (content, title) => {
  const { currentDocument, updateDocument } = useDocument();
  const saveTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef('');
  const lastSavedTitleRef = useRef('');
  const versionTimeoutRef = useRef(null);

  const saveDocument = useCallback(async (contentToSave, titleToSave) => {
    if (!currentDocument) return;

    // Prevent saving if content hasn't actually changed
    if (contentToSave === lastSavedContentRef.current && 
        titleToSave === lastSavedTitleRef.current) {
      return;
    }

    try {
      await updateDocument(currentDocument.id, {
        content: contentToSave,
        title: titleToSave,
        updated_at: new Date().toISOString()
      });

      lastSavedContentRef.current = contentToSave;
      lastSavedTitleRef.current = titleToSave;

      // Create version snapshot every 5 minutes of significant changes
      if (versionTimeoutRef.current) {
        clearTimeout(versionTimeoutRef.current);
      }

      versionTimeoutRef.current = setTimeout(async () => {
        const changesSummary = VersionManager.generateChangesSummary(
          currentDocument.content,
          contentToSave
        );

        if (changesSummary !== 'No changes') {
          await VersionManager.createVersion(
            currentDocument.id,
            titleToSave,
            contentToSave,
            `Auto-save: ${changesSummary}`
          );
        }
      }, 5 * 60 * 1000); // 5 minutes

    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [currentDocument, updateDocument]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (
        content !== lastSavedContentRef.current ||
        title !== lastSavedTitleRef.current
      ) {
        saveDocument(content, title);
      }
    }, 2000); // 2 second debounce
  }, [content, title, saveDocument]);

  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveDocument(content, title);
  }, [content, title, saveDocument]);

  useEffect(() => {
    if (currentDocument) {
      lastSavedContentRef.current = currentDocument.content || '';
      lastSavedTitleRef.current = currentDocument.title || '';
    }
  }, [currentDocument]);

  useEffect(() => {
    debouncedSave();
  }, [debouncedSave]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (
        content !== lastSavedContentRef.current ||
        title !== lastSavedTitleRef.current
      ) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [content, title]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (versionTimeoutRef.current) {
        clearTimeout(versionTimeoutRef.current);
      }
    };
  }, []);

  return {
    forceSave,
    isUnsaved: content !== lastSavedContentRef.current || title !== lastSavedTitleRef.current
  };
};
