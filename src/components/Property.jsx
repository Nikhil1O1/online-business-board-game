import React, { useState, useEffect } from 'react';

const Property = ({ position, property, isOwned, owner, playersHere, onClick, currentPlayerPosition, isCurrentPlayerTurn }) => {
  const [justLanded, setJustLanded] = useState(false);
  const [previousPlayersCount, setPreviousPlayersCount] = useState(0);

  // Track when new players land on this property
  useEffect(() => {
    if (playersHere.length > previousPlayersCount) {
      setJustLanded(true);
      const timer = setTimeout(() => setJustLanded(false), 2000);
      return () => clearTimeout(timer);
    }
    setPreviousPlayersCount(playersHere.length);
  }, [playersHere.length, previousPlayersCount]);

  const isCurrentPlayerHere = currentPlayerPosition === position;
  const hasCurrentPlayer = playersHere.some(p => p.isActive);
  const getPropertyStyle = () => {
    let style = {
      backgroundColor: 'white',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '4px',
      fontSize: '8px',
      fontWeight: 'bold',
      textAlign: 'center',
      position: 'relative',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minHeight: '50px'
    };

    // Property color strip for regular properties
    if (property.color && property.type === 'property') {
      style.border = '2px solid #34495e';
      style.borderTop = `8px solid ${property.color}`;
    } else {
      // Default border for non-property types
      style.border = '2px solid #34495e';
    }

    // Corner properties
    if (property.type === 'corner') {
      style.backgroundColor = '#3498db';
      style.color = 'white';
      style.fontSize = '10px';
    }
    
    // Railroad properties
    if (property.type === 'railroad') {
      style.backgroundColor = '#f8f9fa';
      style.borderTop = '8px solid #6c757d';
    }
    
    // Utility properties
    if (property.type === 'utility') {
      style.backgroundColor = '#fff3cd';
      style.borderTop = '8px solid #ffc107';
    }
    
    // Tax spaces
    if (property.type === 'tax') {
      style.backgroundColor = '#f8d7da';
      style.color = '#721c24';
    }
    
    // Special spaces (Chance, Community Chest)
    if (property.type === 'special') {
      style.backgroundColor = '#d1ecf1';
      style.color = '#0c5460';
    }

    // Owned property styling
    if (isOwned && owner) {
      style.borderColor = owner.color || '#e74c3c';
      style.borderWidth = '3px';
      style.boxShadow = `0 0 0 1px ${owner.color || '#e74c3c'}40`;
    }

    // Current player position highlighting
    if (isCurrentPlayerHere && isCurrentPlayerTurn) {
      style.borderColor = '#f39c12';
      style.borderWidth = '3px';
      style.boxShadow = '0 0 10px rgba(243, 156, 18, 0.6)';
    }

    // Landing animation
    if (justLanded) {
      style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.9)';
      style.borderColor = '#3498db';
      style.transform = 'scale(1.05)';
    }

    return style;
  };

  const renderPropertyInfo = () => {
    if (property.type === 'corner') {
      return (
        <div className="text-center">
          <div className="font-bold text-xs">{property.name}</div>
          {property.special === 'start' && <div className="text-xs">Collect $200</div>}
        </div>
      );
    }

    if (property.type === 'property') {
      return (
        <div className="text-center">
          <div className="property-name font-bold">{property.name}</div>
          <div className="property-price text-gray-600">${property.price}</div>
          {isOwned && owner && (
            <div className="text-xs mt-1" style={{ color: owner.color }}>
              {owner.name}
            </div>
          )}
        </div>
      );
    }

    if (property.type === 'railroad') {
      return (
        <div className="text-center">
          <div className="text-xs">🚂</div>
          <div className="property-name font-bold">{property.name}</div>
          <div className="property-price text-gray-600">${property.price}</div>
          {isOwned && owner && (
            <div className="text-xs mt-1" style={{ color: owner.color }}>
              {owner.name}
            </div>
          )}
        </div>
      );
    }

    if (property.type === 'utility') {
      return (
        <div className="text-center">
          <div className="text-xs">{property.name.includes('Electric') ? '⚡' : '💧'}</div>
          <div className="property-name font-bold">{property.name}</div>
          <div className="property-price text-gray-600">${property.price}</div>
          {isOwned && owner && (
            <div className="text-xs mt-1" style={{ color: owner.color }}>
              {owner.name}
            </div>
          )}
        </div>
      );
    }

    if (property.type === 'tax') {
      return (
        <div className="text-center">
          <div className="text-xs">💰</div>
          <div className="property-name font-bold">{property.name}</div>
          <div className="property-price">Pay ${property.amount}</div>
        </div>
      );
    }

    if (property.type === 'special') {
      return (
        <div className="text-center">
          <div className="text-xs">{property.name.includes('Chance') ? '❓' : '📋'}</div>
          <div className="property-name font-bold">{property.name}</div>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="property-name font-bold">{property.name}</div>
      </div>
    );
  };

  const renderPlayerPieces = () => {
    if (playersHere.length === 0) return null;

    return (
      <div className="absolute top-1 right-1 flex flex-wrap gap-1">
        {playersHere.map((player, index) => {
          const isActivePlayer = player.isActive;
          return (
            <div
              key={player.id}
              className={`player-piece ${justLanded ? 'player-landing' : ''}`}
              style={{
                backgroundColor: player.color,
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                border: `2px solid ${isActivePlayer ? '#ffd700' : 'white'}`,
                position: 'relative',
                transition: 'all 0.3s ease-in-out',
                boxShadow: isActivePlayer 
                  ? `0 0 8px ${player.color}, 0 0 15px rgba(255, 215, 0, 0.5)`
                  : justLanded 
                    ? `0 0 10px ${player.color}` 
                    : '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: isActivePlayer ? 15 : 10,
                transform: isActivePlayer ? 'scale(1.1)' : 'scale(1)'
              }}
              title={`${player.name}${isActivePlayer ? ' (Current Turn)' : ''}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={getPropertyStyle()}
      onClick={onClick}
      className={`property ${isCurrentPlayerHere && isCurrentPlayerTurn ? 'current-player-property' : ''} ${justLanded ? 'property-landing' : ''}`}
      onMouseEnter={(e) => {
        if (!justLanded && !(isCurrentPlayerHere && isCurrentPlayerTurn)) {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!justLanded && !(isCurrentPlayerHere && isCurrentPlayerTurn)) {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = isOwned ? `0 0 0 1px ${owner?.color || '#e74c3c'}40` : 'none';
        }
      }}
    >
      {renderPropertyInfo()}
      {renderPlayerPieces()}
    </div>
  );
};

export default Property; 