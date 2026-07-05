import { Card, CardColor, CardType } from '../types';

// Helper to generate a unique card ID
const genId = (prefix: string, index: number): string => `${prefix}_${index}_${Math.random().toString(36).substring(2, 6)}`;

/**
 * Generates the full 168-card deck of UNO Show 'Em No Mercy
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  const colors: Exclude<CardColor, 'wild'>[] = ['red', 'blue', 'green', 'yellow'];

  colors.forEach((color) => {
    // 1. Number cards
    // 0: 1 card per color (total 4)
    deck.push({
      id: genId(`${color}_num_0`, 0),
      color,
      type: 'number',
      value: 0,
      score: 0,
    });

    // 1 to 9: 2 cards of each number per color (total 72)
    for (let i = 1; i <= 9; i++) {
      deck.push({
        id: genId(`${color}_num_${i}`, 1),
        color,
        type: 'number',
        value: i,
        score: i,
      });
      deck.push({
        id: genId(`${color}_num_${i}`, 2),
        color,
        type: 'number',
        value: i,
        score: i,
      });
    }

    // 2. Action cards of Color (2 copies each per color, total 56)
    // Draw 2
    deck.push({ id: genId(`${color}_draw2`, 1), color, type: 'draw_2', score: 20 });
    deck.push({ id: genId(`${color}_draw2`, 2), color, type: 'draw_2', score: 20 });

    // Draw 4
    deck.push({ id: genId(`${color}_draw4`, 1), color, type: 'draw_4', score: 30 });
    deck.push({ id: genId(`${color}_draw4`, 2), color, type: 'draw_4', score: 30 });

    // Draw 6
    deck.push({ id: genId(`${color}_draw6`, 1), color, type: 'draw_6', score: 30 });
    deck.push({ id: genId(`${color}_draw6`, 2), color, type: 'draw_6', score: 30 });

    // Skip
    deck.push({ id: genId(`${color}_skip`, 1), color, type: 'skip', score: 20 });
    deck.push({ id: genId(`${color}_skip`, 2), color, type: 'skip', score: 20 });

    // Skip Everyone
    deck.push({ id: genId(`${color}_skipev`, 1), color, type: 'skip_everyone', score: 40 });
    deck.push({ id: genId(`${color}_skipev`, 2), color, type: 'skip_everyone', score: 40 });

    // Reverse
    deck.push({ id: genId(`${color}_reverse`, 1), color, type: 'reverse', score: 20 });
    deck.push({ id: genId(`${color}_reverse`, 2), color, type: 'reverse', score: 20 });

    // Discard All
    deck.push({ id: genId(`${color}_discardall`, 1), color, type: 'discard_all', score: 30 });
    deck.push({ id: genId(`${color}_discardall`, 2), color, type: 'discard_all', score: 30 });
  });

  // 3. Wild Cards (color = 'wild')
  // Wild Standard (8 copies)
  for (let i = 0; i < 8; i++) {
    deck.push({ id: genId('wild_standard', i), color: 'wild', type: 'wild_standard', score: 50 });
  }

  // Wild Draw 6 (4 copies)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: genId('wild_draw6', i), color: 'wild', type: 'wild_draw_6', score: 60 });
  }

  // Wild Draw 10 (8 copies - No Mercy style!)
  for (let i = 0; i < 8; i++) {
    deck.push({ id: genId('wild_draw10', i), color: 'wild', type: 'wild_draw_10', score: 80 });
  }

  // Wild Reverse Draw 4 (8 copies)
  for (let i = 0; i < 8; i++) {
    deck.push({ id: genId('wild_rev_draw4', i), color: 'wild', type: 'wild_reverse_draw_4', score: 60 });
  }

  // Wild Roulette (8 copies)
  for (let i = 0; i < 8; i++) {
    deck.push({ id: genId('wild_roulette', i), color: 'wild', type: 'wild_roulette', score: 80 });
  }

  return shuffle(deck);
}

/**
 * Fisher-Yates shuffle implementation
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Checks if a card is a draw-penalty card
 */
export function isDrawCard(card: Card): boolean {
  return [
    'draw_2',
    'draw_4',
    'draw_6',
    'draw_10',
    'wild_draw_6',
    'wild_draw_10',
    'wild_reverse_draw_4',
  ].includes(card.type);
}

/**
 * Gets the direct draw penalty value of a card
 */
export function getDrawCardValue(card: Card): number {
  switch (card.type) {
    case 'draw_2':
      return 2;
    case 'draw_4':
    case 'wild_reverse_draw_4':
      return 4;
    case 'draw_6':
    case 'wild_draw_6':
      return 6;
    case 'draw_10':
    case 'wild_draw_10':
      return 10;
    default:
      return 0;
  }
}

/**
 * Checks if a card can be legally played under current circumstances
 */
export function canPlayCard(
  card: Card,
  topCard: Card,
  activeColor: CardColor,
  stackCount: number
): boolean {
  // 1. If there's an active stacking penalty
  if (stackCount > 0) {
    // Only draw cards can be played, and they must have a value >= the last played draw card
    if (!isDrawCard(card)) {
      return false;
    }
    // Stacking rule: must be equal or greater value
    const incomingVal = getDrawCardValue(card);
    const topVal = getDrawCardValue(topCard);
    return incomingVal >= topVal;
  }

  // 2. Normal turn (no active stacking penalty)
  // Wild cards can ALWAYS be played
  if (card.color === 'wild') {
    return true;
  }

  // Match by color
  if (card.color === activeColor) {
    return true;
  }

  // Match by type (e.g. Skip matches Skip, Discard All matches Discard All)
  if (card.type === topCard.type) {
    // For number cards, value must also match if they are type 'number'
    if (card.type === 'number') {
      return card.value === topCard.value;
    }
    return true;
  }

  return false;
}

/**
 * Text description of what a card does
 */
export function getCardLabel(card: Card): string {
  const colorStr = card.color !== 'wild' ? card.color.toUpperCase() : 'WILD';
  switch (card.type) {
    case 'number':
      return `${colorStr} ${card.value}`;
    case 'draw_2':
      return `${colorStr} +2`;
    case 'draw_4':
      return `${colorStr} +4`;
    case 'draw_6':
      return `${colorStr} +6`;
    case 'draw_10':
      return `${colorStr} +10`;
    case 'skip':
      return `${colorStr} SKIP`;
    case 'skip_everyone':
      return `${colorStr} SKIP EVERYONE`;
    case 'reverse':
      return `${colorStr} REVERSE`;
    case 'discard_all':
      return `${colorStr} DISCARD ALL`;
    case 'wild_standard':
      return 'WILD';
    case 'wild_draw_6':
      return 'WILD +6';
    case 'wild_draw_10':
      return 'WILD +10';
    case 'wild_reverse_draw_4':
      return 'WILD REVERSE +4';
    case 'wild_roulette':
      return 'WILD COLOR ROULETTE';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Gets a beautiful text color class for each color
 */
export function getColorClass(color: CardColor): string {
  switch (color) {
    case 'red':
      return 'bg-gradient-to-br from-red-500 via-red-700 to-red-950 text-white border-[#F3E5AB]';
    case 'blue':
      return 'bg-gradient-to-br from-blue-500 via-blue-700 to-blue-950 text-white border-[#F3E5AB]';
    case 'green':
      return 'bg-gradient-to-br from-emerald-500 via-emerald-700 to-emerald-950 text-white border-[#F3E5AB]';
    case 'yellow':
      return 'bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-700 text-[#1A0E04] border-[#F3E5AB]';
    case 'wild':
      return 'bg-gradient-to-br from-slate-950 via-indigo-950 to-black text-[#F3E5AB] border-[#D4AF37]';
    default:
      return 'bg-gradient-to-br from-slate-700 to-slate-950 text-white border-[#F3E5AB]';
  }
}
