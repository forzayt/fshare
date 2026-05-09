import { Socket } from "socket.io-client";
import { db } from "./db";

const CHUNK_SIZE = 64 * 1024; // 64 KB

export class WebRTCHost {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private socket: Socket;
  private sessionId: string;
  private onProgress: (fileId: string, joinerId: string, sentBytes: number, totalBytes: number) => void;

  constructor(
    socket: Socket, 
    sessionId: string,
    onProgress: (fileId: string, joinerId: string, sentBytes: number, totalBytes: number) => void
  ) {
    this.socket = socket;
    this.sessionId = sessionId;
    this.onProgress = onProgress;

    this.socket.on("webrtc:answer", this.handleAnswer);
    this.socket.on("webrtc:ice_candidate", this.handleIceCandidate);
  }

  public destroy() {
    this.socket.off("webrtc:answer", this.handleAnswer);
    this.socket.off("webrtc:ice_candidate", this.handleIceCandidate);
    this.peers.forEach(peer => peer.close());
    this.peers.clear();
    this.dataChannels.clear();
  }

  public async sendFile(joinerId: string, fileId: string, fileObj?: File) {
    const peerId = `${joinerId}-${fileId}`;
    
    if (!this.peers.has(peerId)) {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit("webrtc:ice_candidate", {
            targetId: joinerId,
            sessionId: this.sessionId,
            candidate: event.candidate,
            fileId: fileId // Include fileId
          });
        }
      };

      const dc = pc.createDataChannel(`file-${fileId}`);
      dc.binaryType = "arraybuffer";
      
      dc.onopen = async () => {
        console.log(`Data channel open for ${fileId} to ${joinerId}`);
        if (fileObj) {
          this.sendFileChunks(dc, fileId, joinerId, fileObj);
        } else {
          await this.sendFileFromDB(dc, fileId, joinerId);
        }
      };

      this.peers.set(peerId, pc);
      this.dataChannels.set(peerId, dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.socket.emit("webrtc:offer", {
        targetId: joinerId,
        sessionId: this.sessionId,
        offer,
        fileId: fileId // Include fileId
      });
    }
  }

  private async sendFileFromDB(dc: RTCDataChannel, fileId: string, joinerId: string) {
    const files = await db.getFilesByRole('host');
    const fileMeta = files.find(f => f.id === fileId);
    if (!fileMeta) {
      console.error('File not found in DB:', fileId);
      return;
    }

    const chunks = await db.getChunks(fileId);
    
    // We send metadata first
    dc.send(JSON.stringify({ type: 'header', fileId, name: fileMeta.name, size: fileMeta.size, fileType: fileMeta.type }));

    let offset = 0;
    for (const chunk of chunks) {
      // Check buffered amount
      if (dc.bufferedAmount > CHUNK_SIZE * 8) {
        await new Promise<void>(resolve => {
          dc.onbufferedamountlow = () => {
            dc.onbufferedamountlow = null;
            resolve();
          };
        });
      }
      
      dc.send(chunk);
      offset += chunk.byteLength;
      this.onProgress(fileId, joinerId, offset, fileMeta.size);
    }

    dc.send(JSON.stringify({ type: 'eof', fileId }));
  }

  private sendFileChunks(dc: RTCDataChannel, fileId: string, joinerId: string, fileObj: File) {
    let offset = 0;
    const fileReader = new FileReader();
    
    // We send metadata first
    dc.send(JSON.stringify({ type: 'header', fileId, name: fileObj.name, size: fileObj.size, fileType: fileObj.type }));

    fileReader.onerror = error => console.error('Error reading file:', error);
    fileReader.onabort = () => console.log('File reading aborted');

    const readSlice = (o: number) => {
      const slice = fileObj.slice(offset, o + CHUNK_SIZE);
      fileReader.readAsArrayBuffer(slice);
    };

    fileReader.onload = e => {
      if (!e.target || !e.target.result) return;
      
      const buffer = e.target.result as ArrayBuffer;
      try {
        dc.send(buffer);
        offset += buffer.byteLength;
        this.onProgress(fileId, joinerId, offset, fileObj.size);

        if (offset < fileObj.size) {
          // Check buffered amount to avoid overloading
          if (dc.bufferedAmount > CHUNK_SIZE * 8) {
            dc.onbufferedamountlow = () => {
              dc.onbufferedamountlow = null;
              readSlice(offset);
            };
          } else {
            readSlice(offset);
          }
        } else {
          dc.send(JSON.stringify({ type: 'eof', fileId }));
        }
      } catch (err) {
        console.error("DataChannel send error", err);
      }
    };

    readSlice(0);
  }

  private handleAnswer = async (payload: { senderId: string; answer: RTCSessionDescriptionInit; fileId?: string }) => {
    const peerId = `${payload.senderId}-${payload.fileId}`;
    const pc = this.peers.get(peerId);
    if (pc && pc.signalingState === "have-local-offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
    }
  };

  private handleIceCandidate = async (payload: { senderId: string; candidate: RTCIceCandidateInit; fileId?: string }) => {
    const peerId = `${payload.senderId}-${payload.fileId}`;
    const pc = this.peers.get(peerId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  };
}
