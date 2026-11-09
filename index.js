const LIVEKIT_URL = 'wss://elmo-quiz.duckdns.org';

// URL und Raumnamen ermitteln
const urlParams = new URLSearchParams(window.location.search);
const roomName = urlParams.get('room') || 'quiz-raum';
const participantName = urlParams.get('name') || 'player-' + Math.floor(Math.random() * 1000);

// QR-Code für das Handy generieren, sobald die Seite lädt
window.addEventListener('DOMContentLoaded', () => {
    // Erstellt die Handy-URL (nutzt dieselbe Vercel-Domain mit einem Cam-Suffix)
    const mobileCamUrl = `${window.location.origin}${window.location.pathname}?room=${roomName}&name=${participantName}-Cam`;
    
    // QR-Code in das dafür vorgesehene Element rendern (nutzt die qrcode.js Bibliothek)
    const qrContainer = document.getElementById('qrcode');
    if (qrContainer) {
        qrContainer.innerHTML = ''; // Vorherige leeren
        new QRCode(qrContainer, {
            text: mobileCamUrl,
            width: 128,
            height: 128,
        });
    }
});

document.getElementById('join-btn').addEventListener('click', async () => {
    try {
        console.log('Hole Token von Vercel...');
        const res = await fetch(`https://elmoquiz2027.vercel.app/api/token?room=${roomName}`);
        const data = await res.json();
        const token = data.token;

        console.log('Verbinde mit LiveKit Raum...');
        const room = new LivekitClient.Room({
            adaptiveStream: true,
            dynacast: true,
            websocketTransport: true 
        });

        room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
            if (track.kind === LivekitClient.Track.Kind.Video) {
                const remoteContainer = document.getElementById('remote-video');
                remoteContainer.innerHTML = '';
                const element = track.attach();
                element.style.width = "100%";
                element.style.height = "100%";
                remoteContainer.appendChild(element);
            }
        });

        await room.connect(LIVEKIT_URL, token);
        console.log('Erfolgreich verbunden!');

        await room.localParticipant.enableCameraAndMicrophone();
        
        const localPub = room.localParticipant.getTrackPublication(LivekitClient.Track.Source.Camera);
        if (localPub && localPub.videoTrack) {
            const localContainer = document.getElementById('local-video');
            localContainer.innerHTML = '';
            const element = localPub.videoTrack.attach();
            element.style.width = "100%";
            element.style.height = "100%";
            localContainer.appendChild(element);
        }

        document.getElementById('join-btn').style.display = 'none';

    } catch (err) {
        console.error('Fehler bei der Kameraverbindung:', err);
        alert('Fehler: ' + err.message);
    }
});