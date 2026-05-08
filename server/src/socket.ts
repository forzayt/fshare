import { Server, Socket } from 'socket.io';
import { sessionManager } from './SessionManager';
import { FileMetadata } from './types';

export function setupSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // --- Host Events ---
    
    // Host starts a new server
    socket.on('host:start', (callback) => {
      const sessionId = sessionManager.createSession(socket.id);
      socket.join(`session_${sessionId}`); // Host joins its own session room
      console.log(`[Session] Host ${socket.id} created session ${sessionId}`);
      
      if (typeof callback === 'function') {
        callback({ success: true, sessionId });
      }
    });

    // Host updates metadata
    socket.on('host:update_metadata', (payload: { sessionId: string; metadata: FileMetadata[] }, callback) => {
      const { sessionId, metadata } = payload;
      const session = sessionManager.getSession(sessionId);
      
      if (!session || session.hostSocketId !== socket.id) {
        if (typeof callback === 'function') callback({ success: false, error: 'Unauthorized or session not found' });
        return;
      }

      sessionManager.updateMetadata(sessionId, metadata);
      
      // Notify all joiners about the metadata update
      socket.to(`session_${sessionId}`).emit('session:metadata_updated', sessionManager.getMetadata(sessionId));
      
      if (typeof callback === 'function') callback({ success: true });
    });

    // Host manual shutdown
    socket.on('host:shutdown', (payload: { sessionId: string }, callback) => {
      const { sessionId } = payload;
      const session = sessionManager.getSession(sessionId);
      
      if (session && session.hostSocketId === socket.id) {
        // Notify joiners
        socket.to(`session_${sessionId}`).emit('session:closed');
        sessionManager.removeSession(sessionId);
        if (typeof callback === 'function') callback({ success: true });
      } else {
        if (typeof callback === 'function') callback({ success: false, error: 'Unauthorized' });
      }
    });


    // --- Joiner Events ---

    // Joiner connects to a session
    socket.on('joiner:join', (payload: { sessionId: string }, callback) => {
      const { sessionId } = payload;
      const session = sessionManager.getSession(sessionId);

      if (!session) {
        if (typeof callback === 'function') callback({ success: false, error: 'Session not found or expired' });
        return;
      }

      // Join the session room
      socket.join(`session_${sessionId}`);
      sessionManager.joinSession(sessionId, socket.id);
      console.log(`[Session] Joiner ${socket.id} joined session ${sessionId}`);

      // Notify host that a new joiner arrived
      io.to(session.hostSocketId).emit('host:joiner_connected', { joinerId: socket.id });

      // Return current metadata to the joiner
      if (typeof callback === 'function') {
        callback({ 
          success: true, 
          metadata: sessionManager.getMetadata(sessionId) 
        });
      }
    });

    // --- WebRTC Signaling ---
    
    // Forwarding Offer
    socket.on('webrtc:offer', (payload: { targetId: string; offer: RTCSessionDescriptionInit; sessionId: string }) => {
      console.log(`[WebRTC] Offer from ${socket.id} to ${payload.targetId}`);
      io.to(payload.targetId).emit('webrtc:offer', {
        senderId: socket.id,
        offer: payload.offer,
      });
    });

    // Forwarding Answer
    socket.on('webrtc:answer', (payload: { targetId: string; answer: RTCSessionDescriptionInit; sessionId: string }) => {
      console.log(`[WebRTC] Answer from ${socket.id} to ${payload.targetId}`);
      io.to(payload.targetId).emit('webrtc:answer', {
        senderId: socket.id,
        answer: payload.answer,
      });
    });

    // Forwarding ICE Candidate
    socket.on('webrtc:ice_candidate', (payload: { targetId: string; candidate: RTCIceCandidateInit; sessionId: string }) => {
      io.to(payload.targetId).emit('webrtc:ice_candidate', {
        senderId: socket.id,
        candidate: payload.candidate,
      });
    });


    // --- File Request Events (For establishing specific transfers over WebRTC data channels) ---
    // Note: The actual transfer happens via WebRTC, but signaling the intent helps the UI.
    socket.on('joiner:request_file', (payload: { sessionId: string; fileId: string }, callback) => {
      const { sessionId, fileId } = payload;
      const session = sessionManager.getSession(sessionId);

      if (!session) {
        if (typeof callback === 'function') callback({ success: false, error: 'Session not found' });
        return;
      }

      // Forward request to host
      io.to(session.hostSocketId).emit('host:file_requested', {
        joinerId: socket.id,
        fileId
      });

      if (typeof callback === 'function') callback({ success: true });
    });


    // --- Disconnect ---
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
      
      // Check if it was a host
      const hostedSession = sessionManager.getSessionByHostSocketId(socket.id);
      if (hostedSession) {
        console.log(`[Session] Host disconnected. Closing session ${hostedSession.id}`);
        socket.to(`session_${hostedSession.id}`).emit('session:closed');
        sessionManager.removeSession(hostedSession.id);
        return;
      }

      // Check if it was a joiner — find their session and notify the host
      const joinerSession = sessionManager.getSessionByJoinerSocketId(socket.id);
      if (joinerSession) {
        console.log(`[Session] Joiner ${socket.id} disconnected from session ${joinerSession.id}`);
        sessionManager.leaveSession(joinerSession.id, socket.id);
        io.to(joinerSession.hostSocketId).emit('host:joiner_disconnected', { joinerId: socket.id });
      }
    });
  });
}
