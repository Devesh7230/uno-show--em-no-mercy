import { useState } from "react";
import { X, LogIn } from "lucide-react";
import { login } from "../../firebase/auth";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginDialog({ open, onClose }: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;
  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      await login(email, password);

      onClose();
    } catch (err: any) {
      switch (err.code) {
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;

        case "auth/user-not-found":
          setError("User not found.");
          break;

        case "auth/wrong-password":
          setError("Wrong password.");
          break;

        case "auth/invalid-email":
          setError("Invalid email.");
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
              <LogIn className="text-[#D4AF37]" />

              <h2 className="text-xl font-serif text-[#F3E5AB]">Royal Login</h2>
            </div>

            <button onClick={onClose}>
              <X className="text-[#D4AF37]" />
            </button>
          </div>

          {/* Body */}

          <div className="p-5 space-y-4">
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
              {error && (
                <div className="mt-2 rounded border border-red-500/40 bg-red-900/20 p-2 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-lg bg-[#D4AF37] py-3 font-semibold text-black hover:brightness-110 transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <button className="w-full text-sm text-[#D4AF37]">
              Create Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
