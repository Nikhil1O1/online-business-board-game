import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketP2PConnection } from '../hooks/useWebSocketP2PConnection';
import ConnectionScreen from './ConnectionScreen.jsx';
import GameBoard from './GameBoard.jsx';
import { INITIAL_GAME_STATE, GAME_CONSTANTS } from '../data/gameData';
import { Toaster } from 'react-hot-toast';
import './App.css';
import './game-index.css';

function OnlineGame() {
  const [localGameState, setLocalGameState] = useState({
    ...INITIAL_GAME_STATE,
    players: []
  });

  const setGameStateRef = useRef(null);

  const handleGameActionFromPeer = useCallback((action) => {
    console.log('🎯 handleGameActionFromPeer called:', {
      action: action.type,
      playerId: action.playerId
    });

    // This is called when host receives an action from a peer
    // Process action locally and update state
    const newState = processGameAction(localGameState, action);
    setLocalGameState(newState);
    
    // Also update P2P game state if available
    if (setGameStateRef.current) {
      setGameStateRef.current(newState);
    }
  }, [localGameState]);

  const {
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
    setGameState
  } = useWebSocketP2PConnection(handleGameActionFromPeer);

  // Update the ref with setGameState function
  setGameStateRef.current = setGameState;

  // Sync game state from P2P connection
  useEffect(() => {
    if (gameState) {
      console.log('🔄 Received game state from P2P:', {
        gamePhase: gameState.gamePhase,
        players: gameState.players?.length,
        currentPlayer: gameState.currentPlayerIndex,
        isHost
      });
      setLocalGameState(gameState);
    }
  }, [gameState, isHost]);

  const initializeGame = useCallback(() => {
    console.log('🎮 Initializing game...', { 
      players: players.length, 
      isHost, 
      playerId 
    });
    
    const gamePlayers = players.map((player, index) => ({
      id: player.id,
      name: player.name,
      money: GAME_CONSTANTS.STARTING_MONEY,
      position: 0,
      properties: [],
      inJail: false,
      jailTurns: 0,
      color: ['#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'][index],
      isActive: index === 0
    }));

    const newGameState = {
      ...INITIAL_GAME_STATE,
      players: gamePlayers,
      gamePhase: 'playing',
      currentPlayerIndex: 0
    };

    console.log('🎮 New game state created:', newGameState);
    
    setLocalGameState(newGameState);
    
    if (isHost) {
      console.log('🎮 Host broadcasting game state to peers...');
      setGameState(newGameState);
    } else {
      console.log('🎮 Joiner waiting for game state from host...');
    }
  }, [players, isHost, setGameState, playerId]);

  const handleLocalGameAction = (action) => {
    console.log('🎯 handleLocalGameAction called:', {
      action: action.type,
      playerId: action.playerId,
      isHost,
      connectionStatus
    });

    if (isHost) {
      console.log('🎯 Host processing action locally');
      // Process action locally and update state
      const newState = processGameAction(localGameState, action);
      setLocalGameState(newState);
      setGameState(newState);
    } else {
      console.log('🎯 Joiner sending action to host');
      // Send action to host
      sendGameAction(action);
    }
  };

  const processGameAction = (currentState, action) => {
    let newState = { ...currentState };

    switch (action.type) {
      case 'ROLL_DICE':
        return handleDiceRoll(newState, action);
      case 'BUY_PROPERTY':
        return handleBuyProperty(newState, action);
      case 'END_TURN':
        return handleEndTurn(newState);
      case 'PAY_RENT':
        return handlePayRent(newState, action);
      case 'MORTGAGE_PROPERTY':
        return handleMortgageProperty(newState, action);
      case 'UNMORTGAGE_PROPERTY':
        return handleUnmortgageProperty(newState, action);
      case 'BUY_HOUSE':
        return handleBuyHouse(newState, action);
      case 'SELL_HOUSE':
        return handleSellHouse(newState, action);
      default:
        return newState;
    }
  };

  const handleDiceRoll = (state, action) => {
    const { dice } = action;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const newPosition = (currentPlayer.position + dice[0] + dice[1]) % 40;
    
    // Check if player passes GO
    const passedGo = newPosition < currentPlayer.position;
    const moneyToAdd = passedGo ? GAME_CONSTANTS.GO_MONEY : 0;

    const updatedPlayers = state.players.map((player, index) => {
      if (index === state.currentPlayerIndex) {
        return {
          ...player,
          position: newPosition,
          money: player.money + moneyToAdd
        };
      }
      return player;
    });

    return {
      ...state,
      players: updatedPlayers,
      dice,
      lastRoll: dice[0] + dice[1]
    };
  };

  const handleBuyProperty = (state, action) => {
    const { propertyId, price } = action;
    const currentPlayer = state.players[state.currentPlayerIndex];

    if (currentPlayer.money >= price) {
      const updatedPlayers = state.players.map((player, index) => {
        if (index === state.currentPlayerIndex) {
          return {
            ...player,
            money: player.money - price,
            properties: [...player.properties, propertyId]
          };
        }
        return player;
      });

      const updatedProperties = {
        ...state.properties,
        [propertyId]: {
          owner: currentPlayer.id,
          houses: 0,
          mortgaged: false
        }
      };

      return {
        ...state,
        players: updatedPlayers,
        properties: updatedProperties
      };
    }

    return state;
  };

  const handleEndTurn = (state) => {
    const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    
    const updatedPlayers = state.players.map((player, index) => ({
      ...player,
      isActive: index === nextPlayerIndex
    }));

    return {
      ...state,
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      turn: state.turn + 1,
      lastRoll: 0 // Reset lastRoll so the next player can roll dice
    };
  };

  const handlePayRent = (state, action) => {
    const { amount, toPlayerId } = action;
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    const updatedPlayers = state.players.map(player => {
      if (player.id === currentPlayer.id) {
        return { ...player, money: player.money - amount };
      }
      if (player.id === toPlayerId) {
        return { ...player, money: player.money + amount };
      }
      return player;
    });

    return {
      ...state,
      players: updatedPlayers
    };
  };

  const handleMortgageProperty = (state, action) => {
    const { propertyId, mortgageValue, playerId } = action;
    
    const updatedPlayers = state.players.map(player => {
      if (player.id === playerId) {
        return { ...player, money: player.money + mortgageValue };
      }
      return player;
    });

    const updatedProperties = {
      ...state.properties,
      [propertyId]: {
        ...state.properties[propertyId],
        mortgaged: true
      }
    };

    return {
      ...state,
      players: updatedPlayers,
      properties: updatedProperties
    };
  };

  const handleUnmortgageProperty = (state, action) => {
    const { propertyId, unmortgageValue, playerId } = action;
    
    const updatedPlayers = state.players.map(player => {
      if (player.id === playerId) {
        return { ...player, money: player.money - unmortgageValue };
      }
      return player;
    });

    const updatedProperties = {
      ...state.properties,
      [propertyId]: {
        ...state.properties[propertyId],
        mortgaged: false
      }
    };

    return {
      ...state,
      players: updatedPlayers,
      properties: updatedProperties
    };
  };

  const handleBuyHouse = (state, action) => {
    const { propertyId, cost, playerId } = action;
    
    const updatedPlayers = state.players.map(player => {
      if (player.id === playerId) {
        return { ...player, money: player.money - cost };
      }
      return player;
    });

    const updatedProperties = {
      ...state.properties,
      [propertyId]: {
        ...state.properties[propertyId],
        houses: (state.properties[propertyId].houses || 0) + 1
      }
    };

    return {
      ...state,
      players: updatedPlayers,
      properties: updatedProperties
    };
  };

  const handleSellHouse = (state, action) => {
    const { propertyId, value, playerId } = action;
    
    const updatedPlayers = state.players.map(player => {
      if (player.id === playerId) {
        return { ...player, money: player.money + value };
      }
      return player;
    });

    const updatedProperties = {
      ...state.properties,
      [propertyId]: {
        ...state.properties[propertyId],
        houses: Math.max(0, (state.properties[propertyId].houses || 0) - 1)
      }
    };

    return {
      ...state,
      players: updatedPlayers,
      properties: updatedProperties
    };
  };

  const renderCurrentScreen = () => {
    // Show GameBoard if game is playing (for both host and joiner)
    if (localGameState.gamePhase === 'playing') {
      return (
        <GameBoard
          gameState={localGameState}
          playerId={playerId}
          isHost={isHost}
          onGameAction={handleLocalGameAction}
          connectionStatus={connectionStatus}
        />
      );
    }

    // Show connection screen for initial connection
    if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
      return (
        <ConnectionScreen
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          connectionStatus={connectionStatus}
          serverConnected={serverConnected}
        />
      );
    }

    // Show lobby for host or connected joiner
    if (connectionStatus === 'hosting' || connectionStatus === 'connected' || connectionStatus === 'connecting') {
      return (
        <ConnectionScreen
          roomId={roomId}
          players={players}
          connectionStatus={connectionStatus}
          onDisconnect={disconnect}
          isHost={isHost}
          onStartGame={localGameState.gamePhase === 'setup' && players.length >= 1 ? initializeGame : null}
          serverConnected={serverConnected}
        />
      );
    }

    return (
      <div className="app">
        <div className="game-container">
          <h1>Online Business Game</h1>
          <p>Waiting for game to start...</p>
          <p>Status: {connectionStatus}, Players: {players.length}, Phase: {localGameState.gamePhase}</p>
          <p>Debug: Game phase check - should show GameBoard when gamePhase === 'playing'</p>
        </div>
      </div>
    );
  };

  return (
    <div className="online-game-wrapper">

      
      {renderCurrentScreen()}
      <Toaster position="top-right" />
    </div>
  );
}

export default OnlineGame; 