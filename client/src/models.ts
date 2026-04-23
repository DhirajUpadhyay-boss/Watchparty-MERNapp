export enum Role {
  Host = 'Host',
  Moderator = 'Moderator',
  Participant = 'Participant',
  Viewer = 'Viewer'
}

export interface User {
  id: string;
  username: string;
  role: Role;
  roomId: string;
}

export interface RoomState {
  playState: 'playing' | 'paused';
  currentTime: number;
  videoId: string;
  lastUpdated: number;
}
