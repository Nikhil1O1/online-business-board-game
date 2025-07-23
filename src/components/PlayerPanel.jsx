import React from 'react';
import { User, DollarSign, Home } from 'lucide-react';

const PlayerPanel = ({ player, isCurrentPlayer, isMyPlayer, properties }) => {
  const panelClasses = `
    player-info 
    ${isCurrentPlayer ? 'current-player' : ''} 
    ${isMyPlayer ? 'border-blue-400 bg-blue-50' : ''}
  `;

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPropertyValue = () => {
    return properties.reduce((total, property) => {
      return total + (property.price || 0);
    }, 0);
  };

  const getNetWorth = () => {
    return player.money + getPropertyValue();
  };

  const renderPlayerStatus = () => {
    const statusItems = [];
    
    if (player.inJail) {
      statusItems.push(
        <span key="jail" className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
          In Jail
        </span>
      );
    }
    
    if (isCurrentPlayer) {
      statusItems.push(
        <span key="turn" className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
          Current Turn
        </span>
      );
    }
    
    if (isMyPlayer) {
      statusItems.push(
        <span key="you" className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
          You
        </span>
      );
    }

    return statusItems;
  };

  const renderProperties = () => {
    if (properties.length === 0) {
      return (
        <div className="text-xs text-gray-500 italic">
          No properties owned
        </div>
      );
    }

    const propertyGroups = {};
    properties.forEach(property => {
      const group = property.color || property.type;
      if (!propertyGroups[group]) {
        propertyGroups[group] = [];
      }
      propertyGroups[group].push(property);
    });

    return (
      <div className="space-y-1">
        {Object.entries(propertyGroups).map(([group, groupProperties]) => (
          <div key={group} className="flex flex-wrap gap-1">
            {groupProperties.map(property => (
              <div
                key={property.id}
                className="px-2 py-1 text-xs rounded"
                style={{
                  backgroundColor: property.color || '#f8f9fa',
                  color: property.color ? 'white' : '#666',
                  fontSize: '10px'
                }}
                title={`${property.name} - $${property.price}`}
              >
                {property.name}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={panelClasses}>
      {/* Player Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border-2 border-white"
            style={{ backgroundColor: player.color }}
          />
          <div className="flex items-center gap-1">
            <User size={16} />
            <span className="player-name">{player.name}</span>
          </div>
        </div>
        <div className="flex gap-1">
          {renderPlayerStatus()}
        </div>
      </div>

      {/* Money Information */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-1">
          <DollarSign size={14} className="text-green-600" />
          <span className="player-money text-green-600 font-bold">
            {formatMoney(player.money)}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          Net Worth: {formatMoney(getNetWorth())}
        </div>
      </div>

      {/* Properties */}
      <div className="mb-2">
        <div className="flex items-center gap-1 mb-2">
          <Home size={14} className="text-blue-600" />
          <span className="text-sm font-semibold">
            Properties ({properties.length})
          </span>
        </div>
        <div className="max-h-20 overflow-y-auto">
          {renderProperties()}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">Position:</span> {player.position}
          </div>
          <div>
            <span className="font-medium">Properties:</span> ${formatMoney(getPropertyValue())}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPanel; 