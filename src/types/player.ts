import type { FeltColor } from "./theme";
export interface Player {
  username: string;
  email: string;

  coins: number;

  equippedTitle: string;
  ownedTitles: string[];

  equippedTheme: FeltColor;
  ownedThemes: FeltColor[];

  equippedEmojis: string[];
  emojisUnlocked: string[];

  wins: number;
  losses: number;
  totalMatches: number;
}
