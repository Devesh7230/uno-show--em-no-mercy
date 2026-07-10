import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function buyEmoji(uid: string, emoji: string, newCoins: number) {
  await updateDoc(doc(db, "users", uid), {
    emojisUnlocked: arrayUnion(emoji),
    coins: newCoins,
  });
}

export async function equipEmojis(uid: string, emojis: string[]) {
  await updateDoc(doc(db, "users", uid), {
    equippedEmojis: emojis,
  });
}
