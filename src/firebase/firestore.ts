import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "./firebase";

export async function createUserProfile(
  uid: string,
  email: string,
  username: string,
) {
  await setDoc(doc(db, "users", uid), {
    username,
    email,

    createdAt: new Date(),

    stats: {
      matches: 0,
      wins: 0,
      losses: 0,
    },

    coins: 0,

    selectedTheme: "Royal Navy",

    ownedThemes: ["Royal Navy"],

    guest: false,
  });
}

export async function getUserProfile(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) return null;

  return snapshot.data();
}
