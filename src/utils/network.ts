import { Peer, DataConnection } from 'peerjs';
import { NetworkMessage, Player } from '../types';

export class PeerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  
  public myPeerId: string = '';
  public roomCode: string = '';
  public isHost: boolean = false;

  // Callbacks
  public onOpen: (peerId: string) => void = () => {};
  public onConnection: (conn: DataConnection) => void = () => {};
  public onData: (data: NetworkMessage) => void = () => {};
  public onError: (err: any) => void = () => {};
  public onDisconnect: (peerId: string) => void = () => {};

  constructor() {}

  /**
   * Initialize Peer as Host
   */
  public createRoom(roomCode: string) {
    this.isHost = true;
    this.roomCode = roomCode.toUpperCase();
    const peerId = `unomercy-${this.roomCode}`;

    console.log(`[Network] Initializing host with Peer ID: ${peerId}`);
    
    // Create Peer with public PeerJS cloud server
    this.peer = new Peer(peerId, {
      debug: 1, // log errors and warnings
    });

    this.setupPeerEvents();
  }

  /**
   * Initialize Peer as Guest and connect to Host
   */
  public joinRoom(roomCode: string, name: string) {
    this.isHost = false;
    this.roomCode = roomCode.toUpperCase();
    
    console.log(`[Network] Initializing guest...`);
    
    // Create Peer with auto-assigned ID
    this.peer = new Peer({
      debug: 1,
    });

    this.peer.on('open', (id) => {
      this.myPeerId = id;
      this.onOpen(id);
      
      console.log(`[Network] Guest peer open. ID: ${id}. Connecting to room ${this.roomCode}...`);
      this.connectToHost(name);
    });

    this.peer.on('error', (err) => {
      console.error('[Network] Guest Peer error:', err);
      this.onError(err);
    });
  }

  /**
   * Establish connection to Host
   */
  private connectToHost(playerName: string) {
    const hostPeerId = `unomercy-${this.roomCode}`;
    if (!this.peer) return;

    const conn = this.peer.connect(hostPeerId, {
      metadata: { name: playerName },
      serialization: 'json',
    });

    this.setupConnectionEvents(conn);
  }

  /**
   * Set up main Peer lifecycle listeners
   */
  private setupPeerEvents() {
    if (!this.peer) return;

    this.peer.on('open', (id) => {
      this.myPeerId = id;
      this.onOpen(id);
      console.log(`[Network] Host peer open. Room code: ${this.roomCode} (ID: ${id})`);
    });

    // Only host receives incoming connections
    this.peer.on('connection', (conn) => {
      console.log(`[Network] Incoming connection from: ${conn.peer} with name: ${conn.metadata?.name}`);
      this.connections.set(conn.peer, conn);
      this.setupConnectionEvents(conn);
      this.onConnection(conn);
    });

    this.peer.on('error', (err) => {
      console.error('[Network] Peer error:', err);
      this.onError(err);
    });

    this.peer.on('disconnected', () => {
      console.warn('[Network] Peer disconnected from signaling server. Reconnecting...');
      this.peer?.reconnect();
    });
  }

  /**
   * Set up listeners for individual connection channels
   */
  private setupConnectionEvents(conn: DataConnection) {
    if (this.isHost) {
      // Host registers client connection
      conn.on('open', () => {
        console.log(`[Network] Channel open with client: ${conn.peer}`);
      });

      conn.on('data', (data: any) => {
        try {
          const msg = data as NetworkMessage;
          this.onData(msg);
        } catch (e) {
          console.error('[Network] Error parsing message from client:', e);
        }
      });

      conn.on('close', () => {
        console.log(`[Network] Connection closed with client: ${conn.peer}`);
        this.connections.delete(conn.peer);
        this.onDisconnect(conn.peer);
      });

      conn.on('error', (err) => {
        console.error(`[Network] Connection error with client ${conn.peer}:`, err);
        this.connections.delete(conn.peer);
        this.onDisconnect(conn.peer);
      });
    } else {
      // Guest registers host connection
      this.hostConnection = conn;

      conn.on('open', () => {
        console.log(`[Network] Channel open with Host: ${conn.peer}`);
        // Send handshake join action
        this.sendToHost({
          type: 'PLAYER_ACTION',
          senderId: this.myPeerId,
          payload: {
            actionType: 'JOIN_GAME',
            name: conn.metadata?.name || 'Royalty',
          }
        });
      });

      conn.on('data', (data: any) => {
        try {
          const msg = data as NetworkMessage;
          this.onData(msg);
        } catch (e) {
          console.error('[Network] Error parsing message from host:', e);
        }
      });

      conn.on('close', () => {
        console.warn('[Network] Disconnected from Host!');
        this.onDisconnect(this.roomCode);
      });

      conn.on('error', (err) => {
        console.error('[Network] Connection error with Host:', err);
        this.onDisconnect(this.roomCode);
      });
    }
  }

  /**
   * Broadcast message to all connected clients (Host only)
   */
  public broadcast(msg: NetworkMessage) {
    if (!this.isHost) {
      console.warn('[Network] Only host can broadcast!');
      return;
    }
    
    // Also include self action if necessary, but caller handles host's state.
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  /**
   * Send message to Host (Client only)
   */
  public sendToHost(msg: NetworkMessage) {
    if (this.isHost || !this.hostConnection) {
      console.warn('[Network] No host connection or you are host!');
      return;
    }

    if (this.hostConnection.open) {
      this.hostConnection.send(msg);
    } else {
      console.warn('[Network] Host connection is not open!');
    }
  }

  /**
   * Close all connections and destroy peer instance
   */
  public destroy() {
    console.log('[Network] Cleaning up all peer and connections...');
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}
