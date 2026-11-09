const LIVEKIT_URL = 'wss://elmo-quiz.duckdns.org';

document.getElementById('join-btn').addEventListener('click', async () => {
    try {
        console.log('Hole Token von Vercel...');
        const res = await fetch('https://elmoquiz2027.vercel.app/api/token?room=quiz-raum');
        const data = await res.json();
        const token = data.token;

        console.log('Verbinde mit LiveKit Raum...');
        const room = new LivekitClient.Room({
            adaptiveStream: true,
            dynacast: true,
            // Erzwingt WebSocket statt WebRTC-Data-Channels für das Signaling falls nötig
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