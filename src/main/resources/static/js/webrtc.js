console.log("🚀 MooDrop WebRTC Loaded");

// =============================
// CONFIG
// =============================
const CHUNK_SIZE = 64 * 1024; // 64KB
const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// =============================
// GLOBALS
// =============================
let stompClient = null;
let peerConnection = null;
let dataChannel = null;
let myId = generateId();
let incomingFiles = {};
let sendingFiles = {}; // track sending for cancel

document.getElementById("myIdText").innerText = myId;
document.getElementById("status").innerText = "Connecting...";
connectStomp();

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
// DATA CHANNEL SETUP
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
            incomingFiles[meta.id] = {
                name: meta.name,
                size: meta.size,
                receivedSize: 0,
                buffers: [],
                canceled: false
            };
            createFileUI(meta.id, meta.name, true);
            return;
        }

        const currentFileId = Object.keys(incomingFiles).find(id => incomingFiles[id].receivedSize < incomingFiles[id].size && !incomingFiles[id].canceled);
        if (!currentFileId) return;

        const file = incomingFiles[currentFileId];
        file.buffers.push(event.data);
        file.receivedSize += event.data.byteLength;

        updateFileProgress(currentFileId);

        if (file.receivedSize >= file.size) {
            const blob = new Blob(file.buffers);
            const link = document.getElementById("download_" + currentFileId);
            link.href = URL.createObjectURL(blob);
            link.download = file.name;
            link.style.display = "inline-block";
            console.log(`✅ File received: ${file.name}`);
        }
    };
}

// =============================
// SEND MULTIPLE FILES
// =============================
function sendSelectedFiles() {
    const files = document.getElementById("fileInput").files;
    if (!files.length) return alert("Select files");
    if (!dataChannel || dataChannel.readyState !== "open") return alert("Connection not ready yet");

    Array.from(files).forEach(sendFile);
}

// =============================
// SEND SINGLE FILE
// =============================
async function sendFile(file) {
    const fileId = generateId();
    sendingFiles[fileId] = { canceled: false };
    dataChannel.send(JSON.stringify({ id: fileId, name: file.name, size: file.size }));
    createSentFileUI(fileId, file.name);

    let offset = 0;
    const reader = new FileReader();

    reader.onload = async (e) => {
        // backpressure control
        while (dataChannel.bufferedAmount > 16 * CHUNK_SIZE) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        if (sendingFiles[fileId].canceled) return console.log(`❌ Sending canceled: ${file.name}`);
        dataChannel.send(e.target.result);
        offset += e.target.result.byteLength;
        updateSentFileUI(fileId, Math.floor((offset / file.size) * 100));

        if (offset < file.size) readSlice(offset);
        else console.log(`✅ File sent: ${file.name}`);
    };

    function readSlice(o) {
        const slice = file.slice(o, o + CHUNK_SIZE);
        reader.readAsArrayBuffer(slice);
    }

    readSlice(0);
}

// =============================
// UI CREATION
// =============================
function createFileUI(fileId, fileName, incoming = false) {
    const container = document.getElementById("fileList");
    const div = document.createElement("div");
    div.className = "file-item";
    div.id = (incoming ? "file_" : "file_sent_") + fileId;

    div.innerHTML = `
        <span>${fileName}</span>
        <progress id="progress_${fileId}" value="0" max="100"></progress>
        <span id="percent_${fileId}">0%</span>
        <a id="download_${fileId}" style="display:none" class="btn btn-sky btn-sm">Download</a>
        <button id="cancel_${fileId}" class="btn btn-danger btn-sm">Cancel</button>
    `;

    container.appendChild(div);

    // Cancel button
    document.getElementById("cancel_" + fileId).onclick = () => cancelFile(fileId, incoming);
}

function createSentFileUI(fileId, fileName) {
    createFileUI(fileId, fileName, false);
}

// =============================
// UPDATE PROGRESS
// =============================
function updateFileProgress(fileId) {
    const file = incomingFiles[fileId];
    const progress = document.getElementById("progress_" + fileId);
    const percentText = document.getElementById("percent_" + fileId);
    const percent = Math.floor((file.receivedSize / file.size) * 100);
    if (progress) progress.value = percent;
    if (percentText) percentText.innerText = percent + "%";
}

function updateSentFileUI(fileId, percent) {
    const progress = document.getElementById("progress_" + fileId);
    const percentText = document.getElementById("percent_" + fileId);
    if (progress) progress.value = percent;
    if (percentText) percentText.innerText = percent + "%";
}

// =============================
// CANCEL FILE
// =============================
function cancelFile(fileId, incoming) {
    if (incoming) incomingFiles[fileId].canceled = true;
    else sendingFiles[fileId].canceled = true;

    const div = document.getElementById((incoming ? "file_" : "file_") + fileId);
    if (div) div.remove();
    console.log(`❌ File canceled: ${fileId}`);
}

// =============================
// SIGNALING
// =============================
function sendSignal(toId, data) {
    stompClient.send("/app/signal", {}, JSON.stringify({ from: myId, to: toId, data: JSON.stringify(data) }));
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
