import React, { useState, useEffect } from 'react';
import { VersionManager } from '../../utils/versionManager';
import { useDocument } from '../../contexts/DocumentContext';
import { Clock, User, RotateCcw, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

const VersionHistory = ({ isOpen, onClose }) => {
  const { currentDocument } = useDocument();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [expandedVersions, setExpandedVersions] = useState(new Set());

  useEffect(() => {
    if (isOpen && currentDocument) {
      loadVersions();
    }
  }, [isOpen, currentDocument]);

  const loadVersions = async () => {
    setLoading(true);
    const { data, error } = await VersionManager.getVersions(currentDocument.id);
    if (!error) {
      setVersions(data);
    }
    setLoading(false);
  };

  const handleRestore = async (versionNumber) => {
    if (window.confirm(`Are you sure you want to restore to version ${versionNumber}? This will create a new version with the restored content.`)) {
      const { error } = await VersionManager.restoreVersion(currentDocument.id, versionNumber);
      if (!error) {
        onClose();
        window.location.reload(); // Refresh to show restored content
      }
    }
  };

  const toggleVersionExpansion = (versionId) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Version History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {loading ? (
              <div className="p-4">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedVersion?.id === version.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">v{version.version_number}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVersionExpansion(version.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {expandedVersions.has(version.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.created_by_user?.email || 'Unknown'}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(version.created_at)}
                      </div>
                    </div>

                    {expandedVersions.has(version.id) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-700 mb-2">{version.title}</p>
                        {version.changes_summary && (
                          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            {version.changes_summary}
                          </p>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(version.version_number);
                          }}
                          className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {selectedVersion ? (
              <div>
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-lg">{selectedVersion.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>Version {selectedVersion.version_number}</span>
                    <span>{formatDate(selectedVersion.created_at)}</span>
                    <span>{selectedVersion.created_by_user?.email}</span>
                  </div>
                  {selectedVersion.changes_summary && (
                    <p className="mt-2 text-sm text-gray-700">
                      Changes: {selectedVersion.changes_summary}
                    </p>
                  )}
                </div>
                
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg">
                    {selectedVersion.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a version to view its content
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
