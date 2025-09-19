# HomeGame - Multiplayer Online Poker

A real-time multiplayer poker application built with Node.js, Socket.IO, React, and TypeScript. Play Texas Hold'em poker with your friends online!

## 🚀 Features

- **Real-time Multiplayer**: Up to 6 players per room
- **Texas Hold'em Poker**: Complete poker game with all betting rounds
- **Room System**: Create private rooms with shareable codes
- **Live Updates**: Real-time game state synchronization
- **Hand Evaluation**: Automatic hand ranking and winner determination
- **Responsive UI**: Clean, poker table-inspired interface

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- Socket.IO for real-time communication
- JavaScript

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS for styling
- Socket.IO Client

## 📦 Installation & Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd poker-app
```

### 2. Install Server Dependencies
```bash
cd server
npm install
```

### 3. Install Client Dependencies
```bash
cd ../client
npm install
```

## 🎮 Running the Application

### Start the Server
```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

### Start the Client
```bash
cd client
npm start
# Client runs on http://localhost:3000
```

## 🎯 How to Play

1. **Create a Room**: Enter your name and click "Create New Room"
2. **Share Room Code**: Give the 6-character room code to your friends
3. **Join Room**: Friends enter the room code to join
4. **Start Game**: Once 2+ players are ready, click "Start Game"
5. **Play Poker**: Use the action buttons (Fold, Call/Check, Raise) to play

## 🔧 Game Rules

- **Texas Hold'em**: Each player gets 2 hole cards + 5 community cards
- **Betting Rounds**: Preflop → Flop (3 cards) → Turn (1 card) → River (1 card)
- **Starting Chips**: 1000 chips per player
- **Blinds**: Small blind (5), Big blind (10)
- **Actions**: Fold, Check, Call, Raise, All-in

## 🏗️ Project Structure

```
poker-app/
├── server/
│   ├── poker/
│   │   ├── deck.js          # Card deck management
│   │   ├── game.js          # Main game logic
│   │   └── handEvaluator.js # Hand ranking system
│   ├── server.js            # Socket.IO server
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## 🎨 UI Components

- **RoomLobby**: Room creation and joining interface
- **GameTable**: Main poker table with community cards and pot
- **PlayerSeat**: Individual player information and cards
- **Card**: Playing card component with suit and rank

## 🔄 Real-time Events

**Client → Server:**
- `create-room`: Create a new game room
- `join-room`: Join existing room
- `start-game`: Begin poker game
- `player-action`: Make poker action (fold, call, raise, check)

**Server → Client:**
- `room-created`/`room-joined`: Room status updates
- `game-started`: Game begins
- `cards-dealt`: Receive hole cards
- `game-updated`: Game state changes
- `phase-changed`: New betting round

## 🚀 Deployment

### Production Server
```bash
cd server
npm start
```

### Production Client Build
```bash
cd client
npm run build
```

## 🔧 Configuration

**Server Port**: Default 3001 (configurable via PORT env var)
**Client Port**: Default 3000 (React dev server)

## 🎯 Future Enhancements

- [ ] Tournament mode
- [ ] Spectator mode
- [ ] Chat system
- [ ] Player statistics
- [ ] Different poker variants
- [ ] AI opponents
- [ ] Mobile responsive improvements
