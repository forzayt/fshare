import { Socket } from "socket.io-client";

export class WebRTCJoiner {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private socket: Socket;
  private sessionId: string;
  private onProgress: (fileId: string, receivedBytes: number, totalBytes: number) => void;
  private onComplete: (fileId: string, blob: Blob, meta: any) => void;

  private incomingFiles: Map<string, { buffer: ArrayBuffer[], received: number, meta: any }> = new Map();

  constructor(
    socket: Socket, 
    sessionId: string,
    onProgress: (fileId: string, receivedBytes: number, totalBytes: number) => void,
    onComplete: (fileId: string, blob: Blob, meta: any) => void
  ) {
    this.socket = socket;
    this.sessionId = sessionId;
    this.onProgress = onProgress;
    this.onComplete = onComplete;

    this.socket.on("webrtc:offer", this.handleOffer);
    this.socket.on("webrtc:ice_candidate", this.handleIceCandidate);
  }

  public destroy() {
    this.socket.off("webrtc:offer", this.handleOffer);
    this.socket.off("webrtc:ice_candidate", this.handleIceCandidate);
    this.peers.forEach(peer => peer.close());
    this.peers.clear();
  }

  private handleOffer = async (payload: { senderId: string; offer: RTCSessionDescriptionInit; fileId?: string }) => {
    // Generate a unique peer ID based on sender and fileId
    const peerId = `${payload.senderId}-${payload.fileId}`;
    
    // Close existing peer connection for this file if it exists
    if (this.peers.has(peerId)) {
      this.peers.get(peerId)?.close();
      this.peers.delete(peerId);
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    this.peers.set(peerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("webrtc:ice_candidate", {
          targetId: payload.senderId,
          sessionId: this.sessionId,
          candidate: event.candidate,
          fileId: payload.fileId
        });
      }
    };

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      dc.binaryType = "arraybuffer";
      
      let currentFileId: string | null = null;

      dc.onmessage = async (e) => {
        if (typeof e.data === 'string') {
          const msg = JSON.parse(e.data);
          if (msg.type === 'header') {
            currentFileId = msg.fileId as string;
            this.incomingFiles.set(currentFileId, { buffer: [], received: 0, meta: msg });
          } else if (msg.type === 'eof' && currentFileId) {
            const fileData = this.incomingFiles.get(currentFileId);
            if (fileData) {
              const blob = new Blob(fileData.buffer, { type: fileData.meta.fileType });
              this.onComplete(currentFileId, blob, fileData.meta);
              this.incomingFiles.delete(currentFileId);
            }
          }
        } else if (e.data instanceof ArrayBuffer && currentFileId) {
          const fileData = this.incomingFiles.get(currentFileId);
          if (fileData) {
            fileData.buffer.push(e.data);
            fileData.received += e.data.byteLength;
            this.onProgress(currentFileId, fileData.received, fileData.meta.size);
          }
        }
      };
    };

    await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.socket.emit("webrtc:answer", {
      targetId: payload.senderId,
      sessionId: this.sessionId,
      answer,
      fileId: payload.fileId
    });
  };

  private handleIceCandidate = async (payload: { senderId: string; candidate: RTCIceCandidateInit; fileId?: string }) => {
    const peerId = `${payload.senderId}-${payload.fileId}`;
    const pc = this.peers.get(peerId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  };

  public requestFile(fileId: string) {
    this.socket.emit("joiner:request_file", { sessionId: this.sessionId, fileId }, (res: any) => {
      if (res && !res.success) {
        console.error("Failed to request file:", res.error);
      }
    });
  }
}
