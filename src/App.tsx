/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { GameState, Player, Card, CardColor, NetworkMessage } from "./types";
import SplashScreen from "./components/SplashScreen";
import type { FeltColor } from "./types/theme";
import {
  createDeck,
  canPlayCard,
  isDrawCard,
  getDrawCardValue,
  shuffle,
  getCardLabel,
} from "./utils/game";
import { PeerManager } from "./utils/network";
import MainMenu from "./components/MainMenu";
import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";
import LandscapeOverlay from "./components/LandscapeOverlay";
import {
  playSnap,
  playSwoosh,
  playChime,
  playGong,
  playFanfare,
} from "./utils/audio";
import { auth } from "./firebase/firebase";
import { applyMatchRewards } from "./firebase/firestore";
import { useAuth } from "./contexts/AuthContext";
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing O, 0, 1, I
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function cloneGameState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

export default function App() {
  const [screen, setScreen] = useState<"menu" | "lobby" | "game">("menu");
  const [playerName, setPlayerName] = useState("Noble Player");
  const [roomCode, setRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isPassPlay, setIsPassPlay] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [feltColor, setFeltColor] = useState<FeltColor>(() => {
    const cached = localStorage.getItem("player");
    if (cached) {
      const player = JSON.parse(cached);
      return player.equippedTheme;
    }
    return "emerald";
  });
  const sessionRewardsRef = useRef<
    Record<
      string,
      {
        coins: number;
        wins: number;
        losses: number;
        matches: number;
      }
    >
  >({});

  // Connection
  const peerManagerRef = useRef<PeerManager | null>(null);
  const isHostRef = useRef(false);
  const isMultiplayerRef = useRef(false);
  const lobbyPlayersRef = useRef<Player[]>([]);
  const myPeerIdRef = useRef("");
  const [myPeerId, setMyPeerId] = useState("");
  const [lobbyPlayers, setLobbyPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const { user, isGuest, loading, player } = useAuth();
  useEffect(() => {
    if (player) {
      setFeltColor(player.equippedTheme);
    }
  }, [player]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    isMultiplayerRef.current = isMultiplayer;
  }, [isMultiplayer]);

  useEffect(() => {
    lobbyPlayersRef.current = lobbyPlayers;
  }, [lobbyPlayers]);

  useEffect(() => {
    myPeerIdRef.current = myPeerId;
  }, [myPeerId]);

  // Sound triggering helper
  const triggerSound = (
    type: "snap" | "swoosh" | "chime" | "gong" | "fanfare",
  ) => {
    if (!isSoundOn) return;
    if (type === "snap") playSnap();
    else if (type === "swoosh") playSwoosh();
    else if (type === "chime") playChime();
    else if (type === "gong") playGong();
    else if (type === "fanfare") playFanfare();
  };

  // 1. PeerJS Lifecycle & Orchestration
  useEffect(() => {
    return () => {
      if (peerManagerRef.current) {
        peerManagerRef.current.destroy();
      }
    };
  }, []);

  const handleHostRoom = (name: string) => {
    sessionRewardsRef.current = {};
    setPlayerName(name);
    setIsHost(true);
    isHostRef.current = true;
    setIsMultiplayer(true);
    isMultiplayerRef.current = true;
    setIsPassPlay(false);

    const code = generateRoomCode();
    setRoomCode(code);

    const manager = new PeerManager();
    peerManagerRef.current = manager;

    // Set up callbacks
    manager.onOpen = (id) => {
      setMyPeerId(id);
      myPeerIdRef.current = id;
      // Create self as first player in lobby
      const hostPlayer: Player = {
        id,
        name,
        cards: [],
        isHost: true,
        isReady: true,
        isKnockedOut: false,
        hasYelledUno: false,
      };
      lobbyPlayersRef.current = [hostPlayer];
      setLobbyPlayers([hostPlayer]);
      setScreen("lobby");
      triggerSound("chime");
    };

    manager.onConnection = (conn) => {
      // Handled during handshakes
    };

    manager.onData = (msg) => {
      handleIncomingNetworkMessage(msg);
    };

    manager.onDisconnect = (peerId) => {
      // Remove player from lobby or active game
      setLobbyPlayers((prev) => {
        const updated = prev.filter((p) => p.id !== peerId);
        lobbyPlayersRef.current = updated;
        // Broadcast new list to all clients
        manager.broadcast({
          type: "LOBBY_UPDATE",
          senderId: manager.myPeerId,
          payload: updated,
        });
        return updated;
      });

      setGameState((prev) => {
        if (!prev) return null;
        const index = prev.players.findIndex((p) => p.id === peerId);
        if (index === -1) return prev;

        const updatedPlayers = prev.players.filter((p) => p.id !== peerId);
        let nextTurnIndex = prev.currentTurnIndex;
        if (nextTurnIndex >= updatedPlayers.length) {
          nextTurnIndex = 0;
        }

        const nextState: GameState = {
          ...prev,
          players: updatedPlayers,
          currentTurnIndex: nextTurnIndex,
          log: [
            ...prev.log,
            `Player ${peerId} connection lost. Removed from table.`,
          ],
        };

        // Broadcast updated state
        manager.broadcast({
          type: "GAME_STATE_SYNC",
          senderId: manager.myPeerId,
          payload: nextState,
        });

        return nextState;
      });
    };

    manager.onError = (err) => {
      alert(
        `P2P Connection Error: ${err.message || err}. Please try creating another room.`,
      );
      handleExitGame();
    };

    manager.createRoom(code);
  };

  const handleJoinRoom = (name: string, code: string) => {
    sessionRewardsRef.current = {};
    setPlayerName(name);
    setIsHost(false);
    isHostRef.current = false;
    setIsMultiplayer(true);
    isMultiplayerRef.current = true;
    setIsPassPlay(false);
    setRoomCode(code);

    const manager = new PeerManager();
    peerManagerRef.current = manager;

    manager.onOpen = (id) => {
      setMyPeerId(id);
      myPeerIdRef.current = id;
      setScreen("lobby");
      triggerSound("swoosh");
    };

    manager.onData = (msg) => {
      handleIncomingNetworkMessage(msg);
    };

    manager.onDisconnect = () => {
      alert("Disconnected from the host salon. Returning to main gates.");
      handleExitGame();
    };

    manager.onError = (err) => {
      alert(
        `Unable to join the room. Verify room code "${code}" or connection status.`,
      );
      handleExitGame();
    };

    manager.joinRoom(code, name);
  };

  const broadcastLobbyUpdate = (players: Player[]) => {
    peerManagerRef.current?.broadcast({
      type: "LOBBY_UPDATE",
      senderId: myPeerIdRef.current,
      payload: players,
    });
  };

  const handleLobbyPlayerAction = (senderId: string, actionPayload: any) => {
    if (!isHostRef.current) return false;

    if (actionPayload.actionType === "JOIN_GAME") {
      const currentLobby = lobbyPlayersRef.current;
      const playerExists = currentLobby.some((p) => p.id === senderId);
      if (playerExists) {
        broadcastLobbyUpdate(currentLobby);
        return true;
      }

      const newPlayer: Player = {
        id: senderId,
        name: actionPayload.name || "Royalty",
        cards: [],
        isHost: false,
        isReady: false,
        isKnockedOut: false,
        hasYelledUno: false,
      };

      const updatedLobby = [...currentLobby, newPlayer];
      lobbyPlayersRef.current = updatedLobby;
      setLobbyPlayers(updatedLobby);
      broadcastLobbyUpdate(updatedLobby);
      return true;
    }

    if (actionPayload.actionType === "TOGGLE_READY") {
      const updatedLobby = lobbyPlayersRef.current.map((p) => {
        if (p.id === senderId) {
          return { ...p, isReady: !p.isReady };
        }
        return p;
      });

      lobbyPlayersRef.current = updatedLobby;
      setLobbyPlayers(updatedLobby);
      broadcastLobbyUpdate(updatedLobby);
      return true;
    }

    return false;
  };

  // Handle network messages received via peerjs
  const handleIncomingNetworkMessage = (msg: NetworkMessage) => {
    console.log("[App] Received message:", msg.type, msg);

    switch (msg.type) {
      case "LOBBY_UPDATE":
        // Guests receive lobby list updates
        if (!isHostRef.current) {
          setLobbyPlayers(msg.payload);
        }
        break;

      case "GAME_START":
        // Guests receive initial state and switch screens
        setGameState(cloneGameState(msg.payload));
        setScreen("game");
        triggerSound("fanfare");
        break;

      case "GAME_STATE_SYNC":
        // Guests receive updated authoritative state
        setGameState(cloneGameState(msg.payload));
        break;

      case "PLAYER_ACTION":
        // Host receives client requests and processes state mutations
        if (isHostRef.current) {
          if (handleLobbyPlayerAction(msg.senderId, msg.payload)) {
            return;
          }
          processPlayerAction(msg.senderId, msg.payload);
        }
        break;

      case "KICK_PLAYER":
        if (msg.payload === myPeerIdRef.current) {
          alert("You have been dismissed from the host salon.");
          handleExitGame();
        }
        break;
    }
  };

  // 2. Solo / Offline vs Court Bots
  const handleStartOffline = (name: string) => {
    setPlayerName(name);
    setIsHost(true);
    isHostRef.current = true;
    setIsMultiplayer(false);
    isMultiplayerRef.current = false;
    setIsPassPlay(false);
    setRoomCode("");
    setMyPeerId("user-local");

    // Create self + 3 noble bots
    const bots: Player[] = [
      {
        id: "user-local",
        name,
        cards: [],
        isHost: true,
        isReady: true,
        isKnockedOut: false,
        hasYelledUno: false,
      },
      {
        id: "bot-charles",
        name: "Duke Charles 🤖",
        cards: [],
        isHost: false,
        isReady: true,
        isKnockedOut: false,
        hasYelledUno: false,
      },
      {
        id: "bot-isabella",
        name: "Lady Isabella 🤖",
        cards: [],
        isHost: false,
        isReady: true,
        isKnockedOut: false,
        hasYelledUno: false,
      },
      {
        id: "bot-sterling",
        name: "Baron Sterling 🤖",
        cards: [],
        isHost: false,
        isReady: true,
        isKnockedOut: false,
        hasYelledUno: false,
      },
    ];

    setLobbyPlayers(bots);
    startGameWithPlayers(bots);
  };

  // 3. Pass & Play Local Multiplayer
  const handleStartPassPlay = (name: string) => {
    setPlayerName(name);
    setIsHost(true);
    isHostRef.current = true;
    setIsMultiplayer(false);
    isMultiplayerRef.current = false;
    setIsPassPlay(true);
    setRoomCode("");
    setMyPeerId("passplay-p1");

    // Create 4 local players
    const passPlayers: Player[] = [
      {
        id: "passplay-p1",
        name: `${name} (P1)`,
        cards: [],
        isHost: true,
        isReady: true,
        isKnockedOut: false,
        hasYelledUno: false,
      },
      {
        id: "passplay-p2",
        name: "Courtier P2",
        cards: [],
        isHost: false,
        isReady: true,
        isKnockedOut: false,
        hasYelledUno: false,
      },
      {
        id: "passplay-p3",
        name: "Courtier P3",
        cards: [],
        isHost: false,
        isReady: true,
        isKnockedOut: false,
        hasYelledUno: false,
      },
      {
        id: "passplay-p4",
        name: "Courtier P4",
        cards: [],
        isHost: false,
        isReady: true,
        isKnockedOut: false,
        hasYelledUno: false,
      },
    ];

    setLobbyPlayers(passPlayers);
    startGameWithPlayers(passPlayers);
  };

  // Start match helper
  const startGameWithPlayers = (playersList: Player[]) => {
    const deck = createDeck();

    // Deal 7 cards to each player
    const dealtPlayers = playersList.map((p) => {
      const cards: Card[] = [];
      for (let i = 0; i < 7; i++) {
        const card = deck.pop();
        if (card) cards.push(card);
      }
      return {
        ...p,
        cards,
        isKnockedOut: false,
        hasYelledUno: false,
      };
    });

    // Flip top card from deck to discard. Ensure it's not a wild card to prevent issues on start
    let topCard = deck.pop();
    while (topCard && topCard.color === "wild") {
      deck.unshift(topCard); // recycle wild back to deck
      topCard = deck.pop();
    }

    if (!topCard) {
      topCard = {
        id: "fallback-card",
        color: "red",
        type: "number",
        value: 5,
        score: 5,
      };
    }
    const randomFirstPlayer = Math.floor(Math.random() * dealtPlayers.length);
    const initialGameState: GameState = {
      players: dealtPlayers,
      drawPile: deck,
      discardPile: [topCard],
      activeColor: topCard.color,
      currentTurnIndex: randomFirstPlayer,
      turnDirection: 1,
      stackCount: 0,
      gameStarted: true,
      gameEnded: false,
      winnerId: null,
      rouletteTargetId: null,
      pendingSevenSwap: null,
      roomCode: roomCode,
      log: ["Match deals started! 7 cards distributed to all nobles."],
    };

    setGameState(initialGameState);
    setScreen("game");
    triggerSound("fanfare");

    // Broadcast if host
    if (isMultiplayerRef.current && peerManagerRef.current) {
      peerManagerRef.current.broadcast({
        type: "GAME_START",
        senderId: peerManagerRef.current.myPeerId,
        payload: cloneGameState(initialGameState),
      });
    }
  };

  const handleStartMultiplayerMatch = () => {
    if (!isHostRef.current) return;
    startGameWithPlayers(lobbyPlayers);
  };

  const handleToggleReady = () => {
    if (isHost || !isMultiplayer || !peerManagerRef.current) return;

    peerManagerRef.current.sendToHost({
      type: "PLAYER_ACTION",
      senderId: myPeerId,
      payload: { actionType: "TOGGLE_READY" },
    });
  };

  const handleKickPlayer = (targetId: string) => {
    if (!isHost || !isMultiplayer || !peerManagerRef.current) return;

    // Send kick notification
    peerManagerRef.current.broadcast({
      type: "KICK_PLAYER",
      senderId: myPeerId,
      payload: targetId,
    });

    // Update lobby
    setLobbyPlayers((prev) => {
      const updated = prev.filter((p) => p.id !== targetId);
      lobbyPlayersRef.current = updated;
      broadcastLobbyUpdate(updated);
      return updated;
    });
  };

  // Exit game and clean up references
  const handleExitGame = async () => {
    if (isMultiplayerRef.current) {
      await saveCurrentPlayerRewards();
    }
    if (peerManagerRef.current) {
      peerManagerRef.current.destroy();
      peerManagerRef.current = null;
    }
    setScreen("menu");
    setGameState(null);
    setLobbyPlayers([]);
    lobbyPlayersRef.current = [];
    setIsHost(false);
    isHostRef.current = false;
    setIsMultiplayer(false);
    isMultiplayerRef.current = false;
    setIsPassPlay(false);
    setRoomCode("");
    setMyPeerId("");
    myPeerIdRef.current = "";
  };

  // 4. Authoritative State Mutation Engine (Host Only)
  const processPlayerAction = (senderId: string, actionPayload: any) => {
    if (!isHostRef.current) return;

    setGameState((prev) => {
      if (!prev) return null;

      // --- Active Game Transitions ---
      const activePlayer = prev.players[prev.currentTurnIndex];
      if (activePlayer.id !== senderId) {
        console.warn(
          `[Engine] Out of turn action rejected. Expected: ${activePlayer.name}, Got: ${senderId}`,
        );
        return prev;
      }

      let state = cloneGameState(prev);
      const logEntries: string[] = [];

      switch (actionPayload.actionType) {
        case "PLAY_CARD": {
          const { cardId, chosenColor } = actionPayload;
          const playerIdx = state.currentTurnIndex;
          const player = state.players[playerIdx];

          const cardIdx = player.cards.findIndex((c) => c.id === cardId);
          if (cardIdx === -1) return prev;

          const card = player.cards[cardIdx];

          // Verify eligibility
          const topDiscard = state.discardPile[state.discardPile.length - 1];
          if (
            !canPlayCard(card, topDiscard, state.activeColor, state.stackCount)
          ) {
            console.warn(
              `[Engine] Illegal card play of ${card.type} rejected.`,
            );
            return prev;
          }

          // Move card
          const updatedHand = [...player.cards];
          updatedHand.splice(cardIdx, 1);
          player.cards = updatedHand;

          // Clear UNO shout flag if they have cards remaining (will be re-evaluated down to 1)
          player.hasYelledUno = false;

          state.discardPile.push(card);
          state.activeColor = card.color === "wild" ? chosenColor : card.color;

          logEntries.push(`${player.name} played ${getCardLabel(card)}.`);
          if (card.color === "wild") {
            logEntries.push(
              `Active color proclaimed: ${chosenColor.toUpperCase()}.`,
            );
          }

          triggerSound("snap");

          // Process Card Effects
          let skipCount = 1; // Default is advance 1 slot

          if (card.type === "skip") {
            skipCount = 2; // Advance twice
            const skippedPlayer =
              state.players[
                (playerIdx + state.turnDirection + state.players.length) %
                  state.players.length
              ];
            logEntries.push(`${skippedPlayer.name} is SKIPPED.`);
          } else if (card.type === "skip_everyone") {
            skipCount = 0; // Current player gets another turn
            logEntries.push(
              `${player.name} rules SKIP EVERYONE! Plays another card immediately.`,
            );
          } else if (card.type === "reverse") {
            if (state.players.length === 2) {
              skipCount = 2; // Acts like skip in 2-player
              const skipped = state.players[(playerIdx + 1) % 2];
              logEntries.push(
                `Turn direction reversed! ${skipped.name} is SKIPPED.`,
              );
            } else {
              state.turnDirection = state.turnDirection === 1 ? -1 : 1;
              logEntries.push(
                `Turn order reversed! Direction is now ${state.turnDirection === 1 ? "CLOCKWISE" : "COUNTER-CLOCKWISE"}.`,
              );
            }
          } else if (isDrawCard(card)) {
            const val = getDrawCardValue(card);
            state.stackCount += val;
            logEntries.push(
              `Stack penalty accumulated! Penalty is now +${state.stackCount}.`,
            );
            triggerSound("gong");

            if (card.type === "wild_reverse_draw_4") {
              if (state.players.length === 2) {
                skipCount = 2;
                const skipped =
                  state.players[
                    (playerIdx + state.turnDirection + state.players.length) %
                      state.players.length
                  ];
                logEntries.push(
                  `Wild Reverse +4 skips ${skipped.name}. ${player.name} plays again.`,
                );
              } else {
                state.turnDirection = state.turnDirection === 1 ? -1 : 1;
                logEntries.push(`Turn order reversed!`);
              }
            }
          } else if (card.type === "discard_all") {
            // Automatically find all cards matching this color in hand and discard them
            const cardsToDiscard = player.cards.filter(
              (c) => c.color === card.color,
            );
            if (cardsToDiscard.length > 0) {
              player.cards = player.cards.filter((c) => c.color !== card.color);
              state.discardPile.push(...cardsToDiscard);
              logEntries.push(
                `${player.name} discarded all ${card.color.toUpperCase()} cards (${cardsToDiscard.length} cards dumped!).`,
              );
            }
          } else if (card.type === "wild_roulette") {
            state.rouletteTargetId = player.id;
            logEntries.push(
              `${player.name} unleashed COLOR ROULETTE! Awaiting target and color choice...`,
            );
            state.log.push(...logEntries);
            broadcastState(state);
            return state;
          }

          // Check if played 7 (Hand Swap Selector)
          if (card.type === "number" && card.value === 7) {
            state.pendingSevenSwap = player.id;
            logEntries.push(
              `${player.name} played a 7! Awaiting choice of opponent to swap fortunes...`,
            );
            // We do NOT advance the turn index yet. We wait for target choice.
            state.log.push(...logEntries);
            broadcastState(state);
            return state;
          }

          // Check if played 0 (Hand Shift)
          if (card.type === "number" && card.value === 0) {
            logEntries.push(
              `✦ HAND SHIFT 0 ACTIVATED! All fortunes revolve in turn direction.`,
            );
            // Shift hands
            const numPlayers = state.players.length;
            const tempHands = state.players.map((p) => [...p.cards]);

            for (let i = 0; i < numPlayers; i++) {
              const fromIndex = i;
              // Target index in turn direction
              const toIndex =
                (fromIndex + state.turnDirection + numPlayers) % numPlayers;
              state.players[toIndex].cards = tempHands[fromIndex];
            }
          }

          // Post-Play Evaluations
          evaluateGameStateAndProgress(state, logEntries, skipCount);
          break;
        }

        case "CHOOSE_SWAP_TARGET": {
          const { targetPlayerId } = actionPayload;
          const playerIdx = state.currentTurnIndex;
          const player = state.players[playerIdx];
          const targetPlayer = state.players.find(
            (p) => p.id === targetPlayerId,
          );

          if (
            !targetPlayer ||
            targetPlayer.isKnockedOut ||
            player.id === targetPlayerId
          )
            return prev;

          // Swap hands
          const tempCards = [...player.cards];
          player.cards = [...targetPlayer.cards];
          targetPlayer.cards = tempCards;

          logEntries.push(
            `${player.name} swaps cards with ${targetPlayer.name}! Fortunes exchanged.`,
          );
          state.pendingSevenSwap = null;
          triggerSound("swoosh");

          // Check mercy limits for both players after swap
          checkMercyRule(state, logEntries);

          // Advance turn now
          evaluateGameStateAndProgress(state, logEntries, 1);
          break;
        }

        case "CHOOSE_ROULETTE_PARAMS": {
          const { targetPlayerId, chosenColor } = actionPayload;
          const playerIdx = state.currentTurnIndex;
          const player = state.players[playerIdx];
          const targetPlayer = state.players.find(
            (p) => p.id === targetPlayerId,
          );

          if (
            !targetPlayer ||
            targetPlayer.isKnockedOut ||
            player.id === targetPlayerId
          )
            return prev;
          if (state.rouletteTargetId !== player.id) return prev;

          logEntries.push(
            `${player.name} targets ${targetPlayer.name} with COLOR ROULETTE on ${chosenColor.toUpperCase()}!`,
          );

          // Draw cards for target publicly until they pull chosen color
          let drawnCount = 0;
          let colorFound = false;
          const targetCards = [...targetPlayer.cards];

          while (!colorFound && state.drawPile.length > 0) {
            // Recycle discard if draw pile empty
            if (state.drawPile.length === 0) {
              recycleDiscardPile(state);
            }

            const card = state.drawPile.pop();
            if (!card) break;

            targetCards.push(card);
            drawnCount++;

            if (
              card.color === chosenColor ||
              (card.color === "wild" && chosenColor === "red")
            ) {
              // Simplification: wild acts as trigger
              colorFound = true;
              logEntries.push(
                `${targetPlayer.name} drew ${getCardLabel(card)} after drawing ${drawnCount} cards.`,
              );
            }
          }

          targetPlayer.cards = targetCards;
          state.rouletteTargetId = null;
          logEntries.push(
            `${targetPlayer.name} was forced to draw ${drawnCount} cards! Turn ends.`,
          );
          triggerSound("gong");

          // Check mercy rules
          checkMercyRule(state, logEntries);

          // Advance turn
          evaluateGameStateAndProgress(state, logEntries, 1);
          break;
        }

        case "DRAW_CARD": {
          const playerIdx = state.currentTurnIndex;
          const player = state.players[playerIdx];

          if (state.drawPile.length === 0) {
            recycleDiscardPile(state);
          }

          const card = state.drawPile.pop();
          if (!card) {
            logEntries.push(
              `${player.name} tried to draw, but the draw pile is empty.`,
            );
            evaluateGameStateAndProgress(state, logEntries, 1);
            break;
          }

          player.cards.push(card);
          logEntries.push(`${player.name} draws 1 card and passes the turn.`);
          triggerSound("swoosh");

          // Reset UNO shouts
          player.hasYelledUno = false;

          // Check mercy threshold
          checkMercyRule(state, logEntries);

          // Drawing from the deck is limited to 1 card per turn and then the turn passes.
          evaluateGameStateAndProgress(state, logEntries, 1);
          break;
        }

        case "ACCEPT_PENALTY": {
          const playerIdx = state.currentTurnIndex;
          const player = state.players[playerIdx];

          // Draw stackCount cards
          const cardsDrawn: Card[] = [];
          for (let i = 0; i < state.stackCount; i++) {
            if (state.drawPile.length === 0) {
              recycleDiscardPile(state);
            }
            const card = state.drawPile.pop();
            if (card) cardsDrawn.push(card);
          }

          player.cards.push(...cardsDrawn);
          logEntries.push(
            `${player.name} accepts the hazard! Draws +${state.stackCount} cards.`,
          );
          state.stackCount = 0; // reset
          triggerSound("swoosh");

          // Reset UNO shouts
          player.hasYelledUno = false;

          // Check mercy
          checkMercyRule(state, logEntries);

          // After accepting penalty, turn is passed
          evaluateGameStateAndProgress(state, logEntries, 1);
          break;
        }

        case "YELL_UNO": {
          const playerIdx = state.players.findIndex((p) => p.id === senderId);
          if (playerIdx === -1) return prev;

          const player = state.players[playerIdx];
          player.hasYelledUno = true;
          logEntries.push(`${player.name} shouts: "UNO! NO MERCY!"`);
          triggerSound("chime");

          state.log.push(...logEntries);
          broadcastState(state);
          return state;
        }

        case "CHALLENGE_UNO": {
          const { targetPlayerId } = actionPayload;
          const targetPlayer = state.players.find(
            (p) => p.id === targetPlayerId,
          );

          if (
            !targetPlayer ||
            targetPlayer.isKnockedOut ||
            targetPlayer.cards.length !== 1 ||
            targetPlayer.hasYelledUno
          ) {
            return prev;
          }

          // Target failed to yell UNO down to 1 card. Penalty in No Mercy: draw 2 cards!
          const penaltyCards: Card[] = [];
          for (let i = 0; i < 2; i++) {
            if (state.drawPile.length === 0) {
              recycleDiscardPile(state);
            }
            const card = state.drawPile.pop();
            if (card) penaltyCards.push(card);
          }

          targetPlayer.cards.push(...penaltyCards);
          logEntries.push(
            `⚡ CHALLENGE! ${targetPlayer.name} was caught with 1 card without yelling UNO! Penalized with +2 cards.`,
          );
          triggerSound("gong");

          checkMercyRule(state, logEntries);

          state.log.push(...logEntries);
          broadcastState(state);
          return state;
        }
      }

      return state;
    });
  };

  // Helper: Shuffle discarded cards back to draw pile except top
  const recycleDiscardPile = (state: GameState) => {
    if (state.discardPile.length <= 1) return;
    const topCard = state.discardPile.pop()!;
    const shuffledDeck = shuffle(state.discardPile);
    state.drawPile = shuffledDeck;
    state.discardPile = [topCard];
    state.log.push("✦ Draw Pile replenished from recycled discard pile.");
  };

  // Helper: check mercy rule for all players
  const checkMercyRule = (state: GameState, logEntries: string[]) => {
    state.players.forEach((p) => {
      if (!p.isKnockedOut && p.cards.length >= 25) {
        p.isKnockedOut = true;
        p.cards = []; // Discard hand
        logEntries.push(
          `💀 MERCY RULE! ${p.name} swelled to over 25 cards and is KNOCKED OUT!`,
        );
      }
    });
  };

  // Helper: complete turn validation, winner declarations, and advance turn indices
  const evaluateGameStateAndProgress = (
    state: GameState,
    logEntries: string[],
    skipCount: number,
  ) => {
    // 1. Check for card hand empty (Win)
    const winner = state.players.find(
      (p) => !p.isKnockedOut && p.cards.length === 0,
    );

    if (winner) {
      addMatchRewards(winner.id, state.players);

      state.gameEnded = true;
      state.winnerId = winner.id;

      logEntries.push(
        `👑 VICTORY! ${winner.name} has exhausted all cards in hand! Crowned champion of No Mercy.`,
      );

      triggerSound("fanfare");

      state.log.push(...logEntries);

      broadcastState(state);
      return;
    }

    // 2. Check for only 1 player remaining active (Mercy-ruled winner)
    const activePlayers = state.players.filter((p) => !p.isKnockedOut);
    if (activePlayers.length === 1) {
      addMatchRewards(activePlayers[0].id, state.players);

      state.gameEnded = true;
      state.winnerId = activePlayers[0].id;

      logEntries.push(
        `👑 VICTORY BY DEFAULT! All other nobles are knocked out. ${activePlayers[0].name} holds the throne.`,
      );

      triggerSound("fanfare");

      state.log.push(...logEntries);

      broadcastState(state);

      return;
    }

    if (activePlayers.length === 0) {
      addMatchRewards(state.players[0].id, state.players);

      state.gameEnded = true;
      state.winnerId = state.players[0].id;

      logEntries.push(
        "Match ended in total bankruptcy! All nobles eliminated.",
      );

      state.log.push(...logEntries);

      broadcastState(state);

      return;
    }

    // 3. Advance turn index bypassing knocked out players
    if (skipCount > 0) {
      let nextIdx = state.currentTurnIndex;
      for (let s = 0; s < skipCount; s++) {
        do {
          nextIdx =
            (nextIdx + state.turnDirection + state.players.length) %
            state.players.length;
        } while (state.players[nextIdx].isKnockedOut);
      }
      state.currentTurnIndex = nextIdx;
    }

    state.log.push(...logEntries);
    broadcastState(state);
  };

  // Helper: broadcast state of host
  const broadcastState = (state: GameState) => {
    if (isMultiplayerRef.current && peerManagerRef.current) {
      peerManagerRef.current.broadcast({
        type: "GAME_STATE_SYNC",
        senderId: peerManagerRef.current.myPeerId,
        payload: cloneGameState(state),
      });
    }
  };
  const addMatchRewards = (winnerId: string, players: Player[]) => {
    if (!isMultiplayerRef.current) return;

    players.forEach((player) => {
      if (!sessionRewardsRef.current[player.id]) {
        sessionRewardsRef.current[player.id] = {
          coins: 0,
          wins: 0,
          losses: 0,
          matches: 0,
        };
      }

      const reward = sessionRewardsRef.current[player.id];

      reward.matches += 1;

      if (player.id === winnerId) {
        reward.coins += 50;
        reward.wins += 1;
      } else {
        reward.losses += 1;
      }
    });

    console.log("[Session Rewards]", sessionRewardsRef.current);
  };
  const saveCurrentPlayerRewards = async () => {
    if (!user) return;

    const rewards = sessionRewardsRef.current[myPeerIdRef.current];

    if (!rewards) return;

    // Nothing earned, nothing to save.
    if (
      rewards.coins === 0 &&
      rewards.wins === 0 &&
      rewards.losses === 0 &&
      rewards.matches === 0
    ) {
      return;
    }

    try {
      await applyMatchRewards(user.uid, rewards);

      console.log("[Rewards Saved]", rewards);

      delete sessionRewardsRef.current[myPeerIdRef.current];
    } catch (error) {
      console.error("Failed to save rewards:", error);
    }
  };
  // 5. Automated AI Court Bots Logic
  useEffect(() => {
    if (!isHost || !gameState || gameState.gameEnded) return;

    const activePlayer = gameState.players[gameState.currentTurnIndex];
    if (
      !activePlayer ||
      !activePlayer.id.startsWith("bot-") ||
      activePlayer.isKnockedOut
    )
      return;

    console.log(`[Bot Engine] Active turn: ${activePlayer.name}`);

    // Wait 1.6 seconds to simulate thinking
    const timer = setTimeout(() => {
      const topDiscard =
        gameState.discardPile[gameState.discardPile.length - 1];
      const botHand = activePlayer.cards;

      // Find playable cards
      const playableCards = botHand.filter((c) =>
        canPlayCard(c, topDiscard, gameState.activeColor, gameState.stackCount),
      );

      // If there's an active stack but bot has no draw card, they must accept penalty
      if (gameState.stackCount > 0 && playableCards.length === 0) {
        processPlayerAction(activePlayer.id, { actionType: "ACCEPT_PENALTY" });
        return;
      }

      if (playableCards.length === 0) {
        // No playable cards: Draw until playable is found
        processPlayerAction(activePlayer.id, { actionType: "DRAW_CARD" });
        return;
      }

      // Play a card. Let's make bot choose the "best" card:
      // Priority: 1. Draw cards to stack/attack, 2. Action cards, 3. Highest numbers
      let chosenCard = playableCards[0];

      const drawCards = playableCards.filter(isDrawCard);
      const actionCards = playableCards.filter(
        (c) => c.type !== "number" && !isDrawCard(c),
      );
      const numberCards = playableCards.filter((c) => c.type === "number");

      if (drawCards.length > 0) {
        // Play highest value draw card to pass penalty or maximize attack
        chosenCard = drawCards.reduce((prev, current) =>
          getDrawCardValue(current) > getDrawCardValue(prev) ? current : prev,
        );
      } else if (actionCards.length > 0) {
        chosenCard = actionCards[0];
      } else if (numberCards.length > 0) {
        // Play highest number
        chosenCard = numberCards.reduce((prev, current) =>
          (current.value || 0) > (prev.value || 0) ? current : prev,
        );
      }

      // If chosen card is wild: pick color bot has the most of
      let chosenColor: CardColor = "red";
      if (chosenCard.color === "wild") {
        const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
        botHand.forEach((c) => {
          if (c.color !== "wild") {
            colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
          }
        });
        const colorsSorted = Object.entries(colorCounts).sort(
          (a, b) => b[1] - a[1],
        );
        chosenColor = colorsSorted[0][0] as CardColor;
      }

      // If card is 7 (Hand Swap): swap with active player with the least cards
      if (chosenCard.type === "number" && chosenCard.value === 7) {
        // Find opponent with least cards
        const opponents = gameState.players.filter(
          (p) => p.id !== activePlayer.id && !p.isKnockedOut,
        );
        const leastCardsOpponent = opponents.reduce((prev, current) =>
          current.cards.length < prev.cards.length ? current : prev,
        );

        // Play card first, then immediately submit swap target choice
        processPlayerAction(activePlayer.id, {
          cardId: chosenCard.id,
          chosenColor: chosenCard.color,
          actionType: "PLAY_CARD",
        });
        setTimeout(() => {
          processPlayerAction(activePlayer.id, {
            targetPlayerId: leastCardsOpponent.id,
            actionType: "CHOOSE_SWAP_TARGET",
          });
        }, 800);
        return;
      }

      // If card is Roulette: target opponent with least cards, and bot choose random color or color bot has least of
      if (chosenCard.type === "wild_roulette") {
        const opponents = gameState.players.filter(
          (p) => p.id !== activePlayer.id && !p.isKnockedOut,
        );
        const leastCardsOpponent = opponents.reduce((prev, current) =>
          current.cards.length < prev.cards.length ? current : prev,
        );
        const colors: CardColor[] = ["red", "blue", "green", "yellow"];
        const chosenRouletteColor =
          colors[Math.floor(Math.random() * colors.length)];

        processPlayerAction(activePlayer.id, {
          cardId: chosenCard.id,
          chosenColor,
          actionType: "PLAY_CARD",
        });
        setTimeout(() => {
          processPlayerAction(activePlayer.id, {
            targetPlayerId: leastCardsOpponent.id,
            chosenColor: chosenRouletteColor,
            actionType: "CHOOSE_ROULETTE_PARAMS",
          });
        }, 800);
        return;
      }

      // Play normal card
      processPlayerAction(activePlayer.id, {
        cardId: chosenCard.id,
        chosenColor,
        actionType: "PLAY_CARD",
      });

      // If down to 1 card, bot yells UNO with 95% probability!
      if (botHand.length === 2) {
        // will be 1 after play
        if (Math.random() < 0.95) {
          setTimeout(() => {
            processPlayerAction(activePlayer.id, { actionType: "YELL_UNO" });
          }, 400);
        }
      }
    }, 1600);

    return () => clearTimeout(timer);
  }, [gameState, isHost]);

  // Pass-and-play manual control index synchronization
  const handlePassPlayAction = (actionType: string, payload: any) => {
    if (!isPassPlay || !gameState) return;
    const activePlayer = gameState.players[gameState.currentTurnIndex];
    processPlayerAction(activePlayer.id, { actionType, ...payload });
  };

  // Switch to correct theme color class
  const getFeltClass = () => {
    switch (feltColor) {
      case "emerald":
        return "bg-felt-emerald";
      case "burgundy":
        return "bg-felt-burgundy";
      case "navy":
        return "bg-felt-navy";
    }
  };
  if (loading && !player) {
    return <SplashScreen />;
  }
  return (
    <div
      className={`w-full min-h-screen ${getFeltClass()} transition-colors duration-500 overflow-hidden relative`}
    >
      {/* Strict Landscape Lock Screen Overlay */}
      <LandscapeOverlay />

      {/* Main App Navigation Router */}
      {screen === "menu" && (
        <MainMenu
          feltColor={feltColor}
          onHostRoom={handleHostRoom}
          onJoinRoom={handleJoinRoom}
          onStartOffline={handleStartOffline}
          onStartPassPlay={handleStartPassPlay}
        />
      )}

      {screen === "lobby" && (
        <Lobby
          roomCode={roomCode}
          players={lobbyPlayers}
          myPeerId={myPeerId}
          isHost={isHost}
          onStartGame={handleStartMultiplayerMatch}
          onToggleReady={handleToggleReady}
          onLeaveLobby={handleExitGame}
          onKickPlayer={handleKickPlayer}
        />
      )}

      {screen === "game" && gameState && (
        <GameBoard
          gameState={gameState}
          myPeerId={myPeerId}
          isHost={isHost}
          onPlayCard={(cardId, chosenColor) => {
            if (isPassPlay) {
              handlePassPlayAction("PLAY_CARD", { cardId, chosenColor });
            } else if (isHost) {
              processPlayerAction(myPeerId, {
                actionType: "PLAY_CARD",
                cardId,
                chosenColor,
              });
            } else {
              peerManagerRef.current?.sendToHost({
                type: "PLAYER_ACTION",
                senderId: myPeerId,
                payload: { actionType: "PLAY_CARD", cardId, chosenColor },
              });
            }
          }}
          onDrawCard={() => {
            if (isPassPlay) {
              handlePassPlayAction("DRAW_CARD", {});
            } else if (isHost) {
              processPlayerAction(myPeerId, { actionType: "DRAW_CARD" });
            } else {
              peerManagerRef.current?.sendToHost({
                type: "PLAYER_ACTION",
                senderId: myPeerId,
                payload: { actionType: "DRAW_CARD" },
              });
            }
          }}
          onAcceptPenalty={() => {
            if (isPassPlay) {
              handlePassPlayAction("ACCEPT_PENALTY", {});
            } else if (isHost) {
              processPlayerAction(myPeerId, { actionType: "ACCEPT_PENALTY" });
            } else {
              peerManagerRef.current?.sendToHost({
                type: "PLAYER_ACTION",
                senderId: myPeerId,
                payload: { actionType: "ACCEPT_PENALTY" },
              });
            }
          }}
          onYellUno={() => {
            if (isPassPlay) {
              handlePassPlayAction("YELL_UNO", {});
            } else if (isHost) {
              processPlayerAction(myPeerId, { actionType: "YELL_UNO" });
            } else {
              peerManagerRef.current?.sendToHost({
                type: "PLAYER_ACTION",
                senderId: myPeerId,
                payload: { actionType: "YELL_UNO" },
              });
            }
          }}
          onChallengeUno={(targetPlayerId) => {
            if (isPassPlay) {
              handlePassPlayAction("CHALLENGE_UNO", { targetPlayerId });
            } else if (isHost) {
              processPlayerAction(myPeerId, {
                actionType: "CHALLENGE_UNO",
                targetPlayerId,
              });
            } else {
              peerManagerRef.current?.sendToHost({
                type: "PLAYER_ACTION",
                senderId: myPeerId,
                payload: { actionType: "CHALLENGE_UNO", targetPlayerId },
              });
            }
          }}
          onSelectSwapTarget={(targetPlayerId) => {
            if (isPassPlay) {
              handlePassPlayAction("CHOOSE_SWAP_TARGET", { targetPlayerId });
            } else if (isHost) {
              processPlayerAction(myPeerId, {
                actionType: "CHOOSE_SWAP_TARGET",
                targetPlayerId,
              });
            } else {
              peerManagerRef.current?.sendToHost({
                type: "PLAYER_ACTION",
                senderId: myPeerId,
                payload: { actionType: "CHOOSE_SWAP_TARGET", targetPlayerId },
              });
            }
          }}
          onSelectRouletteParams={(targetPlayerId, chosenColor) => {
            if (isPassPlay) {
              handlePassPlayAction("CHOOSE_ROULETTE_PARAMS", {
                targetPlayerId,
                chosenColor,
              });
            } else if (isHost) {
              processPlayerAction(myPeerId, {
                actionType: "CHOOSE_ROULETTE_PARAMS",
                targetPlayerId,
                chosenColor,
              });
            } else {
              peerManagerRef.current?.sendToHost({
                type: "PLAYER_ACTION",
                senderId: myPeerId,
                payload: {
                  actionType: "CHOOSE_ROULETTE_PARAMS",
                  targetPlayerId,
                  chosenColor,
                },
              });
            }
          }}
          onExitGame={handleExitGame}
          isSoundOn={isSoundOn}
          setIsSoundOn={setIsSoundOn}
        />
      )}
    </div>
  );
}
