import { doc, setDoc, serverTimestamp } from "firebase/firestore";
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
