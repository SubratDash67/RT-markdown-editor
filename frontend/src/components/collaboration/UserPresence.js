import React from 'react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import { Users, Wifi, WifiOff } from 'lucide-react';

const UserPresence = ({ showDetails = true }) => {
  const { connectedUsers, isConnected, userColor } = useCollaboration();

  const userList = Array.from(connectedUsers.values());

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
        <span className="text-xs text-gray-500">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {showDetails && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">
              {userList.length + 1} online
            </span>
          </div>

          <div className="flex items-center -space-x-2">
            <div
              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: userColor }}
              title="You"
            >
              Y
            </div>
            
            {userList.slice(0, 3).map((user, index) => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full border-2 border-white overflow-hidden"
                title={user.name}
                style={{ zIndex: 10 - index }}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            
            {userList.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs font-medium text-white">
                +{userList.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPresence;
