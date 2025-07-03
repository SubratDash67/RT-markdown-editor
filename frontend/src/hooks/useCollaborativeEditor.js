import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs'; // Correct import
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

    // Only insert content if Y.js doc is empty AND we have content to insert
    // Also check if the content is different to prevent loops
    if (currentDocument.content && 
        newYtext.length === 0 && 
        currentDocument.content !== newYtext.toString()) {
      newYtext.insert(0, currentDocument.content);
    }

    const extensions = [
      yCollab(newYtext, awareness, {
        undoManager: newUndoManager,
      }),
    ];

    let isUpdating = false; // Flag to prevent update loops

    newYtext.observe((event) => {
      // Prevent loops by ignoring sync operations and our own updates
      if (event.transaction.origin !== 'sync' && !isUpdating) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        
        syncTimeoutRef.current = setTimeout(() => {
          const content = newYtext.toString();
          // Only update if content actually changed
          if (content !== currentDocument.content) {
            isUpdating = true;
            updateDocument(currentDocument.id, {
              content,
              updated_at: new Date().toISOString()
            }).finally(() => {
              isUpdating = false;
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
  }, [ydoc, awareness, currentDocument?.id]); // Use currentDocument.id instead of full object

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
