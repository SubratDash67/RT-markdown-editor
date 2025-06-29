import React from 'react';
import { useCollaborativeEditor } from '../../hooks/useCollaborativeEditor';
import { Undo2, Redo2, Save } from 'lucide-react';

const CollaborationToolbar = ({ onSave }) => {
  const { undoManager, forceSave } = useCollaborativeEditor();

  const handleUndo = () => {
    if (undoManager) {
      undoManager.undo();
    }
  };

  const handleRedo = () => {
    if (undoManager) {
      undoManager.redo();
    }
  };

  const handleSave = () => {
    forceSave();
    if (onSave) onSave();
  };

  return (
    <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
      <button
        onClick={handleUndo}
        disabled={!undoManager}
        className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      
      <button
        onClick={handleRedo}
        disabled={!undoManager}
        className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>
      
      <button
        onClick={handleSave}
        className="p-1.5 hover:bg-gray-100 rounded"
        title="Save (Ctrl+S)"
      >
        <Save className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CollaborationToolbar;
