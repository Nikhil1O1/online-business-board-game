import React from 'react';
import { X, DollarSign, Home, Users, Zap, Train } from 'lucide-react';

const PropertyModal = ({ 
  property, 
  propertyId, 
  gameState, 
  currentPlayer, 
  onBuy, 
  onClose, 
  isMyTurn 
}) => {
  const isOwned = gameState.properties[propertyId];
  const owner = isOwned ? gameState.players.find(p => p.id === isOwned.owner) : null;
  const canBuy = !isOwned && currentPlayer && currentPlayer.money >= property.price && isMyTurn;

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPropertyIcon = () => {
    switch (property.type) {
      case 'property':
        return <Home className="w-6 h-6" />;
      case 'railroad':
        return <Train className="w-6 h-6" />;
      case 'utility':
        return <Zap className="w-6 h-6" />;
      default:
        return <Home className="w-6 h-6" />;
    }
  };

  const getPropertyColor = () => {
    if (property.type === 'railroad') return '#6c757d';
    if (property.type === 'utility') return '#ffc107';
    return property.color || '#6c757d';
  };

  const renderRentStructure = () => {
    if (property.type === 'property' && property.rent) {
      return (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Rent Structure</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Base Rent:</span>
              <span className="font-mono">{formatMoney(property.rent[0])}</span>
            </div>
            <div className="flex justify-between">
              <span>With Color Set:</span>
              <span className="font-mono">{formatMoney(property.rent[1])}</span>
            </div>
            <div className="flex justify-between">
              <span>With 1 House:</span>
              <span className="font-mono">{formatMoney(property.rent[2])}</span>
            </div>
            <div className="flex justify-between">
              <span>With 2 Houses:</span>
              <span className="font-mono">{formatMoney(property.rent[3])}</span>
            </div>
            <div className="flex justify-between">
              <span>With 3 Houses:</span>
              <span className="font-mono">{formatMoney(property.rent[4])}</span>
            </div>
            <div className="flex justify-between">
              <span>With 4 Houses:</span>
              <span className="font-mono">{formatMoney(property.rent[5])}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>With Hotel:</span>
              <span className="font-mono">{formatMoney(property.rent[6] || property.rent[5])}</span>
            </div>
          </div>
        </div>
      );
    }

    if (property.type === 'railroad') {
      return (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Railroad Rent</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>1 Railroad:</span>
              <span className="font-mono">$25</span>
            </div>
            <div className="flex justify-between">
              <span>2 Railroads:</span>
              <span className="font-mono">$50</span>
            </div>
            <div className="flex justify-between">
              <span>3 Railroads:</span>
              <span className="font-mono">$100</span>
            </div>
            <div className="flex justify-between">
              <span>4 Railroads:</span>
              <span className="font-mono">$200</span>
            </div>
          </div>
        </div>
      );
    }

    if (property.type === 'utility') {
      return (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Utility Rent</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>1 Utility:</span>
              <span className="font-mono">4x Dice Roll</span>
            </div>
            <div className="flex justify-between">
              <span>2 Utilities:</span>
              <span className="font-mono">10x Dice Roll</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderOwnershipInfo = () => {
    if (!isOwned || !owner) return null;

    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Ownership
        </h4>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border-2 border-white"
            style={{ backgroundColor: owner.color }}
          />
          <span className="font-medium">{owner.name}</span>
        </div>
        {isOwned.houses > 0 && (
          <div className="mt-1 text-sm text-gray-600">
            Houses: {isOwned.houses}
          </div>
        )}
        {isOwned.mortgaged && (
          <div className="mt-1 text-sm text-red-600 font-semibold">
            MORTGAGED
          </div>
        )}
      </div>
    );
  };

  const renderActionButtons = () => {
    if (!isMyTurn) {
      return (
        <div className="mt-6 text-center">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      );
    }

    if (canBuy) {
      return (
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => onBuy(propertyId, property.price)}
            className="btn btn-success flex-1"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Buy for {formatMoney(property.price)}
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="mt-6 text-center">
        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>
      </div>
    );
  };

  return (
    <div className="property-modal">
      <div className="modal-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: getPropertyColor(), color: 'white' }}
            >
              {getPropertyIcon()}
            </div>
            <div>
              <h2 className="modal-title">{property.name}</h2>
              <div className="text-sm text-gray-600 capitalize">
                {property.type}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Property Details */}
        <div className="space-y-4">
          {/* Price */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="font-semibold">Purchase Price:</span>
            <span className="font-bold text-lg text-blue-600">
              {formatMoney(property.price)}
            </span>
          </div>

          {/* Mortgage Value */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Mortgage Value:</span>
            <span className="font-mono">{formatMoney(property.price / 2)}</span>
          </div>

          {/* Rent Structure */}
          {renderRentStructure()}

          {/* Ownership Info */}
          {renderOwnershipInfo()}

          {/* Player's Money */}
          {currentPlayer && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Your Money:</span>
                <span className="font-bold text-green-600">
                  {formatMoney(currentPlayer.money)}
                </span>
              </div>
              {!canBuy && !isOwned && currentPlayer.money < property.price && (
                <div className="text-sm text-red-600 mt-1">
                  Insufficient funds to purchase
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {renderActionButtons()}
      </div>
    </div>
  );
};

export default PropertyModal; 