// This is the main "Room" page where the party happens!
// It manages the list of people, the video state, and handles all the socket events.
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Role } from '../models';
import type { User, RoomState } from '../models';
import Player from '../components/Player';
import ParticipantList from '../components/ParticipantList';
import Controls from '../components/Controls';
import { Share2, LogOut, Shield } from 'lucide-react';

const Room: React.FC = () => {
  // Getting the room ID from the URL and username from the previous page's state
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username;

  const [participants, setParticipants] = useState<User[]>([]);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myUser, setMyUser] = useState<User | null>(null);

  useEffect(() => {
    // If someone tries to go directly to /room without a name, send them back home
    if (!username || !roomId) {
      navigate('/');
      return;
    }

    const onConnect = () => {
      console.log('Connected to server!');
      socket.emit('join_room', { roomId, username });
    };

    const onUserJoined = ({ participants: updatedParticipants }: { participants: User[] }) => {
      setParticipants(updatedParticipants);
      const me = updatedParticipants.find((u: User) => u.id === socket.id);
      if (me) setMyUser(me);
    };

    const onUserLeft = ({ participants: updatedParticipants }: { participants: User[] }) => {
      setParticipants(updatedParticipants);
    };

    const onSyncState = (state: RoomState) => {
      setRoomState(state);
    };

    const onRoleAssigned = ({ userId, role, participants: updatedParticipants }: { userId: string, role: Role, participants: User[] }) => {
      setParticipants(updatedParticipants);
      if (userId === socket.id) {
        setMyUser(prev => prev ? { ...prev, role } : null);
      }
    };

    const onParticipantRemoved = ({ userId, participants: updatedParticipants }: { userId: string, participants: User[] }) => {
      if (userId === socket.id) {
        alert('You have been removed from the room by the host.');
        navigate('/');
      } else {
        setParticipants(updatedParticipants);
      }
    };

    const onConnectError = (error: Error) => {
      console.error('Connection error:', error);
      // Optional: Handle error UI
    };

    // Register listeners BEFORE connecting
    socket.on('connect', onConnect);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('sync_state', onSyncState);
    socket.on('role_assigned', onRoleAssigned);
    socket.on('participant_removed', onParticipantRemoved);
    socket.on('connect_error', onConnectError);

    socket.connect();

    // Cleanup when we leave the page
    return () => {
      socket.off('connect', onConnect);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('sync_state', onSyncState);
      socket.off('role_assigned', onRoleAssigned);
      socket.off('participant_removed', onParticipantRemoved);
      socket.off('connect_error', onConnectError);
      socket.disconnect();
    };
  }, [roomId, username, navigate]);

  // Helper to copy the room link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard! Send it to your friends.');
  };

  // We check if the user is a Host or Moderator to enable/disable controls
  const isHostOrModerator = myUser?.role === Role.Host || myUser?.role === Role.Moderator;

  if (!myUser) return <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white italic">Setting up your party...</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col font-sans">
      {/* Header section with Room ID and Invite/Leave buttons */}
      <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2 rounded-lg">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="font-bold text-lg">Watch Party Room</h2>
            <p className="text-xs text-neutral-400">ID: {roomId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition-colors"
          >
            <Share2 size={16} />
            Invite
          </button>
          <button 
            onClick={() => {
              socket.emit('leave_room', { roomId });
              navigate('/');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg text-sm transition-colors font-medium"
          >
            <LogOut size={16} />
            Leave
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Video & Controls */}
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
          <div className="flex-1 bg-black rounded-2xl overflow-hidden shadow-2xl relative group">
            {roomState && (
              <Player 
                state={roomState}
                isHostOrModerator={isHostOrModerator}
              />
            )}
          </div>
          
          <Controls 
            roomState={roomState} 
            isHostOrModerator={isHostOrModerator}
          />
        </div>

        {/* Right: Participants */}
        <aside className="w-80 border-l border-neutral-800 bg-neutral-900 flex flex-col">
          <ParticipantList 
            participants={participants} 
            myId={socket.id || ''}
            myRole={myUser.role}
          />
        </aside>
      </main>
    </div>
  );
};

export default Room;
