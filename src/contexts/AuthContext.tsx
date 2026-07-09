import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { onAuthStateChanged, User } from "firebase/auth";

import { auth } from "../firebase/firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
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
