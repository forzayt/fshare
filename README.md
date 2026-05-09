# Fshare: P2P Cloud-Drive Case Study

Fshare is a high-performance, privacy-focused peer-to-peer (P2P) file sharing application that combines the convenience of a cloud drive with the security of direct browser-to-browser transfers. This case study explores the technical challenges and architectural decisions behind building a scalable, account-less, and persistent file-sharing platform.

## 🚀 The Vision
The goal was to create a file-sharing tool that:
1. **Requires No Accounts**: Instant access for both hosts and joiners.
2. **Handles Large Files**: Bypassing traditional server upload limits.
3. **Ensures Persistence**: Files should survive tab reloads and browser restarts (Cloud-drive experience).
4. **Prioritizes Privacy**: Data should stay on the user's device, not on a central server.

---

## 🛠️ Technical Architecture

### 1. P2P Data Transfer (WebRTC)
At its core, Fshare uses **WebRTC DataChannels** for actual file transfers. This bypasses the server entirely after the initial signaling phase, ensuring:
- **Zero Server Costs**: Data doesn't touch our infrastructure.
- **Maximum Speed**: Transfers are limited only by the users' local network/internet speeds.
- **End-to-End Encryption**: Built-in security for every transfer.

### 2. The "Cloud Drive" Layer (IndexedDB)
Traditional P2P tools lose everything if the host refreshes their page. Fshare solves this using **IndexedDB**, a browser-based transactional database.
- **Chunked Storage**: Large files are split into 64KB chunks and stored in IndexedDB. This prevents browser crashes when handling files larger than the available RAM.
- **Session Resuming**: Hosts save their session ID in `localStorage`. Upon refreshing, the server re-attaches them to their existing session, and the application restores their shared files from IndexedDB.

### 3. Real-Time Signaling (Socket.io)
While data is P2P, we use **Socket.io** for signaling and orchestration:
- **Session Management**: Coordinating unique 12-character keys (e.g., `A4N9-K72X-Q3LM`).
- **Device Tracking**: Real-time monitoring of connected joiners.
- **Metadata Sync**: Ensuring joiners see exactly what the host is sharing in real-time.

---

## 🧩 Key Features & Implementation

### 📦 Handling Large Files
To manage large files (GBs) without crashing the browser:
- **Streaming Chunks**: Files are read and transmitted as small `ArrayBuffer` chunks.
- **Backpressure Handling**: We monitor the WebRTC `bufferedAmount`. If it exceeds a threshold (e.g., 512KB), we pause reading until the buffer clears, preventing memory overflow.

### 🔄 Seamless Host Recovery
If a host refreshes:
1. The server detects the disconnect but **holds the session open**.
2. The host reloads, finds their session key in `localStorage`, and sends a `host:start` with that key.
3. The server re-links the host's new socket to the existing session.
4. The host re-initializes their file list from IndexedDB.
5. Joiners never lose connection to the "session," though the active transfer might pause briefly.

### 👥 Simplified Joiner Experience
- **One-Click Download**: Joiners can click "Download All" to trigger a batch request for all shared files.
- **No Indexing for Receivers**: To keep the joiner's experience fast and ephemeral, files are downloaded directly to their OS download folder without being saved in the browser's IndexedDB (unless explicitly requested).

---

## 🛡️ Privacy & Security
- **No Data on Server**: Our backend only manages metadata (filenames, sizes) and signaling. The actual file content never leaves the users' devices.
- **Secure Keys**: Randomly generated 12-character keys ensure that only those with the link can join.
- **Manual Revocation**: Hosts have full control to "Revoke Session," which immediately wipes session data from the server and local metadata from the host's browser.

## 🧪 Tech Stack
- **Frontend**: React, TanStack Router, Tailwind CSS, Lucide Icons.
- **Backend**: Fastify (Node.js), Socket.io.
- **Storage**: Client-side IndexedDB.
- **Signaling**: WebRTC (RTCPeerConnection & DataChannel).

---

Fshare demonstrates that with the right combination of modern browser APIs, we can build powerful, user-centric tools that rival traditional centralized services while maintaining absolute privacy and performance.
