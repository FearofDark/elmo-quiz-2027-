const SERVER_URL = "138-201-116-65.sslip.io";
let localStream = null;

async function startTest(myRole) {
    const otherRole = myRole === 'cam1' ? 'cam2' : 'cam1';
    
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('test-screen').classList.remove('hidden');
    document.getElementById('roleTitle').innerText = `Modus: ${myRole.toUpperCase()} (Empfängt: ${otherRole.toUpperCase()})`;

    // 1. Lokale Kamera starten & per WHIP an den Server senden
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: true });
        document.getElementById('localVideo').srcObject = localStream;

        const pcPub = new RTCPeerConnection();
        localStream.getTracks().forEach(track => pcPub.addTrack(track, localStream));

        const offer = await pcPub.createOffer();
        await pcPub.setLocalDescription(offer);

        const responseUrl = `https://${SERVER_URL}/${myRole}/whip`;
        const res = await fetch(responseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/sdp' },
            body: offer.sdp
        });

        if (!res.ok) throw new Error("Server hat WHIP abgelehnt");

        const answerSdp = await res.text();
        await pcPub.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));

        document.getElementById('localStatus').innerText = "Live gesendet (WHIP OK)";
        document.getElementById('localStatus').style.color = "#4CAF50";
    } catch (err) {
        console.error(err);
        document.getElementById('localStatus').innerText = "Fehler: " + err.message;
        document.getElementById('localStatus').style.color = "#f44336";
    }

    // 2. Gegenstelle per WHEP abrufen
    startReceiving(otherRole, 'remoteVideo', 'remoteStatus');
}

async function startReceiving(targetRole, videoId, statusId) {
    const videoEl = document.getElementById(videoId);
    const statusEl = document.getElementById(statusId);

    const pcSub = new RTCPeerConnection();
    pcSub.addTransceiver('video', { direction: 'recvonly' });
    pcSub.addTransceiver('audio', { direction: 'recvonly' });

    pcSub.ontrack = (event) => {
        videoEl.srcObject = event.streams[0];
        statusEl.innerText = "Verbunden (Empfange Stream)";
        statusEl.style.color = "#4CAF50";
    };

    try {
        const res = await fetch(`https://${SERVER_URL}/${targetRole}/whep`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/sdp' },
            body: (await pcSub.createOffer()).sdp
        });

        if (!res.ok) throw new Error("Stream offline");

        await pcSub.setLocalDescription(pcSub.localDescription);
        const answerSdp = await res.text();
        await pcSub.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));
    } catch (err) {
        statusEl.innerText = "Warte auf Gegenstelle...";
        statusEl.style.color = "#ff9800";
        // Alle 3 Sekunden erneut versuchen
        setTimeout(() => startReceiving(targetRole, videoId, statusId), 3000);
    }
}