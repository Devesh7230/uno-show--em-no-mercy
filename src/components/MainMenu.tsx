import { useState } from "react";
import Header from "./lobby/Header";
import MenuActions from "./lobby/MenuActions";
import Sidebar from "./lobby/Sidebar";
import type { FeltColor } from "../types/theme";
import GuestMenu from "./lobby/GuestMenu";
import AuthDialog from "./lobby/AuthDialog";
import { useAuth } from "../contexts/AuthContext";
import ProfileDialog from "./lobby/ProfileDialog";
import ThemeDialog from "./lobby/ThemeDialog";
import TitleDialog from "./lobby/TitleDialog";
import EmojiDialog from "./lobby/EmojiDialog";
interface MainMenuProps {
  feltColor: FeltColor;
  onHostRoom: (name: string) => void;
  onJoinRoom: (name: string, code: string) => void;
  onStartOffline: (name: string) => void;
  onStartPassPlay: (name: string) => void;
}

export default function MainMenu({
  feltColor,
  onHostRoom,
  onJoinRoom,
  onStartOffline,
  onStartPassPlay,
}: MainMenuProps) {
  const [roomCode, setRoomCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const { player } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [titleOpen, setTitleOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const handleAction = (action: "host" | "join" | "offline" | "passplay") => {
    const trimmedName = player?.username ?? "Guest Noble";
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
        isGuest={!player}
        feltColor={feltColor}
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
        onProfile={() => setProfileOpen(true)}
        onTitles={() => setTitleOpen(true)}
        onThemes={() => setThemeOpen(true)}
        onEmojis={() => setEmojiOpen(true)}
        feltColor={feltColor}
      />
      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
        feltColor={feltColor}
      />
      <TitleDialog
        open={titleOpen}
        onClose={() => setTitleOpen(false)}
        feltColor={feltColor}
      />
      <ThemeDialog
        open={themeOpen}
        onClose={() => setThemeOpen(false)}
        feltColor={feltColor}
      />
      <ProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        feltColor={feltColor}
      />
      <EmojiDialog
        open={emojiOpen}
        onClose={() => setEmojiOpen(false)}
        feltColor={feltColor}
      />
      <div className="w-full max-w-4xl pb-8">
        {/* Left Column: Player Config & Actions */}
        <div className="flex flex-col gap-4 border border-[#D4AF37]/30 bg-black/45 p-4 md:p-6 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <MenuActions
            roomCode={roomCode}
            setRoomCode={setRoomCode}
            showJoinInput={showJoinInput}
            setShowJoinInput={setShowJoinInput}
            errorMsg={errorMsg}
            setErrorMsg={setErrorMsg}
            handleAction={handleAction}
          />
        </div>
      </div>
    </div>
  );
}
