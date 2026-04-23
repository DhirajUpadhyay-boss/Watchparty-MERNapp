# Watch Party - Real-Time YouTube Synchronized Player

A full-stack application that allows multiple users to watch YouTube videos together in real-time. Users in the same room are synchronized—when one person (with appropriate permissions) pauses, seeks, or changes the video, everyone in the party sees the same action instantly.

## 🚀 Features

- **Real-time Synchronization**: Play/Pause, Seek, and Video changes are broadcasted to all participants.
- **Room-based Model**: Create or join rooms with unique codes.
- **Role-Based Access Control (RBAC)**:
  - **Host**: Full control over playback, role assignment, and participant management.
  - **Moderator**: Can control playback (play/pause, seek, change video).
  - **Participant/Viewer**: Watch-only access.
- **YouTube Integration**: Seamlessly embeds YouTube videos using the IFrame API.
- **Modern UI**: Clean, dark-themed interface built with Tailwind CSS.

## 🛠️ Technologies Used

### Frontend
- **React 18** with **TypeScript**
- **Vite** (Build tool)
- **Tailwind CSS** (Styling)
- **Socket.io-client** (Real-time communication)
- **Lucide React** (Icons)
- **React Router DOM** (Navigation)

### Backend
- **Node.js** with **TypeScript**
- **Express** (Web framework)
- **Socket.io** (WebSocket server)
- **UUID** (Unique identifiers)
- **Nodemon** (Development workflow)

## 📁 Folder Structure

```text
.
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components (Player, Controls, etc.)
│   │   ├── pages/         # Page components (Home, Room)
│   │   ├── socket.ts      # Socket.io configuration
│   │   ├── models.ts      # Shared TypeScript interfaces & enums
│   │   └── App.tsx        # Main application component & routing
│   └── tailwind.config.js # Tailwind CSS configuration
│
└── server/                # Backend Node.js application
    ├── src/
    │   ├── index.ts       # Main server & WebSocket logic
    │   └── types.ts       # Server-side TypeScript interfaces
    └── package.json       # Backend dependencies and scripts
```

## 🏁 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Setup Backend
```bash
cd server
npm install
npm run dev
```
The server will start on `http://localhost:3001`.

### 2. Setup Frontend
```bash
cd client
npm install
npm run dev
```
The client will start on `http://localhost:5173`.

## 📖 How to Use
1. Open the app in your browser.
2. Enter your username and create a new room.
3. Copy the room ID and share it with friends.
4. Friends can join by entering the room ID and their username.
5. Paste a YouTube URL in the control bar to change the video.
6. As the Host, you can promote others to Moderators or remove them from the room using the participant list.

## 📝 Interview Notes
- **WebSockets**: Uses `Socket.io` for robust, event-driven real-time communication.
- **Permissions**: Playback events are validated on the server side to ensure only authorized roles (Host/Moderator) can trigger them.
- **State Management**: The server maintains a simple in-memory state for each room, including the current video ID, playback status, and timestamp for synchronization.
