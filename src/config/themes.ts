import type { FeltColor } from "../types/theme";

export interface ThemeItem {
  id: FeltColor;
  name: string;
  price: number;
}

export const THEMES: ThemeItem[] = [
  {
    id: "emerald",
    name: "Deep Emerald",
    price: 0,
  },
  {
    id: "burgundy",
    name: "Rich Burgundy",
    price: 100,
  },
  {
    id: "navy",
    name: "Royal Navy",
    price: 100,
  },
];
