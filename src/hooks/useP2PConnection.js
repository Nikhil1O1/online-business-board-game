import { useState, useRef, useCallback, useEffect } from 'react';
import Peer from 'simple-peer';
import { v4 as uuidv4 } from 'uuid';

export const useP2PConnection = (onGameActionReceived) => {
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [gameState, setGameState] = useState(null);
  const [playerId] = useState(() => uuidv4());
  
  // Debug helper function
  const debugLocalStorage = () => {
    console.log('=== LocalStorage Debug ===');
    const allKeys = Object.keys(localStorage);
    const roomKeys = allKeys.filter(key => key.startsWith('room_'));
    const signalKeys = allKeys.filter(key => key.startsWith('signals_'));
    
    console.log('All keys:', allKeys);
    console.log('Room keys:', roomKeys);
    console.log('Signal keys:', signalKeys);
    
    roomKeys.forEach(key => {
      console.log(`${key}:`, localStorage.getItem(key));
    });
    console.log('=========================');
  };
  
  const peersRef = useRef({});
  const hostPeerRef = useRef(null);
  const signalServerRef = useRef(null);
  
  // Use refs to store latest function references
  const handleSignalReceivedRef = useRef();
  const updatePlayersListRef = useRef();
  const handleDataReceivedRef = useRef();
  
  const updatePlayersList = useCallback(() => {
    if (!isHost) return;
    
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
          // Call the App-level handler to process the action properly
          onGameActionReceived(data.action);
        }
        break;
      default:
        console.log('❓ Unknown data type:', data.type);
    }
  }, [isHost, broadcastGameState]);
  
  // Update ref when function changes
  handleDataReceivedRef.current = handleDataReceived;
  
  const sendSignal = useCallback((signal, targetId) => {
    try {
      const signals = JSON.parse(localStorage.getItem(`signals_${roomId}`) || '[]');
      const newSignal = {
        id: uuidv4(),
        from: playerId,
        to: targetId,
        ...signal,
        timestamp: Date.now(),
        processed: false
      };
      
      console.log('Sending signal:', {
        type: signal.type,
        from: playerId,
        to: targetId,
        roomId: roomId
      });
      
      signals.push(newSignal);
      localStorage.setItem(`signals_${roomId}`, JSON.stringify(signals));
      
      console.log('Signal stored. Total signals in room:', signals.length);
      console.log('All signals:', signals);
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  }, [roomId, playerId]);
  
  const handleSignalReceived = useCallback((signalData) => {
    const { from, signal, type } = signalData;
    console.log('Signal received:', { type, from, isHost });
    
    if (isHost && type === 'offer' && !peersRef.current[from]) {
      // Host receives connection offer from new player
      console.log('Host creating peer for new player:', from);
      const peer = new Peer({ initiator: false, trickle: false });
      
      peer.on('signal', (data) => {
        console.log('Host sending answer signal to:', from);
        sendSignal({ type: 'answer', signal: data }, from);
      });
      
      peer.on('connect', () => {
        console.log('Player connected:', from);
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
        console.error('Host peer error:', err);
      });
      
      peersRef.current[from] = peer;
      peer.signal(signal);
      
    } else if (!isHost && type === 'answer') {
      // Player receives answer from host
      console.log('Joiner received answer from host');
      if (hostPeerRef.current) {
        hostPeerRef.current.signal(signal);
      } else {
        console.error('No host peer reference when trying to process answer');
      }
    } else {
      console.log('Unhandled signal:', { type, from, isHost, hasExistingPeer: !!peersRef.current[from] });
    }
  }, [isHost, sendSignal]);
  
  // Update ref when function changes
  handleSignalReceivedRef.current = handleSignalReceived;
  
  // Simple signaling server simulation using localStorage for demo
  // In production, you'd use a proper signaling server
  const initializeSignaling = useCallback(() => {
    console.log('initializeSignaling called for roomId:', roomId);
    
    // Clear any existing interval
    if (signalServerRef.current) {
      clearInterval(signalServerRef.current);
      signalServerRef.current = null;
    }
    
    const checkForSignals = () => {
      try {
        const signals = JSON.parse(localStorage.getItem(`signals_${roomId}`) || '[]');
        const mySignals = signals.filter(s => s.to === playerId && !s.processed);
        
        if (mySignals.length > 0) {
          console.log(`Found ${mySignals.length} unprocessed signals for player ${playerId}:`, mySignals);
        }
        
        mySignals.forEach(signal => {
          console.log('Processing signal:', signal);
          if (signal.type === 'offer' || signal.type === 'answer') {
            if (handleSignalReceivedRef.current) {
              console.log('Calling handleSignalReceived for signal:', signal.type);
              handleSignalReceivedRef.current(signal);
            } else {
              console.error('handleSignalReceivedRef.current is null!');
            }
          }
          
          // Mark as processed
          const allSignals = JSON.parse(localStorage.getItem(`signals_${roomId}`) || '[]');
          const updatedSignals = allSignals.map(s => 
            s.id === signal.id ? { ...s, processed: true } : s
          );
          localStorage.setItem(`signals_${roomId}`, JSON.stringify(updatedSignals));
        });
      } catch (error) {
        console.error('Error checking signals:', error);
      }
    };
    
    signalServerRef.current = setInterval(() => {
      // Reduced logging frequency - only log every 20th poll (5 seconds)
      if (Math.random() < 0.05) {
        console.log(`🔄 Polling for signals... (${isHost ? 'HOST' : 'JOINER'}) - Player: ${playerId}, Room: ${roomId}`);
      }
      checkForSignals();
    }, 250);
    console.log('Signaling interval started with 250ms polling');
  }, [roomId, playerId]); // Removed handleSignalReceived dependency
  
  const createRoom = useCallback(() => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    console.log('Creating room with ID:', newRoomId);
    console.log('Host player ID:', playerId);
    setRoomId(newRoomId);
    setIsHost(true);
    setConnectionStatus('hosting');
    
    // Clear any existing signals for this room
    localStorage.removeItem(`signals_${newRoomId}`);
    
    // Initialize room in localStorage
    const roomData = {
      hostId: playerId,
      players: [{ id: playerId, name: 'Host', isHost: true }],
      created: Date.now()
    };
    
    console.log('Storing room data:', roomData);
    localStorage.setItem(`room_${newRoomId}`, JSON.stringify(roomData));
    
    // Verify storage worked
    const storedData = localStorage.getItem(`room_${newRoomId}`);
    console.log('Verified stored data:', storedData);
    console.log('Parsed stored data:', JSON.parse(storedData || '{}'));
    
    // Debug all localStorage after creation
    debugLocalStorage();
    
    const hostPlayer = { id: playerId, name: 'Host', isHost: true };
    setPlayers([hostPlayer]);
    
    return newRoomId;
  }, [playerId]);
  
  const joinRoom = useCallback((targetRoomId) => {
    console.log('Attempting to join room:', targetRoomId);
    setRoomId(targetRoomId);
    setIsHost(false);
    setConnectionStatus('connecting');
    
    // Clear any existing signals to start fresh
    const existingSignals = JSON.parse(localStorage.getItem(`signals_${targetRoomId}`) || '[]');
    const cleanedSignals = existingSignals.filter(s => s.to !== playerId);
    localStorage.setItem(`signals_${targetRoomId}`, JSON.stringify(cleanedSignals));
    
    try {
      // Debug localStorage contents
      debugLocalStorage();
      console.log('Looking for key:', `room_${targetRoomId}`);
      
      const roomDataRaw = localStorage.getItem(`room_${targetRoomId}`);
      console.log('Raw room data from localStorage:', roomDataRaw);
      
      const roomData = JSON.parse(roomDataRaw || '{}');
      const hostId = roomData.hostId;
      
      console.log('Parsed room data:', roomData);
      console.log('Room data found:', { hostId, roomExists: !!hostId });
      
      if (!hostId) {
        console.error('Room not found for ID:', targetRoomId);
        console.error('This usually means:');
        console.error('1. The room ID was mistyped');
        console.error('2. The host closed their browser/tab before you joined');
        console.error('3. You are using a different browser or incognito mode than the host');
        console.error('4. The room was created in a different localStorage context');
        throw new Error(`Room "${targetRoomId}" not found. Make sure the host's browser is still open and you're using the same browser.`);
      }
      
      // Create a room-specific signal sender to avoid timing issues
      const sendSignalForRoom = (signal, targetId) => {
        try {
          const signals = JSON.parse(localStorage.getItem(`signals_${targetRoomId}`) || '[]');
          const newSignal = {
            id: uuidv4(),
            from: playerId,
            to: targetId,
            ...signal,
            timestamp: Date.now(),
            processed: false
          };
          
          console.log('Sending signal for room:', {
            type: signal.type,
            from: playerId,
            to: targetId,
            roomId: targetRoomId // Use the parameter instead of state
          });
          
          signals.push(newSignal);
          localStorage.setItem(`signals_${targetRoomId}`, JSON.stringify(signals));
          
          console.log('Signal stored. Total signals in room:', signals.length);
          console.log('All signals:', signals);
        } catch (error) {
          console.error('Error sending signal for room:', error);
        }
      };
      
      // Create peer connection to host
      console.log('Creating peer connection to host:', hostId);
      const peer = new Peer({ initiator: true, trickle: false });
      
      peer.on('signal', (data) => {
        console.log('Joiner sending offer signal to host:', hostId);
        sendSignalForRoom({ type: 'offer', signal: data }, hostId);
      });
      
      peer.on('connect', () => {
        console.log('Successfully connected to host');
        setConnectionStatus('connected');
      });
      
      peer.on('data', (data) => {
        console.log('Received data from host:', data);
        if (handleDataReceivedRef.current) {
          handleDataReceivedRef.current(JSON.parse(data.toString()), hostId);
        }
      });
      
      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        setConnectionStatus('error');
      });
      
      peer.on('close', () => {
        console.log('Peer connection closed');
        setConnectionStatus('error');
      });
      
      hostPeerRef.current = peer;
      
    } catch (error) {
      console.error('Error joining room:', error);
      setConnectionStatus('error');
    }
  }, [playerId]);
  
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
      // Process locally and broadcast
      broadcastGameState(action);
    } else if (hostPeerRef.current && hostPeerRef.current.connected) {
      console.log('🎯 Joiner sending action to host via WebRTC');
      // Send to host
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
    console.log('disconnect() called');
    
    // Cleanup connections
    Object.values(peersRef.current).forEach(peer => {
      peer.destroy();
    });
    
    if (hostPeerRef.current) {
      hostPeerRef.current.destroy();
    }
    
    if (signalServerRef.current) {
      clearInterval(signalServerRef.current);
    }
    
    // Cleanup localStorage
    if (isHost && roomId) {
      localStorage.removeItem(`room_${roomId}`);
      localStorage.removeItem(`signals_${roomId}`);
    }
    
    // Reset state
    peersRef.current = {};
    hostPeerRef.current = null;
    setPlayers([]);
    setConnectionStatus('disconnected');
    setRoomId('');
    setIsHost(false);
    setGameState(null);
  }, [isHost, roomId]);
  
  // Initialize signaling when room is created or joined
  useEffect(() => {
    if (roomId && (connectionStatus === 'hosting' || connectionStatus === 'connecting')) {
      console.log('useEffect: Starting signaling for room:', roomId, 'status:', connectionStatus);
      const timer = setTimeout(() => {
        initializeSignaling();
      }, 100);
      return () => {
        console.log('useEffect cleanup: Clearing signaling timer');
        clearTimeout(timer);
      };
    }
  }, [roomId, connectionStatus, initializeSignaling]);
  
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
          console.log('📡 Sending game state to peer:', peer);
          peer.send(JSON.stringify(data));
        }
      });
    }
  }, [isHost, gameState]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up...');
      // Cleanup connections
      Object.values(peersRef.current).forEach(peer => {
        peer.destroy();
      });
      
      if (hostPeerRef.current) {
        hostPeerRef.current.destroy();
      }
      
      if (signalServerRef.current) {
        clearInterval(signalServerRef.current);
      }
    };
  }, []); // Empty dependency array - only run on unmount
  
  return {
    isHost,
    roomId,
    players,
    connectionStatus,
    gameState,
    playerId,
    createRoom,
    joinRoom,
    sendGameAction,
    disconnect,
    setGameState: isHost ? setGameState : () => {} // Only host can set game state directly
  };
}; 