console.log("🚀 MooDrop WebRTC Loaded");

// =============================
// CONFIG
// =============================
const CHUNK_SIZE = 64 * 1024; // adjustable chunk size
const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// =============================
// GLOBALS
// =============================
let stompClient = null;
let peerConnection = null;
let dataChannel = null;
let myId = generateId();
let incomingBuffers = [];
let incomingFileSize = 0;
let receivedSize = 0;

// =============================
// INIT
// =============================
window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("myIdText").innerText = myId;
    document.getElementById("status").innerText = "Connecting...";
    connectStomp();
    document.getElementById("connectBtn").onclick = connectToPeer;
    document.getElementById("sendBtn").onclick = sendSelectedFile;
});

// =============================
// ID GENERATOR
// =============================
function generateId() {
    return Math.random().toString(36).substring(2, 8);
}

// =============================
// STOMP CONNECTION
// =============================
function connectStomp() {
    const socket = new SockJS("/ws");
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({}, () => {
        console.log("✅ STOMP Connected");
        document.getElementById("status").innerText = "Ready";

        stompClient.subscribe("/topic/signal/" + myId, (msg) => {
            handleSignal(JSON.parse(msg.body));
        });
    });
}

// =============================
// CONNECT TO PEER
// =============================
async function connectToPeer() {
    const remoteId = document.getElementById("remoteIdInput").value.trim();
    if (!remoteId) return alert("Enter remote ID");

    createPeerConnection(remoteId);

    dataChannel = peerConnection.createDataChannel("fileChannel");
    setupDataChannel();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    sendSignal(remoteId, { type: "offer", sdp: offer });
    document.getElementById("status").innerText = "Calling...";
}

// =============================
// CREATE PEER CONNECTION
// =============================
function createPeerConnection(remoteId) {
    peerConnection = new RTCPeerConnection(ICE_SERVERS);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) sendSignal(remoteId, { type: "candidate", candidate: event.candidate });
    };

    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        setupDataChannel();
    };
}

// =============================
// DATA CHANNEL
// =============================
function setupDataChannel() {
    dataChannel.binaryType = "arraybuffer";

    dataChannel.onopen = () => {
        console.log("🟢 DataChannel OPEN");
        document.getElementById("status").innerText = "Connected ✅";
    };

    dataChannel.onmessage = (event) => {
        if (typeof event.data === "string") {
            const meta = JSON.parse(event.data);
            incomingFileSize = meta.size;
            receivedSize = 0;
            incomingBuffers = [];
            console.log("📥 Receiving file:", meta.name);
            return;
        }

        incomingBuffers.push(event.data);
        receivedSize += event.data.byteLength;
        updateProgress(Math.floor((receivedSize / incomingFileSize) * 100));

        if (receivedSize === incomingFileSize) {
            const blob = new Blob(incomingBuffers);
            const url = URL.createObjectURL(blob);

            const link = document.getElementById("downloadLink");
            link.href = url;
            link.download = "received_file";
            link.style.display = "block";

            document.getElementById("status").innerText = "Download Ready 🎉";
            console.log("✅ File received");
        }
    };
}

// =============================
// SEND FILE
// =============================
function sendSelectedFile() {
    const file = document.getElementById("fileInput").files[0];
    if (!file) return alert("Select file");

    if (!dataChannel || dataChannel.readyState !== "open") return alert("Connection not ready yet");

    console.log("📤 Sending:", file.name);
    dataChannel.send(JSON.stringify({ name: file.name, size: file.size }));

    let offset = 0;
    const reader = new FileReader();

    reader.onload = (e) => {
        dataChannel.send(e.target.result);
        offset += e.target.result.byteLength;
        updateProgress(Math.floor((offset / file.size) * 100));

        if (offset < file.size) readSlice(offset);
        else console.log("✅ File sent");
    };

    function readSlice(o) {
        const slice = file.slice(o, o + CHUNK_SIZE);
        reader.readAsArrayBuffer(slice);
    }

    readSlice(0);
}

// =============================
// SIGNALING
// =============================
function sendSignal(toId, data) {
    stompClient.send("/app/signal", {}, JSON.stringify({
        from: myId,
        to: toId,
        data: JSON.stringify(data)
    }));
}

async function handleSignal(message) {
    const data = JSON.parse(message.data);
    const remoteId = message.from;

    if (!peerConnection) createPeerConnection(remoteId);

    if (data.type === "offer") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendSignal(remoteId, { type: "answer", sdp: answer });

    } else if (data.type === "answer") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));

    } else if (data.type === "candidate") {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
}

// =============================
// PROGRESS
// =============================
function updateProgress(percent) {
    document.getElementById("progressBar").value = percent;
}
