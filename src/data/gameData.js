export const BOARD_POSITIONS = {
  // Bottom row (left to right)
  0: { x: 10, y: 10, type: 'corner', name: 'GO', special: 'start' },
  1: { x: 9, y: 10, type: 'property', name: 'Mediterranean Ave', price: 60, color: '#8B4513', rent: [2, 10, 30, 90, 160, 250], buildingCost: 50 },
  2: { x: 8, y: 10, type: 'special', name: 'Community Chest' },
  3: { x: 7, y: 10, type: 'property', name: 'Baltic Ave', price: 60, color: '#8B4513', rent: [4, 20, 60, 180, 320, 450], buildingCost: 50 },
  4: { x: 6, y: 10, type: 'tax', name: 'Income Tax', amount: 200 },
  5: { x: 5, y: 10, type: 'railroad', name: 'Reading Railroad', price: 200 },
  6: { x: 4, y: 10, type: 'property', name: 'Oriental Ave', price: 100, color: '#87CEEB', rent: [6, 30, 90, 270, 400, 550], buildingCost: 50 },
  7: { x: 3, y: 10, type: 'special', name: 'Chance' },
  8: { x: 2, y: 10, type: 'property', name: 'Vermont Ave', price: 100, color: '#87CEEB', rent: [6, 30, 90, 270, 400, 550], buildingCost: 50 },
  9: { x: 1, y: 10, type: 'property', name: 'Connecticut Ave', price: 120, color: '#87CEEB', rent: [8, 40, 100, 300, 450, 600], buildingCost: 50 },
  
  // Left side (bottom to top)
  10: { x: 0, y: 10, type: 'corner', name: 'Jail' },
  11: { x: 0, y: 9, type: 'property', name: 'St. Charles Place', price: 140, color: '#FF69B4', rent: [10, 50, 150, 450, 625, 750], buildingCost: 100 },
  12: { x: 0, y: 8, type: 'utility', name: 'Electric Company', price: 150 },
  13: { x: 0, y: 7, type: 'property', name: 'States Ave', price: 140, color: '#FF69B4', rent: [10, 50, 150, 450, 625, 750], buildingCost: 100 },
  14: { x: 0, y: 6, type: 'property', name: 'Virginia Ave', price: 160, color: '#FF69B4', rent: [12, 60, 180, 500, 700, 900], buildingCost: 100 },
  15: { x: 0, y: 5, type: 'railroad', name: 'Pennsylvania Railroad', price: 200 },
  16: { x: 0, y: 4, type: 'property', name: 'St. James Place', price: 180, color: '#FFA500', rent: [14, 70, 200, 550, 750, 950], buildingCost: 100 },
  17: { x: 0, y: 3, type: 'special', name: 'Community Chest' },
  18: { x: 0, y: 2, type: 'property', name: 'Tennessee Ave', price: 180, color: '#FFA500', rent: [14, 70, 200, 550, 750, 950], buildingCost: 100 },
  19: { x: 0, y: 1, type: 'property', name: 'New York Ave', price: 200, color: '#FFA500', rent: [16, 80, 220, 600, 800, 1000], buildingCost: 100 },
  
  // Top row (left to right)
  20: { x: 0, y: 0, type: 'corner', name: 'Free Parking' },
  21: { x: 1, y: 0, type: 'property', name: 'Kentucky Ave', price: 220, color: '#FF0000', rent: [18, 90, 250, 700, 875, 1050], buildingCost: 150 },
  22: { x: 2, y: 0, type: 'special', name: 'Chance' },
  23: { x: 3, y: 0, type: 'property', name: 'Indiana Ave', price: 220, color: '#FF0000', rent: [18, 90, 250, 700, 875, 1050], buildingCost: 150 },
  24: { x: 4, y: 0, type: 'property', name: 'Illinois Ave', price: 240, color: '#FF0000', rent: [20, 100, 300, 750, 925, 1100], buildingCost: 150 },
  25: { x: 5, y: 0, type: 'railroad', name: 'B&O Railroad', price: 200 },
  26: { x: 6, y: 0, type: 'property', name: 'Atlantic Ave', price: 260, color: '#FFFF00', rent: [22, 110, 330, 800, 975, 1150], buildingCost: 150 },
  27: { x: 7, y: 0, type: 'property', name: 'Ventnor Ave', price: 260, color: '#FFFF00', rent: [22, 110, 330, 800, 975, 1150], buildingCost: 150 },
  28: { x: 8, y: 0, type: 'utility', name: 'Water Works', price: 150 },
  29: { x: 9, y: 0, type: 'property', name: 'Marvin Gardens', price: 280, color: '#FFFF00', rent: [24, 120, 360, 850, 1025, 1200], buildingCost: 150 },
  
  // Right side (top to bottom)
  30: { x: 10, y: 0, type: 'corner', name: 'Go To Jail' },
  31: { x: 10, y: 1, type: 'property', name: 'Pacific Ave', price: 300, color: '#00FF00', rent: [26, 130, 390, 900, 1100, 1275], buildingCost: 200 },
  32: { x: 10, y: 2, type: 'property', name: 'North Carolina Ave', price: 300, color: '#00FF00', rent: [26, 130, 390, 900, 1100, 1275], buildingCost: 200 },
  33: { x: 10, y: 3, type: 'special', name: 'Community Chest' },
  34: { x: 10, y: 4, type: 'property', name: 'Pennsylvania Ave', price: 320, color: '#00FF00', rent: [28, 150, 450, 1000, 1200, 1400], buildingCost: 200 },
  35: { x: 10, y: 5, type: 'railroad', name: 'Short Line', price: 200 },
  36: { x: 10, y: 6, type: 'special', name: 'Chance' },
  37: { x: 10, y: 7, type: 'property', name: 'Park Place', price: 350, color: '#0000FF', rent: [35, 175, 500, 1100, 1300, 1500], buildingCost: 200 },
  38: { x: 10, y: 8, type: 'tax', name: 'Luxury Tax', amount: 100 },
  39: { x: 10, y: 9, type: 'property', name: 'Boardwalk', price: 400, color: '#0000FF', rent: [50, 200, 600, 1400, 1700, 2000], buildingCost: 200 }
};

export const PROPERTY_GROUPS = {
  '#8B4513': [1, 3], // Brown
  '#87CEEB': [6, 8, 9], // Light Blue
  '#FF69B4': [11, 13, 14], // Pink
  '#FFA500': [16, 18, 19], // Orange
  '#FF0000': [21, 23, 24], // Red
  '#FFFF00': [26, 27, 29], // Yellow
  '#00FF00': [31, 32, 34], // Green
  '#0000FF': [37, 39] // Dark Blue
};

export const CHANCE_CARDS = [
  { type: 'move', text: 'Advance to GO', action: 'moveToPosition', position: 0 },
  { type: 'move', text: 'Advance to Illinois Ave', action: 'moveToPosition', position: 24 },
  { type: 'move', text: 'Advance to St. Charles Place', action: 'moveToPosition', position: 11 },
  { type: 'move', text: 'Advance to nearest Railroad', action: 'moveToNearestRailroad' },
  { type: 'move', text: 'Advance to nearest Utility', action: 'moveToNearestUtility' },
  { type: 'money', text: 'Bank pays you dividend of $50', amount: 50 },
  { type: 'money', text: 'Go Back 3 Spaces', action: 'moveBack', spaces: 3 },
  { type: 'move', text: 'Go to Jail', action: 'goToJail' },
  { type: 'money', text: 'Pay poor tax of $15', amount: -15 },
  { type: 'money', text: 'Take a ride on the Reading Railroad', action: 'moveToPosition', position: 5 },
  { type: 'money', text: 'Take a walk on the Boardwalk', action: 'moveToPosition', position: 39 },
  { type: 'money', text: 'You have been elected Chairman of the Board', amount: 50 },
  { type: 'money', text: 'Your building loan matures', amount: 150 },
  { type: 'money', text: 'You have won a crossword competition', amount: 100 }
];

export const COMMUNITY_CHEST_CARDS = [
  { type: 'money', text: 'Advance to GO', action: 'moveToPosition', position: 0 },
  { type: 'money', text: 'Bank error in your favor', amount: 200 },
  { type: 'money', text: 'Doctor\'s fees', amount: -50 },
  { type: 'money', text: 'From sale of stock you get $50', amount: 50 },
  { type: 'move', text: 'Go to Jail', action: 'goToJail' },
  { type: 'money', text: 'Grand Opera Night', amount: 50 },
  { type: 'money', text: 'Holiday Fund matures', amount: 100 },
  { type: 'money', text: 'Income tax refund', amount: 20 },
  { type: 'money', text: 'Life insurance matures', amount: 100 },
  { type: 'money', text: 'Pay hospital fees', amount: -100 },
  { type: 'money', text: 'Pay school fees', amount: -150 },
  { type: 'money', text: 'Receive $25 consultancy fee', amount: 25 },
  { type: 'money', text: 'You inherit $100', amount: 100 },
  { type: 'money', text: 'You have won second prize in a beauty contest', amount: 10 }
];

export const INITIAL_GAME_STATE = {
  players: [],
  currentPlayerIndex: 0,
  gamePhase: 'setup', // setup, playing, ended
  dice: [1, 1],
  lastRoll: 0,
  properties: {},
  turn: 1
};

export const PLAYER_COLORS = ['#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];

export const GAME_CONSTANTS = {
  STARTING_MONEY: 1500,
  GO_MONEY: 200,
  JAIL_POSITION: 10,
  GO_TO_JAIL_POSITION: 30,
  MAX_PLAYERS: 4,
  HOUSE_COST: 50,
  HOTEL_COST: 50
}; 