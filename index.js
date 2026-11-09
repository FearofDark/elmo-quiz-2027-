const HETZNER_LIVEKIT_URL = 'ws://138.201.116.65:7880';

document.getElementById('join-btn').addEventListener('click', async () => {
    try {
        // 1. Token vom Vercel Backend abrufen
        const res = await fetch('/api/token?room=quiz-raum');
        const { token } = await res.json();

        // 2. LiveKit Raum initialisieren
        const room = new LivekitClient.Room({
            adaptiveStream: true,
            dynacast: true,
        });

        // 3. Gegenspieler-Stream empfangen und anzeigen
        room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
            if (track.kind === LivekitClient.Track.Kind.Video) {
                const element = track.attach();
                document.getElementById('remote-video').appendChild(element);
            }
        });

        // 4. Mit dem Hetzner LiveKit-Server verbinden
        await room.connect(HETZNER_LIVEKIT_URL, token);
        console.log('Erfolgreich mit Hetzner verbunden!');

        // 5. Eigene Kamera & Mikrofon aktivieren
        await room.localParticipant.enableCameraAndMicrophone();
        
        // Eigenes Video anzeigen
        const localTrack = room.localParticipant.getTrackPublication(LivekitClient.Track.Source.Camera).videoTrack;
        if (localTrack) {
            document.getElementById('local-video').appendChild(localTrack.attach());
        }

        document.getElementById('join-btn').style.display = 'none';

    } catch (err) {
        console.error('Fehler bei der Kameraverbindung:', err);
        alert('Fehler beim Verbinden. Bitte Konsole prüfen!');
    }
});