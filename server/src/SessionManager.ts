import { Session, FileMetadata } from './types';
import { v4 as uuidv4 } from 'uuid';

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Periodically clean up expired sessions
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000); // Check every hour
  }

  public createSession(hostSocketId: string): string {
    // Generate a simple 6-digit numeric ID for easier typing, or fallback to UUID
    let sessionId = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Ensure uniqueness
    while (this.sessions.has(sessionId)) {
      sessionId = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const now = Date.now();
    this.sessions.set(sessionId, {
      id: sessionId,
      hostSocketId,
      createdAt: now,
      lastActive: now,
      metadata: {},
      joiners: new Set(),
    });

    return sessionId;
  }

  public getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = Date.now();
    }
    return session;
  }

  public getSessionByHostSocketId(socketId: string): Session | undefined {
    for (const session of this.sessions.values()) {
      if (session.hostSocketId === socketId) {
        return session;
      }
    }
    return undefined;
  }

  public removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  public joinSession(sessionId: string, joinerSocketId: string): boolean {
    const session = this.getSession(sessionId);
    if (session) {
      session.joiners.add(joinerSocketId);
      return true;
    }
    return false;
  }

  public leaveSession(sessionId: string, joinerSocketId: string): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.joiners.delete(joinerSocketId);
    }
  }

  public updateMetadata(sessionId: string, metadata: FileMetadata[]): boolean {
    const session = this.getSession(sessionId);
    if (session) {
      // Clear old metadata and set new
      session.metadata = {};
      metadata.forEach(file => {
        // use file id if provided, else generate one
        const id = file.id || uuidv4();
        session.metadata[id] = { ...file, id };
      });
      return true;
    }
    return false;
  }
  
  public getMetadata(sessionId: string): FileMetadata[] {
    const session = this.getSession(sessionId);
    if (session) {
      return Object.values(session.metadata);
    }
    return [];
  }

  public cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        console.log(`[SessionManager] Cleaned up expired session: ${sessionId}`);
      }
    }
  }
}

export const sessionManager = new SessionManager();
