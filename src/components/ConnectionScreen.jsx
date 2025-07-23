import React, { useState, useEffect, useRef } from 'react';
import { Users, Wifi, WifiOff, Play, Copy, Check, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const ConnectionScreen = ({ 
  onCreateRoom, 
  onJoinRoom, 
  onDisconnect, 
  onStartGame,
  roomId, 
  players = [], 
  connectionStatus,
  isHost,
  serverConnected = true
}) => {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const loadingToastRef = useRef(null);
  const prevConnectionStatusRef = useRef(connectionStatus);

  // Handle connection status changes
  useEffect(() => {
    const prevStatus = prevConnectionStatusRef.current;
    const currentStatus = connectionStatus;
    
    // Only process status changes, not initial mount
    if (prevStatus !== currentStatus) {
      console.log('Connection status changed:', { from: prevStatus, to: currentStatus });
      
      // If we have a loading toast and status changed from connecting
      if (loadingToastRef.current && prevStatus === 'connecting') {
        toast.dismiss(loadingToastRef.current);
        loadingToastRef.current = null;
        
        if (currentStatus === 'connected') {
          toast.success('Connected to room successfully!');
        } else if (currentStatus === 'error') {
          toast.error('Failed to connect to room');
        }
      }
    }
    
    // Update previous status
    prevConnectionStatusRef.current = currentStatus;
  }, [connectionStatus]);

  // Cleanup loading toast on unmount
  useEffect(() => {
    return () => {
      if (loadingToastRef.current) {
        toast.dismiss(loadingToastRef.current);
      }
    };
  }, []);

  const handleCreateRoom = () => {
    const newRoomId = onCreateRoom();
    toast.success(`Room created! ID: ${newRoomId}`);
  };

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      onJoinRoom(joinRoomId.trim().toUpperCase());
      // Store the loading toast ID so we can dismiss it later
      loadingToastRef.current = toast.loading('Connecting to room...');
    } else {
      toast.error('Please enter a room ID');
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast.success('Room ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy room ID');
    }
  };

  const checkAvailableRooms = async () => {
    try {
      const response = await fetch('http://localhost:3001/rooms');
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      
      const rooms = await response.json();
      setAvailableRooms(rooms.map(room => ({
        ...room,
        created: new Date(room.created).toLocaleTimeString()
      })));
      
      if (rooms.length === 0) {
        toast('No rooms found on server', {
          icon: 'ℹ️'
        });
      } else {
        toast.success(`Found ${rooms.length} room(s)`);
      }
      
      console.log('Available rooms:', rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to fetch rooms from server');
    }
  };

  const renderConnectionStatus = () => {
    const statusConfig = {
      disconnected: { icon: WifiOff, text: 'Disconnected', color: 'text-red-500' },
      connecting: { icon: Wifi, text: 'Connecting...', color: 'text-yellow-500' },
      hosting: { icon: Users, text: 'Hosting Room', color: 'text-blue-500' },
      connected: { icon: Wifi, text: 'Connected', color: 'text-green-500' },
      error: { icon: WifiOff, text: 'Connection Error', color: 'text-red-500' }
    };

    const config = statusConfig[connectionStatus];
    const IconComponent = config.icon;

    return (
      <div className={`flex items-center gap-2 ${config.color}`}>
        <IconComponent size={20} />
        <span>{config.text}</span>
      </div>
    );
  };

  if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
    return (
      <div className="app">
        <div className="game-container">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-gray-100">
              🏠 RichUP Clone
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              A multiplayer property trading game with P2P networking
            </p>
            
            <div className="connection-panel">
              <div className="mb-4">
                {renderConnectionStatus()}
                {!serverConnected && (
                  <div className="mt-2 text-red-400 text-sm flex items-center gap-1">
                    <span>🔌</span>
                    <span>Not connected to server</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Room Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-200">Create New Game</h3>
                  <p className="text-gray-400 text-sm">
                    Start a new game and invite friends to join
                  </p>
                  <button
                    onClick={handleCreateRoom}
                    className="btn btn-primary w-full"
                    disabled={!serverConnected}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Create Room
                  </button>
                </div>

                {/* Join Room Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-200">Join Existing Game</h3>
                  <p className="text-gray-400 text-sm">
                    Enter the room ID to join a friend's game
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                      placeholder="Enter Room ID"
                      className="room-id flex-1 text-center font-mono text-sm"
                      maxLength={6}
                    />
                    <button
                      onClick={handleJoinRoom}
                      className="btn btn-success"
                      disabled={!joinRoomId.trim() || !serverConnected}
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>

              {connectionStatus === 'error' && (
                <div className="mt-6 p-4 bg-red-900 border border-red-600 rounded-lg">
                  <p className="text-red-400 text-sm">
                    Failed to connect. Please check the room ID and try again.
                  </p>
                  <p className="text-red-300 text-xs mt-2">
                    Check the browser console (F12) for detailed error messages.
                  </p>
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={checkAvailableRooms}
                      className="text-blue-600 hover:text-blue-800 text-xs underline flex items-center gap-1"
                    >
                      <Search size={12} />
                      Check available rooms on server
                    </button>
                    <div className="text-green-300 text-xs bg-green-900 p-2 rounded border border-green-600">
                      <strong>✅ Cross-browser support:</strong> This version uses WebSocket signaling, so you can connect from different browsers and devices!
                    </div>
                  </div>
                </div>
              )}

              {availableRooms.length > 0 && (
                <div className="mt-4 p-4 bg-blue-900 border border-blue-600 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">Available Rooms:</h4>
                  <div className="space-y-2">
                    {availableRooms.map(room => (
                      <div key={room.id} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-600">
                        <div>
                          <span className="font-mono text-sm font-bold text-gray-200">{room.id}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            Created: {room.created} | Players: {room.players}
                          </span>
                        </div>
                        <button
                          onClick={() => setJoinRoomId(room.id)}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          Use This ID
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="game-container">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-100">
            🏠 RichUP Clone
          </h1>
          
          <div className="connection-panel">
            <div className="mb-4">
              {renderConnectionStatus()}
            </div>

            {roomId && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Room ID</h3>
                <div className="flex items-center justify-center gap-2">
                  <div className="room-id text-2xl font-mono font-bold">
                    {roomId}
                  </div>
                  <button
                    onClick={copyRoomId}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy Room ID"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Share this ID with friends to let them join your game
                </p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Players ({players.length}/4)
              </h3>
              <div className="players-list">
                {players.map((player, index) => (
                  <div key={player.id} className="player-card">
                    <div className="flex items-center gap-2">
                      {player.isHost && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          HOST
                        </span>
                      )}
                      <span>{player.name}</span>
                    </div>
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: 4 - players.length }, (_, index) => (
                  <div key={`empty-${index}`} className="player-card opacity-50">
                    <span className="text-gray-400">Waiting for player...</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              {isHost && players.length >= 1 && onStartGame && (
                <button
                  onClick={onStartGame}
                  className="btn btn-success"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Game
                </button>
              )}
              
              <button
                onClick={onDisconnect}
                className="btn btn-danger"
              >
                Disconnect
              </button>
            </div>

            {players.length === 1 && (
              <div className="mt-4 p-4 bg-blue-900 border border-blue-600 rounded-lg">
                <p className="text-blue-400 text-sm">
                  Ready to start! 
                  {isHost ? ' You can start the game now or wait for more players to join by sharing the room ID!' : ' Waiting for host to start the game...'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionScreen; 