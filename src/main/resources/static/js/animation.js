function startTransferAnimation() {
    document.getElementById('brandTitle').classList.add('brand-transfer-active');
}

function stopTransferAnimation() {
    document.getElementById('brandTitle').classList.remove('brand-transfer-active');
}

// Example: call these when sending files
function sendSelectedFiles() {
    startTransferAnimation();  // start glowing
    // your file sending code...

    // Simulate transfer done after 3s (replace with actual transfer complete callback)
    setTimeout(() => {
        stopTransferAnimation(); // stop glowing
    }, 3000);
}
