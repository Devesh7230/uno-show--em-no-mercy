import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { Player } from "../types/player";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "../firebase/firebase";

type AuthContextType = {
  user: User | null;
  player: Player | null;
  loading: boolean;
  isGuest: boolean;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
  refreshPlayer: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const cachedPlayer = localStorage.getItem("player");

    if (cachedPlayer) {
      setPlayer(JSON.parse(cachedPlayer));
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setPlayer(null);
        setLoading(false);
        return;
      }

      const unsubscribePlayer = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as Player;

            setPlayer(data);

            localStorage.setItem("player", JSON.stringify(data));
          }

          setLoading(false);
        },
      );

      return unsubscribePlayer;
    });

    return unsubscribeAuth;
  }, []);
  async function refreshPlayer() {
    if (!user) return;

    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
      setPlayer(snap.data() as Player);
    }
  }
  function continueAsGuest() {
    setIsGuest(true);
  }

  function exitGuestMode() {
    setIsGuest(false);
  }

  async function logout() {
    await signOut(auth);
    setPlayer(null);
    localStorage.removeItem("player");
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        player,
        refreshPlayer,
        loading,
        isGuest,
        continueAsGuest,
        exitGuestMode,
        logout,
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
