import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && roomId) {
      navigate(`/room/${roomId}`, { state: { username } });
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (username) {
      const newRoomId = Math.random().toString(36).substring(2, 9);
      navigate(`/room/${newRoomId}`, { state: { username } });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-neutral-800 p-8 rounded-2xl shadow-2xl border border-neutral-700">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-600 p-3 rounded-xl">
              <Play size={32} fill="white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Watch Party</h1>
          <p className="mt-2 text-neutral-400">Watch YouTube videos together in sync.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="pt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Join a Room</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
                  placeholder="Room Code"
                />
                <button
                  onClick={handleJoin}
                  disabled={!username || !roomId}
                  className="px-4 py-3 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-700"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-neutral-800 px-2 text-neutral-500 font-semibold">Or</span>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={!username}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Users size={20} />
              Create New Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
