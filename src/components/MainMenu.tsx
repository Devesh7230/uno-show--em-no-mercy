import { useState } from "react";
import Header from "./lobby/Header";
import MenuActions from "./lobby/MenuActions";
import ThemeSelector from "./lobby/ThemeSelector";
import RulesPanel from "./lobby/RulesPanel";
import Sidebar from "./lobby/Sidebar";
import type { FeltColor } from "../types/theme";
import GuestMenu from "./lobby/GuestMenu";
import AuthDialog from "./lobby/AuthDialog";
interface MainMenuProps {
  onHostRoom: (name: string) => void;
  onJoinRoom: (name: string, code: string) => void;
  onStartOffline: (name: string) => void;
  onStartPassPlay: (name: string) => void;
  feltColor: FeltColor;
  setFeltColor: React.Dispatch<React.SetStateAction<FeltColor>>;
}

export default function MainMenu({
  onHostRoom,
  onJoinRoom,
  onStartOffline,
  onStartPassPlay,
  feltColor,
  setFeltColor,
}: MainMenuProps) {
  const [name, setName] = useState(() => {
    return localStorage.getItem("uno_mercy_name") || "";
  });
  const [roomCode, setRoomCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const handleAction = (action: "host" | "join" | "offline" | "passplay") => {
    const trimmedName = name.trim() || "Noble Player";
    localStorage.setItem("uno_mercy_name", trimmedName);

    if (action === "host") {
      onHostRoom(trimmedName);
    } else if (action === "join") {
      if (!roomCode.trim() || roomCode.length < 4) {
        setErrorMsg("Please enter a valid 4-character room code.");
        return;
      }
      onJoinRoom(trimmedName, roomCode.trim().toUpperCase());
    } else if (action === "offline") {
      onStartOffline(trimmedName);
    } else if (action === "passplay") {
      onStartPassPlay(trimmedName);
    }
  };

  return (
    <div className="w-full h-screen overflow-y-auto flex flex-col justify-start items-center p-4 md:p-6 text-[#F4EBD0] relative select-none">
      <Header
        onFullscreen={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }}
        onMenu={() => setSidebarOpen(true)}
        onGuest={() => setGuestOpen(true)}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isGuest={true}
      />
      <GuestMenu
        open={guestOpen}
        onClose={() => setGuestOpen(false)}
        onLogin={() => {
          setAuthMode("login");
          setAuthOpen(true);
        }}
        onSignup={() => {
          setAuthMode("signup");
          setAuthOpen(true);
        }}
      />
      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
      />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pb-8">
        {/* Left Column: Player Config & Actions */}
        <div className="lg:col-span-7 flex flex-col gap-4 border border-[#D4AF37]/30 bg-black/45 p-4 md:p-6 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <MenuActions
            name={name}
            setName={setName}
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            showJoinInput={showJoinInput}
            setShowJoinInput={setShowJoinInput}
            errorMsg={errorMsg}
            setErrorMsg={setErrorMsg}
            handleAction={handleAction}
          />
          <ThemeSelector feltColor={feltColor} setFeltColor={setFeltColor} />
        </div>
        <RulesPanel />
      </div>
    </div>
  );
}
