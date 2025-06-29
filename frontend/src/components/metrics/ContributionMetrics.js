import React, { useState, useEffect } from 'react';
import { ContributionTracker } from '../../utils/contributionTracker';
import { useDocument } from '../../contexts/DocumentContext';
import { BarChart3, Users, Clock, TrendingUp, Plus, Minus } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

const ContributionMetrics = ({ isOpen, onClose }) => {
  const { currentDocument } = useDocument();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    if (isOpen && currentDocument) {
      loadContributions();
    }
  }, [isOpen, currentDocument, timeRange]);

  const loadContributions = async () => {
    setLoading(true);
    const { data, error } = await ContributionTracker.getDocumentContributions(currentDocument.id);
    if (!error) {
      const filtered = filterByTimeRange(data);
      setContributions(aggregateContributions(filtered));
    }
    setLoading(false);
  };

  const filterByTimeRange = (data) => {
    if (timeRange === 'all') return data;
    
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeRange) {
      case '24h':
        cutoff.setHours(now.getHours() - 24);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(now.getDate() - 30);
        break;
      default:
        return data;
    }
    
    return data.filter(contrib => new Date(contrib.last_activity) >= cutoff);
  };

  const aggregateContributions = (data) => {
    const userMap = new Map();
    
    data.forEach(contrib => {
      const userId = contrib.user_id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user: contrib.user,
          totalInsertions: 0,
          totalDeletions: 0,
          totalCharactersAdded: 0,
          totalCharactersRemoved: 0,
          totalTimeSpent: 0,
          sessionCount: 0,
          lastActivity: contrib.last_activity
        });
      }
      
      const user = userMap.get(userId);
      user.totalInsertions += contrib.insertions;
      user.totalDeletions += contrib.deletions;
      user.totalCharactersAdded += contrib.characters_added;
      user.totalCharactersRemoved += contrib.characters_removed;
      user.totalTimeSpent += contrib.time_spent_seconds;
      user.sessionCount += 1;
      
      if (new Date(contrib.last_activity) > new Date(user.lastActivity)) {
        user.lastActivity = contrib.last_activity;
      }
    });
    
    return Array.from(userMap.values()).sort((a, b) => 
      (b.totalCharactersAdded + b.totalCharactersRemoved) - 
      (a.totalCharactersAdded + a.totalCharactersRemoved)
    );
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalStats = () => {
    return contributions.reduce((acc, contrib) => ({
      totalUsers: acc.totalUsers + 1,
      totalInsertions: acc.totalInsertions + contrib.totalInsertions,
      totalDeletions: acc.totalDeletions + contrib.totalDeletions,
      totalCharacters: acc.totalCharacters + contrib.totalCharactersAdded + contrib.totalCharactersRemoved,
      totalTime: acc.totalTime + contrib.totalTimeSpent
    }), {
      totalUsers: 0,
      totalInsertions: 0,
      totalDeletions: 0,
      totalCharacters: 0,
      totalTime: 0
    });
  };

  if (!isOpen) return null;

  const totalStats = getTotalStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Contribution Metrics
          </h2>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-2xl font-bold">{totalStats.totalUsers}</span>
              </div>
              <p className="text-sm text-gray-600">Contributors</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <Plus className="w-4 h-4" />
                <span className="text-2xl font-bold">{totalStats.totalInsertions}</span>
              </div>
              <p className="text-sm text-gray-600">Lines Added</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <Minus className="w-4 h-4" />
                <span className="text-2xl font-bold">{totalStats.totalDeletions}</span>
              </div>
              <p className="text-sm text-gray-600">Lines Removed</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-2xl font-bold">{formatTime(totalStats.totalTime)}</span>
              </div>
              <p className="text-sm text-gray-600">Time Spent</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          ) : contributions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No contribution data available for the selected time range
            </div>
          ) : (
            <div className="space-y-4">
              {contributions.map((contrib, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {contrib.user?.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{contrib.user?.email || 'Unknown User'}</p>
                        <p className="text-sm text-gray-600">
                          Last active: {formatDate(contrib.lastActivity)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{contrib.sessionCount} sessions</p>
                      <p className="text-sm text-gray-600">{formatTime(contrib.totalTimeSpent)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <Plus className="w-3 h-3" />
                        <span className="font-bold">{contrib.totalInsertions}</span>
                      </div>
                      <p className="text-gray-600">Lines Added</p>
                    </div>
                    
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                        <Minus className="w-3 h-3" />
                        <span className="font-bold">{contrib.totalDeletions}</span>
                      </div>
                      <p className="text-gray-600">Lines Removed</p>
                    </div>
                    
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span className="font-bold">{contrib.totalCharactersAdded}</span>
                      </div>
                      <p className="text-gray-600">Chars Added</p>
                    </div>
                    
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span className="font-bold">{contrib.totalCharactersRemoved}</span>
                      </div>
                      <p className="text-gray-600">Chars Removed</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContributionMetrics;
