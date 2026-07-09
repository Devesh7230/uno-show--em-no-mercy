export interface Player {
  username: string;
  email: string;

  coins: number;

  equippedTitle: string;
  ownedTitles: string[];

  equippedTheme: string;
  ownedThemes: string[];

  equippedEmojis: string[];
  emojisUnlocked: string[];

  wins: number;
  losses: number;
  totalMatches: number;
}
