import {
  UserCircle,
  LogIn,
  UserPlus,
  Cloud,
  Trophy,
  Palette,
  Mic,
} from "lucide-react";

interface GuestMenuProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup: () => void;
}
export default function GuestMenu({
  open,
  onClose,
  onLogin,
  onSignup,
}: GuestMenuProps) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} className="fixed inset-0 z-40" />

      {/* Dropdown */}
      <div
        className="
          absolute
          top-20
          right-4
          w-80
          max-w-[90vw]
          bg-[#082012]
          border
          border-[#D4AF37]/30
          rounded-xl
          shadow-2xl
          z-50
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="p-5 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-3">
            <UserCircle className="text-[#D4AF37]" size={42} />

            <div>
              <div className="text-[#F3E5AB] font-semibold">Guest Noble</div>

              <div className="text-xs text-stone-400">Continue as Guest</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              onClose();
              onLogin();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#D4AF37]/10 transition"
          >
            <LogIn size={20} className="text-[#D4AF37]" />
            Login
          </button>

          <button
            onClick={() => {
              onClose();
              onSignup();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#D4AF37]/10 transition"
          >
            <UserPlus size={20} className="text-[#D4AF37]" />
            Create Account
          </button>
        </div>

        <div className="border-t border-[#D4AF37]/20" />

        <div className="p-4">
          <div className="text-xs uppercase tracking-widest text-stone-400 mb-3">
            Available after Login
          </div>

          <div className="space-y-2">
            <Feature icon={<Cloud size={18} />} text="Cloud Save" />

            <Feature icon={<Trophy size={18} />} text="Statistics" />

            <Feature icon={<Palette size={18} />} text="Themes" />

            <Feature icon={<Mic size={18} />} text="Voice Chat" />
          </div>
        </div>
      </div>
    </>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-stone-500">
      <span className="text-[#D4AF37]">{icon}</span>

      {text}
    </div>
  );
}
