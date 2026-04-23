import { useState } from 'react';
import { socket } from '../socket';
import { Role } from '../models';
import type { RoomState } from '../models';
import { Play, Pause, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface ControlsProps {
  roomState: RoomState | null;
  isHostOrModerator: boolean;
}

const Controls: React.FC<ControlsProps> = ({ roomState, isHostOrModerator }) => {
  const [videoUrl, setVideoUrl] = useState('');

  const handlePlay = () => socket.emit('play');
  const handlePause = () => socket.emit('pause');
  
  const handleChangeVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;

    // Extract video ID from URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = videoUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (videoId) {
      socket.emit('change_video', { videoId });
      setVideoUrl('');
    } else {
      alert('Invalid YouTube URL');
    }
  };

  return (
    <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        {/* Playback Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={roomState?.playState === 'playing' ? handlePause : handlePlay}
            disabled={!isHostOrModerator}
            className={`p-4 rounded-full transition-all ${
              isHostOrModerator 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20' 
                : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
            }`}
          >
            {roomState?.playState === 'playing' ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
          
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Status</span>
            <span className="text-lg font-bold flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${roomState?.playState === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
              {roomState?.playState === 'playing' ? 'Playing' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Change Video */}
        <form onSubmit={handleChangeVideo} className="flex-1 w-full max-w-xl flex gap-2">
          <div className="flex-1 relative">
            <LinkIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={!isHostOrModerator}
              placeholder="Paste YouTube video URL..."
              className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={!isHostOrModerator || !videoUrl}
            className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition-colors"
          >
            Update
          </button>
        </form>
      </div>

      {!isHostOrModerator && (
        <div className="flex items-center gap-2 text-sm text-yellow-500/80 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
          <AlertCircle size={16} />
          <span>Playback controls are restricted to Host and Moderators.</span>
        </div>
      )}
    </div>
  );
};

export default Controls;
