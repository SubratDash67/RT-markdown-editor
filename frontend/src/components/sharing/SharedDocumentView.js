import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShareManager } from '../../utils/shareManager';
import MarkdownPreview from '../preview/MarkdownPreview';
import CollaborativeMarkdownEditor from '../editor/CollaborativeMarkdownEditor';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Eye, Edit, Lock, ExternalLink } from 'lucide-react';

const SharedDocumentView = () => {
  const { shareToken } = useParams();
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('preview');

  useEffect(() => {
    loadSharedDocument();
  }, [shareToken]);

  const loadSharedDocument = async () => {
    try {
      const { data, error } = await ShareManager.getDocumentByToken(shareToken);
      if (error) {
        setError(error.message);
      } else {
        setShareData(data);
        setViewMode(data.permission_level === 'edit' ? 'split' : 'preview');
      }
    } catch (err) {
      setError('Failed to load shared document');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Editor
          </button>
        </div>
      </div>
    );
  }

  const document = shareData.document;
  const canEdit = shareData.permission_level === 'edit';

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {canEdit ? (
              <Edit className="w-4 h-4 text-green-600" />
            ) : (
              <Eye className="w-4 h-4 text-blue-600" />
            )}
            <h1 className="font-medium text-gray-900">{document.title}</h1>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {canEdit ? 'Can Edit' : 'View Only'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-4 h-4" />
            Open Editor
          </a>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {canEdit && viewMode === 'split' && (
          <div className="w-1/2 flex flex-col">
            <CollaborativeMarkdownEditor
              placeholder="You have edit access to this shared document..."
              readOnly={false}
            />
          </div>
        )}

        <div className={`${canEdit && viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
          <MarkdownPreview
            content={document.content}
            showStats={true}
          />
        </div>
      </div>

      {canEdit && (
        <div className="h-8 bg-gray-100 border-t border-gray-200 flex items-center justify-end px-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-2 py-1 rounded ${viewMode === 'edit' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
            >
              Editor
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 rounded ${viewMode === 'split' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 rounded ${viewMode === 'preview' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
            >
              Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedDocumentView;
