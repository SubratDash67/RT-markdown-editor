import { useEffect, useRef, useState } from 'react';
import { yCollab } from 'y-codemirror.next';
import { useCollaboration } from '../contexts/CollaborationContext';
import { useDocument } from '../contexts/DocumentContext';

export const useCollaborativeEditor = () => {
  const { ydoc, awareness, isConnected } = useCollaboration();
  const { currentDocument, updateDocument } = useDocument();
  const [ytext, setYtext] = useState(null);
  const [undoManager, setUndoManager] = useState(null);
  const [collaborativeExtensions, setCollaborativeExtensions] = useState([]);
  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    if (!ydoc || !awareness || !currentDocument) {
      setYtext(null);
      setUndoManager(null);
      setCollaborativeExtensions([]);
      return;
    }

    const newYtext = ydoc.getText('content');
    const newUndoManager = new Y.UndoManager(newYtext);

    if (currentDocument.content && newYtext.length === 0) {
      newYtext.insert(0, currentDocument.content);
    }

    const extensions = [
      yCollab(newYtext, awareness, {
        undoManager: newUndoManager,
      }),
    ];

    newYtext.observe((event) => {
      if (event.transaction.origin !== 'sync') {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        
        syncTimeoutRef.current = setTimeout(() => {
          const content = newYtext.toString();
          if (content !== currentDocument.content) {
            updateDocument(currentDocument.id, {
              content,
              updated_at: new Date().toISOString()
            });
          }
        }, 2000);
      }
    });

    setYtext(newYtext);
    setUndoManager(newUndoManager);
    setCollaborativeExtensions(extensions);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [ydoc, awareness, currentDocument]);

  const forceSave = () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    if (ytext && currentDocument) {
      const content = ytext.toString();
      updateDocument(currentDocument.id, {
        content,
        updated_at: new Date().toISOString()
      });
    }
  };

  return {
    ytext,
    undoManager,
    collaborativeExtensions,
    isConnected,
    forceSave,
  };
};
