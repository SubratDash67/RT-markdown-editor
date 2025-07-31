import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDocument } from '../../contexts/DocumentContext';
import { 
  Share2, 
  User, 
  FileText, 
  Settings,
  LogOut,
  Plus,
  Clock,
  History,
  BarChart3
} from 'lucide-react';
import UserPresence from '../collaboration/UserPresence';
import CollaborationToolbar from '../collaboration/CollaborationToolbar';
import VersionHistory from '../versioning/VersionHistory';
import ShareDialog from '../sharing/ShareDialog';
import ContributionMetrics from '../metrics/ContributionMetrics';

const SettingsModal = ({ isOpen, onClose }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [autoSave, setAutoSave] = useState(localStorage.getItem('autoSave') !== 'false');
  const [notifications, setNotifications] = useState(localStorage.getItem('notifications') !== 'false');

  const handleSaveSettings = () => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('autoSave', autoSave.toString());
    localStorage.setItem('notifications', notifications.toString());
    
    // Apply theme immediately
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-theme', theme);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto-save
            </label>
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Notifications
            </label>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="rounded"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const TopBar = ({ 
  documentTitle, 
  onTitleChange, 
  isModified, 
  lastSaved, 
  onSave,
  onNewDocument 
}) => {
  const { user, signOut } = useAuth();
  const { documents } = useDocument();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleTitleSubmit = (e) => {
    e.preventDefault();
    setIsEditingTitle(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const formatLastSaved = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <>
      <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onNewDocument}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="New Document"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            {isEditingTitle ? (
              <form onSubmit={handleTitleSubmit} className="flex-1">
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  className="bg-transparent border-none outline-none font-medium text-gray-900 dark:text-white min-w-0"
                  autoFocus
                />
              </form>
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="font-medium text-gray-900 dark:text-white hover:text-blue-600 transition-colors truncate max-w-xs"
              >
                {documentTitle || 'Untitled Document'}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <CollaborationToolbar onSave={onSave} />
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {isModified && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                Unsaved
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatLastSaved(lastSaved)}
            </span>
          </div>

          <UserPresence />

          <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
            <button
              onClick={() => setShowVersionHistory(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Version History"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowMetrics(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Contribution Metrics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowShareDialog(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share Document"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {documents.length} documents
                  </p>
                </div>
                
                <button 
                  onClick={() => {
                    setShowSettings(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <VersionHistory 
        isOpen={showVersionHistory} 
        onClose={() => setShowVersionHistory(false)} 
      />
      
      <ShareDialog 
        isOpen={showShareDialog} 
        onClose={() => setShowShareDialog(false)} 
      />
      
      <ContributionMetrics 
        isOpen={showMetrics} 
        onClose={() => setShowMetrics(false)} 
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

export default TopBar;
