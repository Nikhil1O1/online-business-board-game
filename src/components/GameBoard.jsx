import React, { useState, useCallback } from 'react';
import { BOARD_POSITIONS } from '../data/gameData';
import Property from './Property.jsx';
import PlayerPanel from './PlayerPanel.jsx';
import GameControls from './GameControls.jsx';
import PropertyModal from './PropertyModal.jsx';
import PropertyManagementModal from './PropertyManagementModal.jsx';
import toast from 'react-hot-toast';

const GameBoard = ({ gameState, playerId, isHost, onGameAction, connectionStatus }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showPropertyManagement, setShowPropertyManagement] = useState(false);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === playerId;

  // Debug log (can be removed later)
  if (isMyTurn) {
    console.log('🎮 My turn - GameBoard:', { 
      myPlayerId: playerId, 
      currentPlayerName: currentPlayer?.name, 
      isMyTurn 
    });
  }

  const handlePropertyClick = useCallback((propertyId) => {
    const property = BOARD_POSITIONS[propertyId];
    
    // Only allow interaction if it's the player's turn and they're on this property
    if (!isMyTurn) {
      toast.error("It's not your turn!");
      return;
    }
    
    if (currentPlayer.position !== parseInt(propertyId)) {
      toast.error("You can only interact with the property you're standing on!");
      return;
    }
    
    // Only show modal for purchasable properties
    if (property && (property.type === 'property' || property.type === 'railroad' || property.type === 'utility')) {
      const isOwned = gameState.properties[propertyId];
      if (isOwned) {
        toast(`This property is owned by ${gameState.players.find(p => p.id === isOwned.owner)?.name}`, {
          icon: 'ℹ️'
        });
        return;
      }
      
      setSelectedProperty(propertyId);
      setShowPropertyModal(true);
    } else {
      // Handle special spaces
      handleSpecialSpace(property, propertyId);
    }
  }, [isMyTurn, currentPlayer, gameState]);

  const handleSpecialSpace = useCallback((property, propertyId) => {
    if (property.type === 'tax') {
      toast(`Pay $${property.amount} in taxes!`, {
        icon: '💰'
      });
      // TODO: Implement tax payment
    } else if (property.type === 'special') {
      toast(`Landed on ${property.name}!`, {
        icon: property.name.includes('Chance') ? '❓' : '📋'
      });
      // TODO: Implement Chance/Community Chest cards
    } else if (property.type === 'corner') {
      if (property.special === 'start') {
        toast.success('Passed GO! Collect $200');
      } else {
        toast(`Landed on ${property.name}!`, {
          icon: '🏠'
        });
      }
    }
  }, []);

  // Auto-show property modal when a player lands on an unowned property
  const checkPropertyLanding = useCallback(() => {
    if (!isMyTurn || gameState.lastRoll === 0) return;
    
    const currentProperty = BOARD_POSITIONS[currentPlayer.position];
    const isOwned = gameState.properties[currentPlayer.position];
    
    if (currentProperty && (currentProperty.type === 'property' || currentProperty.type === 'railroad' || currentProperty.type === 'utility') && !isOwned) {
      toast.success(`You can buy ${currentProperty.name} for $${currentProperty.price}!`);
      setTimeout(() => {
        setSelectedProperty(currentPlayer.position.toString());
        setShowPropertyModal(true);
      }, 1000); // Delay to let movement animation complete
    } else if (isOwned && gameState.players.find(p => p.id === isOwned.owner)?.id !== currentPlayer.id) {
      const owner = gameState.players.find(p => p.id === isOwned.owner);
      toast(`You landed on ${owner?.name}'s property! Pay rent.`, {
        icon: '⚠️',
        style: {
          background: '#f59e0b',
          color: '#fff'
        }
      });
      // TODO: Implement rent payment
    }
  }, [isMyTurn, gameState, currentPlayer]);

  // Check for property landing when position changes
  React.useEffect(() => {
    checkPropertyLanding();
  }, [currentPlayer?.position, checkPropertyLanding]);

  const handleRollDice = useCallback(() => {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    
    const oldPosition = currentPlayer.position;
    const newPosition = (oldPosition + total) % 40;
    const propertyName = BOARD_POSITIONS[newPosition]?.name || `Space ${newPosition}`;
    
    onGameAction({
      type: 'ROLL_DICE',
      dice: [dice1, dice2],
      playerId
    });

    toast.success(`🎲 Rolled ${dice1} + ${dice2} = ${total}`);
    
    // Show movement info after a short delay
    setTimeout(() => {
      if (newPosition < oldPosition) {
        toast.success(`🎉 Passed GO! Collect $200`);
      }
      toast(`📍 Moved to ${propertyName}`, { 
        duration: 3000,
        icon: '📍'
      });
    }, 500);
  }, [onGameAction, playerId, currentPlayer]);

  const handleBuyProperty = useCallback((propertyId, price) => {
    onGameAction({
      type: 'BUY_PROPERTY',
      propertyId,
      price,
      playerId
    });
    setShowPropertyModal(false);
    toast.success('Property purchased!');
  }, [onGameAction, playerId]);

  const handleEndTurn = useCallback(() => {
    onGameAction({
      type: 'END_TURN',
      playerId
    });
  }, [onGameAction, playerId]);

  const handlePropertyAction = useCallback((action) => {
    onGameAction(action);
  }, [onGameAction]);

  const renderBoard = () => {
    const boardElements = [];
    
    // Create board grid
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        const position = Object.keys(BOARD_POSITIONS).find(pos => {
          const p = BOARD_POSITIONS[pos];
          return p.x === col && p.y === row;
        });

        if (position) {
          const property = BOARD_POSITIONS[position];
          const isOwned = gameState.properties[position];
          const owner = isOwned ? gameState.players.find(p => p.id === isOwned.owner) : null;
          
          // Find players on this position
          const playersHere = gameState.players.filter(p => p.position === parseInt(position));

          boardElements.push(
            <Property
              key={position}
              position={parseInt(position)}
              property={property}
              isOwned={!!isOwned}
              owner={owner}
              playersHere={playersHere}
              onClick={() => handlePropertyClick(position)}
              currentPlayerPosition={currentPlayer?.position}
              isCurrentPlayerTurn={isMyTurn}
            />
          );
        } else {
          // Empty grid cell (center area)
          boardElements.push(
            <div 
              key={`empty-${row}-${col}`} 
              className="property-center"
            >
              {row === 5 && col === 5 && (
                <div className="text-center">
                  <div className="text-lg">🏠</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>RichUP</div>
                </div>
              )}
            </div>
          );
        }
      }
    }

    return boardElements;
  };

  return (
    <div className="app">
      <div className="game-container">
        {/* Game Header */}
        <div className="game-header">
          <h1 className="text-3xl font-bold text-gray-100">🏠 RichUP Clone</h1>
          <div className="text-sm text-gray-300 mt-2">
            Turn {gameState.turn} • {currentPlayer?.name}'s Turn
            {isMyTurn && <span className="text-blue-400 font-semibold"> (Your Turn)</span>}
          </div>
          
          {/* Connection Status Indicator */}
          <div className="mt-2 text-xs">
            <span className={`px-3 py-1 rounded-full ${
              connectionStatus === 'connected' 
                ? 'bg-green-900 text-green-300 border border-green-600' 
                : connectionStatus === 'hosting'
                ? 'bg-blue-900 text-blue-300 border border-blue-600'
                : 'bg-yellow-900 text-yellow-300 border border-yellow-600'
            }`}>
              {isHost ? '👑 Host' : connectionStatus === 'connected' ? '🔗 Connected' : '⏳ Connecting...'}
            </span>
          </div>
        </div>

        {/* Main Game Layout */}
        <div className="game-layout">
          {/* Game Board Container */}
          <div className="game-board-container">
            <div className="game-board">
              {renderBoard()}
            </div>
          </div>

          {/* Game Sidebar */}
          <div className="game-sidebar">
            <div className="game-ui">
              {/* Players Section */}
              <div className="players-section">
                <h3 className="text-lg font-bold text-gray-200 mb-4">Players</h3>
                {gameState.players.map((player, index) => (
                  <PlayerPanel
                    key={player.id}
                    player={player}
                    isCurrentPlayer={index === gameState.currentPlayerIndex}
                    isMyPlayer={player.id === playerId}
                    properties={player.properties.map(propId => ({
                      id: propId,
                      ...BOARD_POSITIONS[propId]
                    }))}
                  />
                ))}
              </div>

              {/* Game Controls Section */}
              <div className="controls-section">
                <h3 className="text-lg font-bold text-gray-200 mb-4">Game Controls</h3>
                <GameControls
                  gameState={gameState}
                  isMyTurn={isMyTurn}
                  canRoll={isMyTurn && gameState.lastRoll === 0}
                  onRollDice={handleRollDice}
                  onEndTurn={handleEndTurn}
                  onManageProperties={() => setShowPropertyManagement(true)}
                  currentPlayer={currentPlayer}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Property Modal */}
        {showPropertyModal && selectedProperty && (
          <PropertyModal
            property={BOARD_POSITIONS[selectedProperty]}
            propertyId={selectedProperty}
            gameState={gameState}
            currentPlayer={currentPlayer}
            onBuy={handleBuyProperty}
            onClose={() => setShowPropertyModal(false)}
            isMyTurn={isMyTurn}
          />
        )}

        {/* Property Management Modal */}
        {showPropertyManagement && (
          <PropertyManagementModal
            gameState={gameState}
            currentPlayer={currentPlayer}
            onPropertyAction={handlePropertyAction}
            onClose={() => setShowPropertyManagement(false)}
            isMyTurn={isMyTurn}
          />
        )}
      </div>
    </div>
  );
};

export default GameBoard; 