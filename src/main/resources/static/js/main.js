let socket = new SockJS('/ws');
let stomp = Stomp.over(socket);

stomp.connect({}, function () {
    stomp.send("/app/register", {}, myId);

    stomp.subscribe("/topic/status/" + myId, function (msg) {
        if (msg.body === "CONNECTED") showConnected();
        if (msg.body === "DISCONNECTED") showDisconnected();
    });

    stomp.subscribe("/topic/file/" + myId, function (msg) {
        const message = JSON.parse(msg.body);
        receiveChunk(message);
    });
});

function showConnected() {
    document.getElementById("status").innerText = "Connected";
    document.getElementById("notConnectedSection").style.display = "none";
    document.getElementById("connectedSection").style.display = "block";
}

function showDisconnected() {
    document.getElementById("status").innerText = "Disconnected";
    document.getElementById("connectedSection").style.display = "none";
    document.getElementById("notConnectedSection").style.display = "block";
}

let isInternalNavigation = false;
function markInternalNavigation() { isInternalNavigation = true; }

function disconnect() {
    isInternalNavigation = true;
    fetch("/disconnect", { method: "POST" })
        .then(() => location.reload());
}

window.addEventListener("beforeunload", function () {
    if (!isInternalNavigation) navigator.sendBeacon("/disconnect");
});

// ===== FILE TRANSFER =====
const CHUNK_SIZE = 64 * 1024; // 64KB
const incomingFiles = {};

function sendFile() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) return;

    const remoteId = document.getElementById("remoteIdText").innerText;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let chunkIndex = 0;

    // Show progress bar
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressText.innerText = `0%`;

    const reader = new FileReader();

    reader.onload = function(e) {
        const chunk = new Uint8Array(e.target.result);

        const message = {
            fromId: myId,
            toId: remoteId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            chunkIndex: chunkIndex,
            totalChunks: totalChunks,
            data: Array.from(chunk)
        };

        stomp.send("/app/file/send", {}, JSON.stringify(message));

        chunkIndex++;
        // Update progress
        const percent = Math.floor((chunkIndex / totalChunks) * 100);
        progressBar.style.width = percent + "%";
        progressText.innerText = percent + "%";

        if (chunkIndex < totalChunks) loadNextChunk();
        else setTimeout(() => { progressContainer.style.display = "none"; }, 1000);
    };

    function loadNextChunk() {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        reader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNextChunk();
}

function receiveChunk(msg) {
    const key = msg.fromId + "_" + msg.fileName;
    if (!incomingFiles[key]) incomingFiles[key] = {chunks: [], total: msg.totalChunks, received: 0, fileType: msg.fileType};

    incomingFiles[key].chunks[msg.chunkIndex] = new Uint8Array(msg.data);
    incomingFiles[key].received++;

    if (incomingFiles[key].received === msg.totalChunks) {
        const fileData = incomingFiles[key];
        const blob = new Blob(fileData.chunks, { type: fileData.fileType });
        delete incomingFiles[key];

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = msg.fileName;
        a.innerText = "Download " + msg.fileName;
        a.style.display = "block";
        document.body.appendChild(a);
    }
}
