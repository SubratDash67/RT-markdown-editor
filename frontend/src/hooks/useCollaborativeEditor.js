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
      console.log('Initializing Y.js document with content');
      newYtext.insert(0, currentDocument.content);
    } else if (newYtext.length > 0) {
      // Check if Y.js contains unwanted default content and clear it
      const ytextContent = newYtext.toString();
      const isDefaultContent = ytextContent.includes('Welcome to your new document') || 
                              ytextContent.includes('Start typing here...');
      
      if (isDefaultContent && (!currentDocument.content || currentDocument.content === '')) {
        console.log('Clearing unwanted default content from Y.js');
        newYtext.delete(0, newYtext.length);
      } else {
        // If Y.js already has valid content, emit it for preview sync
        setTimeout(() => {
          const changeEvent = new CustomEvent('ytextChange', { 
            detail: { content: ytextContent, isInitial: true } 
          });
          window.dispatchEvent(changeEvent);
        }, 100);
      }
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
        }, 1000); // Reduced from 2000ms to 1000ms for better sync
      }
    });

    // Track Y.js text changes for contributions
    let lastTrackedContent = '';
    
    newYtext.observe((event) => {
      // Emit content change event for contribution tracking
      const content = newYtext.toString();
      
      // Only emit if content actually changed from last tracked content
      if (content !== lastTrackedContent) {
        const changeEvent = new CustomEvent('ytextChange', { 
          detail: { 
            content, 
            event,
            changes: event.changes,
            transaction: event.transaction
          } 
        });
        window.dispatchEvent(changeEvent);
        lastTrackedContent = content;
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

  const clearDefaultContent = () => {
    if (ytext) {
      const content = ytext.toString();
      const hasDefaultContent = content.includes('Welcome to your new document') || 
                               content.includes('Start typing here...') ||
                               content.includes('Welcome to Real-Time Markdown');
      
      if (hasDefaultContent) {
        console.log('Clearing default content from Y.js document');
        ytext.delete(0, ytext.length);
      }
    }
  };

  return {
    ytext,
    undoManager,
    collaborativeExtensions,
    isConnected,
    forceSave,
    clearDefaultContent,
  };
};
