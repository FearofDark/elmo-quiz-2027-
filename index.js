// Deine gesicherte LiveKit-Domain auf Hetzner
const LIVEKIT_URL = 'wss://elmo-quiz.duckdns.org';

document.getElementById('join-btn').addEventListener('click', async () => {
    try {
        // 1. Token direkt vom Vercel-Backend abrufen (mit absoluter URL)
        const res = await fetch('https://elmoquiz2027.vercel.app/api/token?room=quiz-raum');
        const data = await res.json();
        const token = data.token;

        // 2. LiveKit Raum initialisieren
        const room = new LivekitClient.Room({
            adaptiveStream: true,
            dynacast: true,
        });

        // 3. Gegenspieler-Stream empfangen und anzeigen
        room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
            if (track.kind === LivekitClient.Track.Kind.Video) {
                const remoteContainer = document.getElementById('remote-video');
                remoteContainer.innerHTML = ''; // Vorherige Elemente leeren
                const element = track.attach();
                element.style.width = "100%";
                element.style.height = "100%";
                remoteContainer.appendChild(element);
            }
        });

        // 4. Mit dem LiveKit-Server über gesichertes WSS verbinden
        await room.connect(LIVEKIT_URL, token);
        console.log('Erfolgreich mit dem LiveKit-Server verbunden!');

        // 5. Eigene Kamera & Mikrofon aktivieren
        await room.localParticipant.enableCameraAndMicrophone();
        
        // Eigenes Video direkt in den Container rendern
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