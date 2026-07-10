import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export async function createUserProfile(
  uid: string,
  username: string,
  email: string,
) {
  await setDoc(doc(db, "users", uid), {
    username,

    email,

    // ===== PLAYER =====
    equippedTitle: "Baron",
    ownedTitles: ["Baron"],

    coins: 100,

    // ===== STATS =====
    wins: 0,
    losses: 0,
    totalMatches: 0,

    // ===== THEMES =====
    equippedTheme: "emerald",
    ownedThemes: ["emerald"],

    // ===== EMOJIS =====
    equippedEmojis: ["😀", "🔥", "❤️"],
    emojisUnlocked: ["😀", "🔥", "❤️"],

    // ===== CREATED =====
    createdAt: serverTimestamp(),
  });
}

import type { Player } from "../types/player";

export async function getUserProfile(uid: string): Promise<Player | null> {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as Player;
}
export async function applyMatchRewards(
  uid: string,
  rewards: {
    coins: number;
    wins: number;
    losses: number;
    matches: number;
  },
) {
  await updateDoc(doc(db, "users", uid), {
    coins: increment(rewards.coins),

    wins: increment(rewards.wins),

    losses: increment(rewards.losses),

    totalMatches: increment(rewards.matches),
  });
}
