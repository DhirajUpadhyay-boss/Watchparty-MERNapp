// This component is the heart of the app!
// It embeds the YouTube video and makes sure everyone is watching the same part.
import React, { useEffect, useRef } from 'react';
import { socket } from '../socket';
import type { RoomState } from '../models';

interface PlayerProps {
  state: RoomState;
  isHostOrModerator: boolean;
}

const Player: React.FC<PlayerProps> = ({ state, isHostOrModerator }) => {
  const playerRef = useRef<any>(null); // Ref to hold the YouTube player instance
  const isSyncing = useRef(false); // Flag to prevent infinite loop of sync events

  useEffect(() => {
    const initPlayer = () => {
      if (playerRef.current) return; // Already initialized

      playerRef.current = new (window as any).YT.Player('youtube-player', {
        videoId: state.videoId,
        playerVars: {
          autoplay: 0,
          controls: isHostOrModerator ? 1 : 0,
          disablekb: isHostOrModerator ? 0 : 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onStateChange: handleStateChange,
        },
      });
    };

    if (!(window as any).YT) {
      // API not loaded yet, set up the callback and load the script
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = initPlayer;
    } else if (!(window as any).YT.Player) {
      // API script is loading but YT.Player is not yet ready
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    } else {
      // API is already fully loaded
      initPlayer();
    }

    return () => {
      // Clean up the global callback if it hasn't fired yet
      if ((window as any).onYouTubeIframeAPIReady === initPlayer) {
        (window as any).onYouTubeIframeAPIReady = null;
      }
    };
  }, []);

  // When the state from the server changes (like someone paused or skipped)
  useEffect(() => {
    if (playerRef.current && playerRef.current.getPlayerState) {
      isSyncing.current = true; // Mark that we are syncing from the server

      // Change video if a new URL was pasted
      if (playerRef.current.getVideoData().video_id !== state.videoId) {
        playerRef.current.loadVideoById(state.videoId, state.currentTime);
      }

      // Sync the play/pause status
      const currentPlayerState = playerRef.current.getPlayerState();
      if (state.playState === 'playing' && currentPlayerState !== 1) {
        playerRef.current.playVideo();
      } else if (state.playState === 'paused' && currentPlayerState !== 2) {
        playerRef.current.pauseVideo();
      }

      // Sync the time if it's more than 2 seconds off (to avoid constant micro-jumps)
      const currentTime = playerRef.current.getCurrentTime();
      if (Math.abs(currentTime - state.currentTime) > 2) {
        playerRef.current.seekTo(state.currentTime, true);
      }

      // Sync is done!
      setTimeout(() => {
        isSyncing.current = false;
      }, 500);
    }
  }, [state]);

  // When WE interact with the player (if we are Host or Moderator)
  const handleStateChange = (event: any) => {
    if (isSyncing.current || !isHostOrModerator) return;

    // 1 = Playing, 2 = Paused
    if (event.data === 1) {
      socket.emit('play');
    } else if (event.data === 2) {
      socket.emit('pause');
      socket.emit('seek', { time: playerRef.current.getCurrentTime() });
    }
  };

  return (
    <div className="w-full h-full bg-black">
      <div id="youtube-player" className="w-full h-full"></div>
      {!isHostOrModerator && (
        <div className="absolute inset-0 z-10 cursor-not-allowed"></div>
      )}
    </div>
  );
};

export default Player;
