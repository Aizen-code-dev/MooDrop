console.log("🚀 MooDrop WebRTC Loaded");

const CHUNK_SIZE = 64 * 1024;
const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

let stompClient = null;
let peerConnection = null;
let dataChannel = null;
let myId = generateId();
let incomingFiles = {};

document.getElementById("myIdText").innerText = myId;
document.getElementById("status").innerText = "Connecting...";
connectStomp();

function generateId() {
    return Math.random().toString(36).substring(2, 8);
}

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

function setupDataChannel() {
    dataChannel.binaryType = "arraybuffer";

    dataChannel.onopen = () => {
        console.log("🟢 DataChannel OPEN");
        document.getElementById("status").innerText = "Connected ✅";
    };

    dataChannel.onmessage = (event) => {
        if (typeof event.data === "string") {
            // Metadata
            const meta = JSON.parse(event.data);
            incomingFiles[meta.id] = {
                name: meta.name,
                size: meta.size,
                receivedSize: 0,
                buffers: [],
            };
            createFileUI(meta.id, meta.name);
            return;
        }

        // Binary chunk
        const chunk = event.data;

        // Determine which file this chunk belongs to
        // Use a "currentReceivingFileId" tracker
        let currentFileId = Object.keys(incomingFiles).find(id => {
            const f = incomingFiles[id];
            return f.receivedSize < f.size;
        });

        if (!currentFileId) {
            console.error("No file found for incoming chunk!");
            return;
        }

        const file = incomingFiles[currentFileId];
        file.buffers.push(chunk);
        file.receivedSize += chunk.byteLength;

        updateFileProgress(currentFileId);

        // Complete
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

function sendSelectedFiles() {
    const files = document.getElementById("fileInput").files;
    if (!files.length) return alert("Select files");

    if (!dataChannel || dataChannel.readyState !== "open") return alert("Connection not ready yet");

    Array.from(files).forEach(sendFile);
}

function sendFile(file) {
    const fileId = generateId();
    dataChannel.send(JSON.stringify({ id: fileId, name: file.name, size: file.size }));
    createSentFileUI(fileId, file.name);

    let offset = 0;
    const reader = new FileReader();

    reader.onload = (e) => {
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

function createFileUI(fileId, fileName) {
    const container = document.getElementById("fileList");
    const div = document.createElement("div");
    div.className = "file-item";
    div.id = "file_" + fileId;
    div.innerHTML = `
        <span>${fileName}</span>
        <progress id="progress_${fileId}" value="0" max="100"></progress>
        <a id="download_${fileId}" style="display:none" class="btn btn-sky btn-sm">Download</a>
    `;
    container.appendChild(div);
}

function createSentFileUI(fileId, fileName) {
    const container = document.getElementById("fileList");
    const div = document.createElement("div");
    div.className = "file-item";
    div.id = "file_sent_" + fileId;
    div.innerHTML = `<span>${fileName}</span><progress id="progress_sent_${fileId}" value="0" max="100"></progress>`;
    container.appendChild(div);
}

function updateFileProgress(fileId) {
    const file = incomingFiles[fileId];
    const progress = document.getElementById("progress_" + fileId);
    progress.value = Math.floor((file.receivedSize / file.size) * 100);
}

function updateSentFileUI(fileId, percent) {
    const progress = document.getElementById("progress_sent_" + fileId);
    if (progress) progress.value = percent;
}

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
