import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
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
  email: string,
  password: string,
): Promise<UserCredential> {
  return await createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Logout
 */
export async function logout() {
  return await signOut(auth);
}
