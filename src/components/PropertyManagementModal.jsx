import React, { useState } from 'react';
import { X, Home, DollarSign, Plus, Minus, AlertTriangle, Building } from 'lucide-react';
import { BOARD_POSITIONS } from '../../data/game/gameData';

const PropertyManagementModal = ({ 
  gameState, 
  currentPlayer, 
  onPropertyAction, 
  onClose, 
  isMyTurn 
}) => {
  const [selectedTab, setSelectedTab] = useState('properties');

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get all properties owned by current player
  const ownedProperties = currentPlayer.properties.map(propId => {
    const property = BOARD_POSITIONS[propId];
    const propertyState = gameState.properties[propId];
    return {
      id: propId,
      ...property,
      ...propertyState
    };
  });

  // Group properties by color for monopoly checking
  const getColorGroups = () => {
    const groups = {};
    ownedProperties.forEach(prop => {
      if (prop.type === 'property') {
        const color = prop.color || 'other';
        if (!groups[color]) groups[color] = [];
        groups[color].push(prop);
      }
    });
    return groups;
  };

  // Check if player has monopoly (all properties of same color)
  const hasMonopoly = (color) => {
    const allPropsOfColor = Object.values(BOARD_POSITIONS).filter(
      prop => prop.type === 'property' && prop.color === color
    );
    const ownedPropsOfColor = ownedProperties.filter(
      prop => prop.type === 'property' && prop.color === color
    );
    return allPropsOfColor.length === ownedPropsOfColor.length;
  };

  // Check if property can be developed (has monopoly and no mortgaged properties)
  const canDevelop = (property) => {
    if (property.type !== 'property') return false;
    if (!hasMonopoly(property.color)) return false;
    
    // Check if any property in the color group is mortgaged
    const colorGroup = ownedProperties.filter(p => p.color === property.color);
    return !colorGroup.some(p => p.mortgaged);
  };

  // Get house/hotel cost
  const getBuildingCost = (property) => {
    return property.buildingCost || Math.floor(property.price * 0.5);
  };

  const handleMortgage = (propertyId, property) => {
    const mortgageValue = Math.floor(property.price / 2);
    onPropertyAction({
      type: 'MORTGAGE_PROPERTY',
      propertyId,
      mortgageValue,
      playerId: currentPlayer.id
    });
  };

  const handleUnmortgage = (propertyId, property) => {
    const unmortgageValue = Math.floor(property.price / 2 * 1.1); // 10% interest
    onPropertyAction({
      type: 'UNMORTGAGE_PROPERTY',
      propertyId,
      unmortgageValue,
      playerId: currentPlayer.id
    });
  };

  const handleBuyHouse = (propertyId, property) => {
    const cost = getBuildingCost(property);
    onPropertyAction({
      type: 'BUY_HOUSE',
      propertyId,
      cost,
      playerId: currentPlayer.id
    });
  };

  const handleSellHouse = (propertyId, property) => {
    const value = Math.floor(getBuildingCost(property) / 2);
    onPropertyAction({
      type: 'SELL_HOUSE',
      propertyId,
      value,
      playerId: currentPlayer.id
    });
  };

  const renderPropertyCard = (property) => {
    const canMortgage = !property.mortgaged && property.houses === 0;
    const canUnmortgage = property.mortgaged && currentPlayer.money >= Math.floor(property.price / 2 * 1.1);
    const canBuyHouse = canDevelop(property) && property.houses < 5 && 
                       currentPlayer.money >= getBuildingCost(property);
    const canSellHouse = property.houses > 0;

    return (
      <div key={property.id} className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {property.color && (
              <div 
                className="w-4 h-8 rounded"
                style={{ backgroundColor: property.color }}
              />
            )}
            <div>
              <h4 className="font-semibold text-gray-200">{property.name}</h4>
              <p className="text-sm text-gray-400 capitalize">{property.type}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Value: {formatMoney(property.price)}</p>
            {property.mortgaged && (
              <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded">
                MORTGAGED
              </span>
            )}
          </div>
        </div>

        {property.type === 'property' && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                Houses: {property.houses || 0}
                {property.houses === 5 && ' (Hotel)'}
              </span>
            </div>
            {hasMonopoly(property.color) && (
              <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
                MONOPOLY
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {/* Mortgage/Unmortgage */}
          {canMortgage && (
            <button
              onClick={() => handleMortgage(property.id, property)}
              className="btn btn-primary text-xs px-3 py-1"
            >
              Mortgage (+{formatMoney(Math.floor(property.price / 2))})
            </button>
          )}
          
          {canUnmortgage && (
            <button
              onClick={() => handleUnmortgage(property.id, property)}
              className="btn btn-success text-xs px-3 py-1"
            >
              Unmortgage (-{formatMoney(Math.floor(property.price / 2 * 1.1))})
            </button>
          )}

          {/* House Management */}
          {property.type === 'property' && (
            <>
              {canBuyHouse && (
                <button
                  onClick={() => handleBuyHouse(property.id, property)}
                  className="btn btn-success text-xs px-3 py-1 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Buy House (-{formatMoney(getBuildingCost(property))})
                </button>
              )}
              
              {canSellHouse && (
                <button
                  onClick={() => handleSellHouse(property.id, property)}
                  className="btn btn-danger text-xs px-3 py-1 flex items-center gap-1"
                >
                  <Minus className="w-3 h-3" />
                  Sell House (+{formatMoney(Math.floor(getBuildingCost(property) / 2))})
                </button>
              )}
            </>
          )}
        </div>

        {!canDevelop(property) && property.type === 'property' && !property.mortgaged && (
          <p className="text-xs text-gray-500 mt-2">
            {!hasMonopoly(property.color) 
              ? "Need monopoly to develop" 
              : "Cannot develop while properties in group are mortgaged"}
          </p>
        )}
      </div>
    );
  };

  const renderSummary = () => {
    const totalValue = ownedProperties.reduce((sum, prop) => sum + prop.price, 0);
    const mortgagedValue = ownedProperties
      .filter(prop => prop.mortgaged)
      .reduce((sum, prop) => sum + Math.floor(prop.price / 2), 0);
    const housesCount = ownedProperties.reduce((sum, prop) => sum + (prop.houses || 0), 0);

    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
          <Building className="w-5 h-5" />
          Portfolio Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Total Properties</p>
            <p className="font-semibold text-gray-200">{ownedProperties.length}</p>
          </div>
          <div>
            <p className="text-gray-400">Total Value</p>
            <p className="font-semibold text-gray-200">{formatMoney(totalValue)}</p>
          </div>
          <div>
            <p className="text-gray-400">Mortgaged Value</p>
            <p className="font-semibold text-gray-200">{formatMoney(mortgagedValue)}</p>
          </div>
          <div>
            <p className="text-gray-400">Total Houses</p>
            <p className="font-semibold text-gray-200">{housesCount}</p>
          </div>
        </div>
      </div>
    );
  };

  if (!isMyTurn) {
    return (
      <div className="property-modal">
        <div className="modal-content">
          <div className="flex items-center justify-between mb-4">
            <h2 className="modal-title">Property Management</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-400">You can only manage properties during your turn.</p>
            <button onClick={onClose} className="btn btn-primary mt-4">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (ownedProperties.length === 0) {
    return (
      <div className="property-modal">
        <div className="modal-content">
          <div className="flex items-center justify-between mb-4">
            <h2 className="modal-title">Property Management</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <Home className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">You don't own any properties yet.</p>
            <button onClick={onClose} className="btn btn-primary mt-4">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="property-modal">
      <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-900 pb-4 border-b border-gray-600">
          <h2 className="modal-title">Property Management</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {renderSummary()}
          
          <div>
            <h3 className="font-semibold text-gray-200 mb-3">Your Properties</h3>
            {ownedProperties.map(renderPropertyCard)}
          </div>

          <div className="pt-4 border-t border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Your Money</p>
                <p className="font-bold text-green-400">{formatMoney(currentPlayer.money)}</p>
              </div>
              <button onClick={onClose} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyManagementModal; 