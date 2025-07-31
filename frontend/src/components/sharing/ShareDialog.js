import React, { useState, useEffect, useRef } from 'react';
import { ShareManager } from '../../utils/shareManager';
import { useDocument } from '../../contexts/DocumentContext';
import { 
  Share2, 
  Copy, 
  Eye, 
  Edit, 
  Calendar, 
  Trash2, 
  Check,
  ExternalLink 
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

const ShareDialog = ({ isOpen, onClose }) => {
  const { currentDocument } = useDocument();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSharePermission, setNewSharePermission] = useState('view');
  const [newShareExpiry, setNewShareExpiry] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentDocument) {
      loadShares();
    }
    
    // Cleanup on unmount
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, [isOpen, currentDocument]);

  const loadShares = async () => {
    setLoading(true);
    const { data, error } = await ShareManager.getShares(currentDocument.id);
    if (!error) {
      setShares(data);
    }
    setLoading(false);
  };

  const handleCreateShare = async () => {
    setCreating(true);
    const expiresInDays = newShareExpiry ? parseInt(newShareExpiry) : null;
    const { data, error } = await ShareManager.createShare(
      currentDocument.id,
      newSharePermission,
      expiresInDays
    );
    
    if (!error) {
      setShares([data, ...shares]);
      setNewSharePermission('view');
      setNewShareExpiry('');
    }
    setCreating(false);
  };

  const handleCopyLink = async (shareToken) => {
    const url = ShareManager.buildShareUrl(shareToken);
    await navigator.clipboard.writeText(url);
    setCopiedToken(shareToken);
    
    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    
    copyTimeoutRef.current = setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevokeShare = async (shareId) => {
    if (window.confirm('Are you sure you want to revoke this share link?')) {
      const { error } = await ShareManager.revokeShare(shareId);
      if (!error) {
        setShares(shares.filter(share => share.id !== shareId));
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiresAt) => {
    return expiresAt && new Date(expiresAt) < new Date();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-3/4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Document
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h3 className="font-medium mb-3">Create New Share Link</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Level
                </label>
                <select
                  value={newSharePermission}
                  onChange={(e) => setNewSharePermission(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="view">View Only</option>
                  <option value="edit">Can Edit</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires In (Days)
                </label>
                <select
                  value={newShareExpiry}
                  onChange={(e) => setNewShareExpiry(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Never</option>
                  <option value="1">1 Day</option>
                  <option value="7">1 Week</option>
                  <option value="30">1 Month</option>
                  <option value="90">3 Months</option>
                </select>
              </div>
              
              <button
                onClick={handleCreateShare}
                disabled={creating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <LoadingSpinner size="sm" /> : <Share2 className="w-4 h-4" />}
                Create Share Link
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Existing Share Links</h3>
            {loading ? (
              <LoadingSpinner />
            ) : shares.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No share links created yet</p>
            ) : (
              <div className="space-y-3">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className={`border rounded-lg p-3 ${
                      isExpired(share.expires_at) ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {share.permission_level === 'edit' ? (
                          <Edit className="w-4 h-4 text-green-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="font-medium capitalize">
                          {share.permission_level} Access
                        </span>
                        {isExpired(share.expires_at) && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Expired
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyLink(share.token)} // Fixed: 'token' instead of 'share_token'
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Copy Link"
                        >
                          {copiedToken === share.token ? ( // Fixed: 'token' instead of 'share_token'
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => window.open(ShareManager.buildShareUrl(share.token), '_blank')} // Fixed: 'token' instead of 'share_token'
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Open Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleRevokeShare(share.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Revoke"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span>Created {formatDate(share.created_at)}</span>
                        {share.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expires {formatDate(share.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <input
                        type="text"
                        value={ShareManager.buildShareUrl(share.token)} // Fixed: 'token' instead of 'share_token'
                        readOnly
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
