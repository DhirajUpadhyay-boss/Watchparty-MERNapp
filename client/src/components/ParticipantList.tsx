import React from 'react';
import { Role } from '../models';
import type { User } from '../models';
import { socket } from '../socket';
import { User as UserIcon, ShieldCheck, Trash2, Crown } from 'lucide-react';

interface ParticipantListProps {
  participants: User[];
  myId: string;
  myRole: Role;
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants, myId, myRole }) => {
  const isHost = myRole === 'Host';

  const handleRoleChange = (userId: string, newRole: Role) => {
    socket.emit('assign_role', { userId, role: newRole });
  };

  const handleRemove = (userId: string) => {
    if (window.confirm('Are you sure you want to remove this participant?')) {
      socket.emit('remove_participant', { userId });
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'Host': return <Crown size={14} className="text-yellow-500" />;
      case 'Moderator': return <ShieldCheck size={14} className="text-blue-500" />;
      default: return <UserIcon size={14} className="text-neutral-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          Participants
          <span className="bg-neutral-800 text-neutral-400 text-xs px-2 py-0.5 rounded-full">
            {participants.length}
          </span>
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {participants.map((user) => (
          <div 
            key={user.id} 
            className={`group flex items-center justify-between p-3 rounded-xl transition-all ${
              user.id === myId ? 'bg-red-600/10 border border-red-600/20' : 'hover:bg-neutral-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                user.role === 'Host' ? 'bg-yellow-500/20 text-yellow-500' : 
                user.role === 'Moderator' ? 'bg-blue-500/20 text-blue-500' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm">{user.username}</span>
                  {user.id === myId && <span className="text-[10px] text-red-500 font-bold uppercase">(You)</span>}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                  {getRoleIcon(user.role)}
                  {user.role}
                </div>
              </div>
            </div>

            {isHost && user.id !== myId && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                  className="bg-neutral-900 border border-neutral-700 text-[10px] rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-red-600"
                >
                  <option value="Participant">Participant</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <button
                  onClick={() => handleRemove(user.id)}
                  className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                  title="Remove Participant"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantList;
