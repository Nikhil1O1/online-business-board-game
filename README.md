# Business Board Game - RichUP Clone

An online multiplayer business board game built with React and WebSocket P2P networking. Players can buy properties, collect rent, and compete to become the richest player!

## 🎮 Features

- **Multiplayer Support**: Real-time multiplayer with WebSocket and P2P connections
- **Property Trading**: Buy, sell, and manage properties on the game board
- **Real-time Gameplay**: Live synchronization of all game actions across players
- **Interactive UI**: Modern React-based game interface with animations
- **Cross-platform**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd business-board-game
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will start both the game server (port 3001) and the client (port 5174).

### Available Scripts

- `npm run dev` - Start both server and client in development mode
- `npm run server` - Start only the game server
- `npm run client` - Start only the React client
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build

## 🎯 How to Play

1. **Create or Join Room**: One player creates a room, others join using the room ID
2. **Start Game**: Host starts the game when all players are ready
3. **Take Turns**: Players roll dice and move around the board
4. **Buy Properties**: Purchase unowned properties you land on
5. **Collect Rent**: Earn money when other players land on your properties
6. **Win**: Be the player with the most money and properties!

## 🏗️ Architecture

### Frontend (React)
- **OnlineGame.jsx**: Main game component and state management
- **GameBoard.jsx**: Game board rendering and property interactions
- **ConnectionScreen.jsx**: Multiplayer connection interface
- **Property Components**: Property management and trading modals

### Backend (Express + Socket.IO)
- **server.cjs**: WebSocket server for multiplayer connections
- **P2P Networking**: Direct peer-to-peer communication for game actions

### Data Management
- **gameData.js**: Game constants, board layout, and property definitions
- **Hooks**: Custom React hooks for P2P connections and game state

## 🔗 Integration

This game is designed to be used as a submodule in other projects. To integrate:

```bash
git submodule add <this-repo-url> game
npm install ./game
```

Then import the game component:
```javascript
import OnlineGame from './game/src/components/OnlineGame'
```

## 🛠️ Technologies

- **React 18** - UI framework
- **Socket.IO** - Real-time communication
- **Simple-Peer** - WebRTC P2P connections
- **Express** - Game server
- **Vite** - Build tool and development server
- **React Hot Toast** - Notifications

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request 