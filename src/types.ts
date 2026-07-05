export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';

export type CardType =
  | 'number'
  | 'draw_2'
  | 'draw_4'
  | 'draw_6'
  | 'draw_10'
  | 'skip'
  | 'skip_everyone'
  | 'reverse'
  | 'discard_all'
  | 'wild_standard'
  | 'wild_draw_6'
  | 'wild_draw_10'
  | 'wild_reverse_draw_4'
  | 'wild_roulette';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number; // 0-9 for number cards
  score: number;
}

export interface Player {
  id: string; // Peer ID
  name: string;
  cards: Card[];
  isHost: boolean;
  isReady: boolean;
  isKnockedOut: boolean;
  hasYelledUno: boolean;
}

export interface GameState {
  players: Player[];
  drawPile: Card[];
  discardPile: Card[];
  activeColor: CardColor; // 'red' | 'blue' | 'green' | 'yellow'
  currentTurnIndex: number;
  turnDirection: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  stackCount: number; // accumulated draw count from stacking
  gameStarted: boolean;
  gameEnded: boolean;
  winnerId: string | null;
  rouletteTargetId: string | null; // who is targeted by roulette
  pendingSevenSwap: string | null; // player ID who played 7, waiting to choose target
  roomCode: string;
  log: string[];
}

export type NetworkMessageType =
  | 'LOBBY_UPDATE'     // Host broadcasts full lobby player list
  | 'GAME_START'       // Host sends initial GameState to start match
  | 'GAME_STATE_SYNC'  // Host broadcasts authoritative state on change
  | 'PLAYER_ACTION'    // Clients send intent to Host (play card, draw, ready, yell uno)
  | 'KICK_PLAYER';     // Host kicks a player

export interface NetworkMessage {
  type: NetworkMessageType;
  senderId: string;
  payload: any;
}
