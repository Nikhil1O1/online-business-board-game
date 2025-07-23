import { useState, useRef, useCallback, useEffect } from 'react';
import Peer from 'simple-peer';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

/**
 * WebSocket-based P2P Connection Hook using Socket.io for signaling
 * 
 * ✅ ADVANTAGES over localStorage approach:
 * - Cross-browser compatibility
 * - Cross-device connections
 * - Real-time signaling
 * - Better error handling and reconnection
 * - No polling required
 */

export const useWebSocketP2PConnection = (onGameActionReceived) => {
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [serverConnected, setServerConnected] = useState(false);
  
  const peersRef = useRef({});
  const hostPeerRef = useRef(null);
  const socketRef = useRef(null);
  
  // Use refs to store latest function references
  const handleSignalReceivedRef = useRef();
  const updatePlayersListRef = useRef();
  const handleDataReceivedRef = useRef();
  
  // Initialize Socket.io connection
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('🔌 Connected to signaling server');
      setServerConnected(true);
      setConnectionStatus('disconnected');
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from signaling server');
      setServerConnected(false);
      setConnectionStatus('disconnected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      setServerConnected(false);
      setConnectionStatus('error');
    });
    
    // Handle WebRTC signals
    socket.on('signal', (signalData) => {
      console.log('📡 Received signal:', signalData);
      if (handleSignalReceivedRef.current) {
        handleSignalReceivedRef.current(signalData);
      }
    });
    
    // Handle player updates
    socket.on('playerUpdate', (players) => {
      console.log('👥 Received player update:', players);
      setPlayers(players);
    });
    
    // Handle new player joining
    socket.on('playerJoined', (playerData) => {
      console.log('👋 New player joined:', playerData);
      if (updatePlayersListRef.current) {
        updatePlayersListRef.current();
      }
    });
    
    // Handle player leaving
    socket.on('playerLeft', (playerId) => {
      console.log('👋 Player left:', playerId);
      if (peersRef.current[playerId]) {
        peersRef.current[playerId].destroy();
        delete peersRef.current[playerId];
      }
      if (updatePlayersListRef.current) {
        updatePlayersListRef.current();
      }
    });
    
    // Handle host disconnection
    socket.on('hostDisconnected', () => {
      console.log('❌ Host disconnected');
      setConnectionStatus('error');
      setPlayers([]);
      setRoomId('');
      setIsHost(false);
      if (hostPeerRef.current) {
        hostPeerRef.current.destroy();
        hostPeerRef.current = null;
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);
  
  const updatePlayersList = useCallback(() => {
    if (!isHost || !socketRef.current) return;
    
    const connectedPlayers = Object.keys(peersRef.current).filter(
      id => peersRef.current[id].connected
    );
    
    const updatedPlayers = [
      { id: playerId, name: `Host`, isHost: true },
      ...connectedPlayers.map((id, index) => ({ 
        id, 
        name: `Player ${index + 2}`, 
        isHost: false 
      }))
    ];
    
    setPlayers(updatedPlayers);
    
    // Send player update to server
    socketRef.current.emit('updatePlayers', updatedPlayers);
    
    // Broadcast player list to all connected peers
    const data = { type: 'playerUpdate', players: updatedPlayers };
    Object.values(peersRef.current).forEach(peer => {
      if (peer.connected) {
        peer.send(JSON.stringify(data));
      }
    });
  }, [isHost, playerId]);
  
  // Update ref when function changes
  updatePlayersListRef.current = updatePlayersList;
  
  const broadcastGameState = useCallback((action) => {
    if (!isHost) return;
    
    const data = {
      type: 'gameState',
      gameState: gameState,
      action
    };
    
    Object.values(peersRef.current).forEach(peer => {
      if (peer.connected) {
        peer.send(JSON.stringify(data));
      }
    });
  }, [isHost, gameState]);
  
  const handleDataReceived = useCallback((data, fromId) => {
    console.log('📨 Received data:', { type: data.type, from: fromId, isHost });
    
    switch (data.type) {
      case 'gameState':
        console.log('🎮 Received game state:', {
          gamePhase: data.gameState.gamePhase,
          players: data.gameState.players?.length
        });
        setGameState(data.gameState);
        break;
      case 'playerUpdate':
        console.log('👥 Received player update:', data.players);
        setPlayers(data.players);
        break;
      case 'gameAction':
        console.log('🎯 Received game action:', data.action);
        if (isHost && onGameActionReceived) {
          console.log('🎯 Host calling App-level game action handler');
          onGameActionReceived(data.action);
        }
        break;
      default:
        console.log('❓ Unknown data type:', data.type);
    }
  }, [isHost, onGameActionReceived]);
  
  // Update ref when function changes
  handleDataReceivedRef.current = handleDataReceived;
  
  const sendSignal = useCallback((signal, targetId) => {
    if (!socketRef.current) {
      console.error('Socket not connected');
      return;
    }
    
    console.log('📡 Sending signal:', {
      type: signal.type,
      to: targetId
    });
    
    socketRef.current.emit('signal', {
      to: targetId,
      signal: signal.signal,
      type: signal.type
    });
  }, []);
  
  const handleSignalReceived = useCallback((signalData) => {
    const { from, signal, type } = signalData;
    console.log('📡 Processing signal:', { type, from, isHost });
    
    if (isHost && type === 'offer' && !peersRef.current[from]) {
      // Host receives connection offer from new player
      console.log('🎮 Host creating peer for new player:', from);
      const peer = new Peer({ initiator: false, trickle: false });
      
      peer.on('signal', (data) => {
        console.log('📡 Host sending answer signal to:', from);
        sendSignal({ type: 'answer', signal: data }, from);
      });
      
      peer.on('connect', () => {
        console.log('✅ Player connected:', from);
        if (updatePlayersListRef.current) {
          updatePlayersListRef.current();
        }
      });
      
      peer.on('data', (data) => {
        if (handleDataReceivedRef.current) {
          handleDataReceivedRef.current(JSON.parse(data.toString()), from);
        }
      });
      
      peer.on('error', (err) => {
        console.error('❌ Host peer error:', err);
      });
      
      peer.on('close', () => {
        console.log('🔌 Host peer connection closed:', from);
        delete peersRef.current[from];
        if (updatePlayersListRef.current) {
          updatePlayersListRef.current();
        }
      });
      
      peersRef.current[from] = peer;
      peer.signal(signal);
      
    } else if (!isHost && type === 'answer') {
      // Player receives answer from host
      console.log('📡 Joiner received answer from host');
      if (hostPeerRef.current) {
        hostPeerRef.current.signal(signal);
      } else {
        console.error('❌ No host peer reference when trying to process answer');
      }
    } else {
      console.log('⚠️ Unhandled signal:', { type, from, isHost, hasExistingPeer: !!peersRef.current[from] });
    }
  }, [isHost, sendSignal]);
  
  // Update ref when function changes
  handleSignalReceivedRef.current = handleSignalReceived;
  
  const createRoom = useCallback(() => {
    if (!socketRef.current || !serverConnected) {
      console.error('Socket not connected');
      return null;
    }
    
    socketRef.current.emit('createRoom', (response) => {
      if (response.success) {
        console.log('🎮 Room created:', response.roomId);
        setRoomId(response.roomId);
        setPlayerId(response.playerId);
        setIsHost(true);
        setConnectionStatus('hosting');
        
        const hostPlayer = { id: response.playerId, name: 'Host', isHost: true };
        setPlayers([hostPlayer]);
      } else {
        console.error('❌ Failed to create room:', response.error);
        setConnectionStatus('error');
      }
    });
  }, [serverConnected]);
  
  const joinRoom = useCallback((targetRoomId) => {
    if (!socketRef.current || !serverConnected) {
      console.error('Socket not connected');
      setConnectionStatus('error');
      return;
    }
    
    console.log('🎮 Attempting to join room:', targetRoomId);
    setRoomId(targetRoomId);
    setIsHost(false);
    setConnectionStatus('connecting');
    
    socketRef.current.emit('joinRoom', targetRoomId, (response) => {
      if (response.success) {
        console.log('✅ Successfully joined room:', response.roomId);
        // Set local state with data from server
        if (response.playerId) {
          setPlayerId(response.playerId);
        }
        setPlayers(response.players);
        
        // Create peer connection to host (response.hostId supplied by server)
        console.log('🔗 Creating peer connection to host:', response.hostId);
        const peer = new Peer({ initiator: true, trickle: false });
        
        peer.on('signal', (data) => {
          console.log('📡 Joiner sending offer signal to host:', response.hostId);
          sendSignal({ type: 'offer', signal: data }, response.hostId);
        });
        
        peer.on('connect', () => {
          console.log('✅ Successfully connected to host');
          setConnectionStatus('connected');
        });
        
        peer.on('data', (data) => {
          console.log('📨 Received data from host:', data);
          if (handleDataReceivedRef.current) {
            handleDataReceivedRef.current(JSON.parse(data.toString()), response.hostId);
          }
        });
        
        peer.on('error', (err) => {
          console.error('❌ Peer connection error:', err);
          setConnectionStatus('error');
        });
        
        peer.on('close', () => {
          console.log('🔌 Peer connection closed');
          setConnectionStatus('error');
        });
        
        hostPeerRef.current = peer;
        
      } else {
        console.error('❌ Failed to join room:', response.error);
        setConnectionStatus('error');
      }
    });
  }, [serverConnected, sendSignal]);
  
  const sendGameAction = useCallback((action) => {
    const data = { type: 'gameAction', action, from: playerId };
    
    console.log('🎯 sendGameAction called:', {
      action: action.type,
      playerId,
      isHost,
      hasHostPeer: !!hostPeerRef.current,
      isPeerConnected: hostPeerRef.current?.connected
    });
    
    if (isHost) {
      console.log('🎯 Host broadcasting action');
      broadcastGameState(action);
    } else if (hostPeerRef.current && hostPeerRef.current.connected) {
      console.log('🎯 Joiner sending action to host via WebRTC');
      hostPeerRef.current.send(JSON.stringify(data));
    } else {
      console.error('🎯 ❌ Cannot send action - no connection to host!', {
        hasHostPeer: !!hostPeerRef.current,
        isPeerConnected: hostPeerRef.current?.connected,
        connectionStatus
      });
    }
  }, [isHost, broadcastGameState, playerId, connectionStatus]);
  
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnect called');
    
    // Cleanup connections
    Object.values(peersRef.current).forEach(peer => {
      peer.destroy();
    });
    
    if (hostPeerRef.current) {
      hostPeerRef.current.destroy();
    }
    
    // Reset state
    peersRef.current = {};
    hostPeerRef.current = null;
    setPlayers([]);
    setConnectionStatus('disconnected');
    setRoomId('');
    setIsHost(false);
    setGameState(null);
    setPlayerId('');
  }, []);
  
  // Broadcast game state changes to connected peers
  useEffect(() => {
    if (isHost && gameState) {
      console.log('🎮 Host broadcasting game state to connected peers:', {
        gamePhase: gameState.gamePhase,
        players: gameState.players?.length,
        connectedPeers: Object.keys(peersRef.current).length
      });
      
      const data = {
        type: 'gameState',
        gameState: gameState
      };
      
      Object.values(peersRef.current).forEach(peer => {
        if (peer.connected) {
          console.log('📡 Sending game state to peer');
          peer.send(JSON.stringify(data));
        }
      });
    }
  }, [isHost, gameState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up...');
      Object.values(peersRef.current).forEach(peer => {
        peer.destroy();
      });
      
      if (hostPeerRef.current) {
        hostPeerRef.current.destroy();
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  return {
    isHost,
    roomId,
    players,
    connectionStatus,
    gameState,
    playerId,
    serverConnected,
    createRoom,
    joinRoom,
    sendGameAction,
    disconnect,
    setGameState: isHost ? setGameState : () => {} // Only host can set game state directly
  };
}; 