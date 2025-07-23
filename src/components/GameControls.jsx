import React from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Play, Square, Home, Building } from 'lucide-react';

const GameControls = ({ gameState, isMyTurn, canRoll, onRollDice, onEndTurn, onManageProperties, currentPlayer }) => {
  // Debug log (can be removed later)
  if (isMyTurn) {
    console.log('🎮 My turn - GameControls:', { isMyTurn, canRoll, lastRoll: gameState.lastRoll });
  }

  const getDiceIcon = (value) => {
    const diceIcons = {
      1: Dice1,
      2: Dice2,
      3: Dice3,
      4: Dice4,
      5: Dice5,
      6: Dice6
    };
    return diceIcons[value] || Square;
  };

  const renderDice = () => {
    if (!gameState.dice || gameState.dice.length !== 2) {
      return (
        <div className="flex gap-2 justify-center">
          <div className="dice">
            <Square size={24} />
          </div>
          <div className="dice">
            <Square size={24} />
          </div>
        </div>
      );
    }

    const Dice1Icon = getDiceIcon(gameState.dice[0]);
    const Dice2Icon = getDiceIcon(gameState.dice[1]);

    return (
      <div className="flex gap-2 justify-center">
        <div 
          className="dice"
          style={{
            animation: canRoll ? 'none' : 'bounce 0.5s ease-in-out'
          }}
        >
          <Dice1Icon size={24} />
        </div>
        <div 
          className="dice"
          style={{
            animation: canRoll ? 'none' : 'bounce 0.5s ease-in-out 0.1s'
          }}
        >
          <Dice2Icon size={24} />
        </div>
      </div>
    );
  };

  const getDiceTotal = () => {
    if (!gameState.dice || gameState.dice.length !== 2) return 0;
    return gameState.dice[0] + gameState.dice[1];
  };

  const isDoubles = () => {
    if (!gameState.dice || gameState.dice.length !== 2) return false;
    return gameState.dice[0] === gameState.dice[1];
  };

  return (
    <div className="game-controls">
      {/* Dice Section */}
      <div className="dice-container">
        <h3 className="text-lg font-semibold mb-3">Dice</h3>
        
        {renderDice()}
        
        {gameState.lastRoll > 0 && (
          <div className="mt-3">
            <div className="text-lg font-bold">
              Total: {getDiceTotal()}
            </div>
            {isDoubles() && (
              <div className="text-sm text-blue-600 font-semibold">
                🎯 Doubles! Roll again!
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={onRollDice}
            disabled={!canRoll || !isMyTurn}
            className={`btn w-full ${
              canRoll && isMyTurn 
                ? 'btn-primary' 
                : 'btn-primary opacity-50 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 mr-2" />
            {!isMyTurn ? 'Not Your Turn' : canRoll ? 'Roll Dice' : 'Already Rolled'}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <h3 className="text-lg font-semibold mb-3">Actions</h3>
        
        <button
          onClick={onEndTurn}
          disabled={!isMyTurn || canRoll}
          className={`btn w-full ${
            isMyTurn && !canRoll 
              ? 'btn-success' 
              : 'btn-success opacity-50 cursor-not-allowed'
          }`}
        >
          End Turn
        </button>

        {/* Property Management */}
        <button
          onClick={onManageProperties}
          disabled={!isMyTurn}
          className={`btn w-full ${
            isMyTurn 
              ? 'btn-primary' 
              : 'btn-primary opacity-50 cursor-not-allowed'
          }`}
        >
          <Building className="w-4 h-4 mr-2" />
          Manage Properties
          {currentPlayer?.properties?.length > 0 && (
            <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {currentPlayer.properties.length}
            </span>
          )}
        </button>

        <button
          disabled
          className="btn btn-secondary w-full opacity-50 cursor-not-allowed"
        >
          Trade Properties
        </button>
      </div>

      {/* Game Info */}
      <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
        <h4 className="font-semibold mb-2 text-sm text-gray-200">Game Info</h4>
        <div className="text-xs space-y-1 text-gray-300">
          <div>Turn: {gameState.turn}</div>
          <div>Phase: {gameState.gamePhase}</div>
          <div>Players: {gameState.players.length}</div>
          {gameState.lastRoll > 0 && (
            <div>Last Roll: {gameState.lastRoll}</div>
          )}
        </div>
      </div>

      {/* Turn Status */}
      <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-900 to-blue-800 border border-blue-600">
        <div className="text-sm font-semibold">
          {isMyTurn ? (
            <span className="text-blue-300">🎯 Your Turn!</span>
          ) : (
            <span className="text-gray-300">⏳ Waiting for other players...</span>
          )}
        </div>
        {isMyTurn && canRoll && (
          <div className="text-xs text-blue-200 mt-1">
            Click "Roll Dice" to continue
          </div>
        )}
        {isMyTurn && !canRoll && gameState.lastRoll > 0 && (
          <div className="text-xs text-blue-200 mt-1">
            Click "End Turn" when ready
          </div>
        )}
      </div>
    </div>
  );
};

export default GameControls; 