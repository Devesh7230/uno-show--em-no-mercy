import { arrayUnion, doc, updateDoc } from "firebase/firestore";

import { db } from "./firebase";
import type { FeltColor } from "../types/theme";

export async function buyTheme(
  uid: string,
  theme: FeltColor,
  newCoins: number,
) {
  await updateDoc(doc(db, "users", uid), {
    ownedThemes: arrayUnion(theme),
    coins: newCoins,
  });
}

export async function equipTheme(uid: string, theme: FeltColor) {
  await updateDoc(doc(db, "users", uid), {
    equippedTheme: theme,
  });
}
