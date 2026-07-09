import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { Player } from "../types/player";
import { getUserProfile } from "../firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

import { auth } from "../firebase/firebase";

type AuthContextType = {
  user: User | null;
  player: Player | null;
  loading: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);

        setPlayer(profile);
      } else {
        setPlayer(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  function continueAsGuest() {
    setIsGuest(true);
  }

  function exitGuestMode() {
    setIsGuest(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        player,
        loading,
        isGuest,
        continueAsGuest,
        exitGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
