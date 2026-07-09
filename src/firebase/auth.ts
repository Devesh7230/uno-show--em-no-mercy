import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
  updateProfile,
} from "firebase/auth";

import { auth } from "./firebase";

/**
 * Login
 */
export async function login(
  email: string,
  password: string,
): Promise<UserCredential> {
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Signup
 */
export async function signup(
  username: string,
  email: string,
  password: string,
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  await updateProfile(credential.user, {
    displayName: username,
  });

  return credential;
}

/**
 * Logout
 */
export async function logout() {
  return await signOut(auth);
}
