import { useEffect, useState } from "react";
import { X, LogIn, UserPlus } from "lucide-react";
import { login, signup } from "../../firebase/auth";
import { createUserProfile } from "../../firebase/firestore";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  defaultMode: "login" | "signup";
}

export default function AuthDialog({
  open,
  onClose,
  defaultMode,
}: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignup, setIsSignup] = useState(defaultMode === "signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setIsSignup(defaultMode === "signup");
      setError("");
    }
  }, [open, defaultMode]);

  if (!open) return null;
  const handleAuth = async () => {
    setLoading(true);
    setError("");
    if (isSignup) {
      if (!username.trim()) {
        setError("Username is required.");
        setLoading(false);
        return;
      }

      if (!email.trim()) {
        setError("Email is required.");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
    }
    try {
      if (isSignup) {
        const credential = await signup(
          username.trim(),
          email.trim(),
          password,
        );

        await createUserProfile(
          credential.user.uid,
          username.trim(),
          email.trim(),
        );
      } else {
        await login(email.trim(), password);
      }

      onClose();
    } catch (err: any) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Email already registered.");
          break;

        case "auth/weak-password":
          setError("Password is too weak.");
          break;

        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;

        default:
          setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-black/60 z-[60]" />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-[61] p-4">
        <div className="w-full max-w-md rounded-xl border border-[#D4AF37]/30 bg-[#082012] shadow-2xl">
          {/* Header */}

          <div className="flex items-center justify-between border-b border-[#D4AF37]/20 p-5">
            <div className="flex items-center gap-3">
              {isSignup ? (
                <UserPlus className="text-[#D4AF37]" />
              ) : (
                <LogIn className="text-[#D4AF37]" />
              )}

              <h2 className="text-xl font-serif text-[#F3E5AB]">
                {isSignup ? "Royal Registration" : "Royal Login"}
              </h2>
            </div>

            <button onClick={onClose}>
              <X className="text-[#D4AF37]" />
            </button>
          </div>

          {/* Body */}

          <div className="p-5 space-y-4">
            {isSignup && (
              <div>
                <label className="text-sm text-stone-300">Username</label>

                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full rounded border border-[#D4AF37]/30 bg-black/30 px-3 py-2 outline-none"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-stone-300">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-1 w-full rounded border border-[#D4AF37]/30 bg-black/30 px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-stone-300">Password</label>

              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="mt-1 w-full rounded border border-[#D4AF37]/30 bg-black/30 px-3 py-2 outline-none"
              />
            </div>
            {isSignup && (
              <div>
                <label className="text-sm text-stone-300">
                  Confirm Password
                </label>

                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  className="mt-1 w-full rounded border border-[#D4AF37]/30 bg-black/30 px-3 py-2 outline-none"
                />
              </div>
            )}
            {error && (
              <div className="mt-2 rounded border border-red-500/40 bg-red-900/20 p-2 text-sm text-red-300">
                {error}
              </div>
            )}
            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full rounded-lg bg-[#D4AF37] py-3 font-semibold text-black hover:brightness-110 transition"
            >
              {loading
                ? isSignup
                  ? "Creating Account..."
                  : "Logging in..."
                : isSignup
                  ? "Create Account"
                  : "Login"}
            </button>

            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
              className="w-full text-sm text-[#D4AF37]"
            >
              {isSignup ? "Already have an account? Login" : "Create Account"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
