import { Session, FileMetadata } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Periodically clean up expired sessions
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000); // Check every hour
  }

  private generateSecureId(): string {
    // Generate a secure 12-character alphanumeric string (excluding confusing characters like O/0, I/1)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randomBytes = crypto.randomBytes(12);
    let id = '';
    for (let i = 0; i < 12; i++) {
      id += chars[randomBytes[i] % chars.length];
    }
    // Format as XXXX-XXXX-XXXX
    return `${id.slice(0, 4)}-${id.slice(4, 8)}-${id.slice(8, 12)}`;
  }

  public createSession(hostSocketId: string): string {
    let sessionId = this.generateSecureId();
    
    // Ensure uniqueness
    while (this.sessions.has(sessionId)) {
      sessionId = this.generateSecureId();
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

  public getSessionByJoinerSocketId(socketId: string): Session | undefined {
    for (const session of this.sessions.values()) {
      if (session.joiners.has(socketId)) {
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
