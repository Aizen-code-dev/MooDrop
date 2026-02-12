// function startTransferAnimation() {
//     document.getElementById('brandTitle').classList.add('brand-transfer-active');
// }
//
// function stopTransferAnimation() {
//     document.getElementById('brandTitle').classList.remove('brand-transfer-active');
// }
document.getElementById("fileInput").addEventListener("change", function () {
    const placeholderText = document.querySelector(".placeholder-text");

    if (this.files.length === 0) {
        placeholderText.innerText = "Choose files";
    }
    else if (this.files.length === 1) {
        placeholderText.innerText = this.files[0].name;
    }
    else {
        placeholderText.innerText = this.files.length + " files selected";
    }
});


function updateClock() {
    const now = new Date();

    const month = now.toLocaleString('en-US', { month: 'short' });
    const day = now.toLocaleString('en-US', { weekday: 'short' });

    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');

    document.getElementById("liveClock").innerText =
        `${month} · ${day} · ${hours}:${minutes}`;
}

function startClock() {
    updateClock();

    // update every second for perfect minute sync
    setInterval(updateClock, 1000);
}

document.addEventListener("DOMContentLoaded", startClock);

// // Example: call these when sending files
// function sendSelectedFiles() {
//     startTransferAnimation();  // start glowing
//     // your file sending code...
//
//     // Simulate transfer done after 3s (replace with actual transfer complete callback)
//     setTimeout(() => {
//         stopTransferAnimation(); // stop glowing
//     }, 3000);
// }
