import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function buyTitle(uid: string, title: string, newCoins: number) {
  await updateDoc(doc(db, "users", uid), {
    ownedTitles: arrayUnion(title),
    coins: newCoins,
  });
}

export async function equipTitle(uid: string, title: string) {
  await updateDoc(doc(db, "users", uid), {
    equippedTitle: title,
  });
}
