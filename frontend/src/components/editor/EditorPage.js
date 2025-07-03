import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocument } from '../../contexts/DocumentContext';
import { useAuth } from '../../contexts/AuthContext';
import { CollaborationProvider } from '../../contexts/CollaborationContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import { ContributionTracker } from '../../utils/contributionTracker';
import TopBar from '../ui/TopBar';
import CollaborativeMarkdownEditor from './CollaborativeMarkdownEditor';
import MarkdownPreview from '../preview/MarkdownPreview';
import LoadingSpinner from '../ui/LoadingSpinner';

const EditorPageContent = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentDocument, 
    loading, 
    createDocument, 
    loadDocument, 
    updateDocument 
  } = useDocument();

  const [documentTitle, setDocumentTitle] = useState('');
  const [previewMode, setPreviewMode] = useState('split');
  const [lastSaved, setLastSaved] = useState(null);
  const [contributionTracker, setContributionTracker] = useState(null);

  // Use stable references for auto-save to prevent re-renders
  const documentContent = currentDocument?.content || '';
  const { forceSave, isUnsaved } = useAutoSave(documentContent, documentTitle);

  const handleNewDocument = async () => {
    const { data, error } = await createDocument();
    if (!error && data) {
      navigate(`/editor/${data.id}`);
    }
  };

  const handleTitleChange = async (newTitle) => {
    setDocumentTitle(newTitle);
    if (currentDocument && newTitle !== currentDocument.title) {
      await updateDocument(currentDocument.id, { title: newTitle });
    }
  };

  const handleSave = () => {
    forceSave();
    setLastSaved(new Date());
  };

  useEffect(() => {
    if (documentId && documentId !== currentDocument?.id) {
      loadDocument(documentId);
    } else if (!documentId && !currentDocument) {
      handleNewDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, currentDocument?.id]); // Functions are not stable, disable lint

  useEffect(() => {
    if (currentDocument) {
      setDocumentTitle(currentDocument.title);
      setLastSaved(new Date(currentDocument.updated_at));

      // Initialize contribution tracking only once per document
      if (user && currentDocument.id) {
        // Clean up existing tracker first
        if (contributionTracker) {
          contributionTracker.stop();
        }
        
        const tracker = new ContributionTracker(currentDocument.id, user.id);
        tracker.start();
        setContributionTracker(tracker);
      }
    }

    return () => {
      if (contributionTracker) {
        contributionTracker.stop();
        setContributionTracker(null);
      }
    };
  }, [currentDocument?.id, user?.id]); // Only depend on IDs to prevent unnecessary re-runs

  useEffect(() => {
    // Track content changes for contribution metrics
    if (contributionTracker && currentDocument?.content) {
      contributionTracker.trackChange(currentDocument.content);
    }
  }, [currentDocument?.content, contributionTracker]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const content = currentDocument?.content || '';

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopBar
        documentTitle={documentTitle}
        onTitleChange={handleTitleChange}
        isModified={isUnsaved}
        lastSaved={lastSaved}
        onSave={handleSave}
        onNewDocument={handleNewDocument}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className={`${previewMode === 'preview' ? 'hidden' : previewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
          <CollaborativeMarkdownEditor
            placeholder="# Start writing your collaborative markdown here...\n\nThis editor supports:\n- Real-time collaboration\n- Auto-save every 2 seconds\n- Version history\n- Contribution tracking\n- Shareable links\n\nStart typing to see the magic happen!"
          />
        </div>

        <div className={`${previewMode === 'editor' ? 'hidden' : previewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
          <MarkdownPreview
            content={content}
            showStats={true}
          />
        </div>
      </div>

      <div className="h-8 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Collaborative Markdown</span>
          <span>UTF-8</span>
          <span>Line {content.split('\n').length}</span>
          {isUnsaved && <span className="text-orange-600">● Unsaved changes</span>}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode('editor')}
            className={`px-2 py-1 rounded ${previewMode === 'editor' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
          >
            Editor
          </button>
          <button
            onClick={() => setPreviewMode('split')}
            className={`px-2 py-1 rounded ${previewMode === 'split' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
          >
            Split
          </button>
          <button
            onClick={() => setPreviewMode('preview')}
            className={`px-2 py-1 rounded ${previewMode === 'preview' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  );
};

const EditorPage = () => {
  return (
    <CollaborationProvider>
      <EditorPageContent />
    </CollaborationProvider>
  );      
}
export default EditorPage;