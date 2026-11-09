const LIVEKIT_URL = 'wss://elmo-quiz.duckdns.org';
const urlParams = new URLSearchParams(window.location.search);
const roomName = urlParams.get('room') || 'quiz-raum';

async function autoConnect() {
    try {
        console.log('Hole Zentrale-Token von Vercel...');
        const res = await fetch(`https://elmoquiz2027.vercel.app/api/token?room=${roomName}&name=Zentrale-Viewer`);
        const data = await res.json();

        console.log('Verbinde automatisch mit LiveKit Raum...');
        const room = new LivekitClient.Room({ 
            adaptiveStream: true,
            dynacast: true,
            websocketTransport: true 
        });

        // Wenn ein Spieler seine Kamera einschaltet / betritt
        room.on(LivekitClient.TrackSubscribed, (track, publication, participant) => {
            if (track.kind === LivekitClient.Track.Kind.Video) {
                const grid = document.getElementById('video-grid');
                
                // Prüfen ob die Box für diesen Teilnehmer schon existiert
                let card = document.getElementById(`participant-${participant.identity}`);
                if (!card) {
                    card = document.createElement('div');
                    card.className = 'cam-card';
                    card.id = `participant-${participant.identity}`;
                    card.innerHTML = `<h3>${participant.identity}</h3><div class="video-container" id="video-${participant.identity}"></div>`;
                    grid.appendChild(card);
                }

                const videoContainer = document.getElementById(`video-${participant.identity}`);
                videoContainer.innerHTML = ''; // Vorherige Streams bereinigen
                const element = track.attach();
                videoContainer.appendChild(element);
            }
        });

        // Wenn ein Teilnehmer den Raum verlässt
        room.on(LivekitClient.ParticipantDisconnected, (participant) => {
            const card = document.getElementById(`participant-${participant.identity}`);
            if (card) {
                card.remove();
            }
        });

        await room.connect(LIVEKIT_URL, data.token);
        console.log('Erfolgreich mit dem Raum verbunden!');

    } catch (err) {
        console.error('Verbindungsfehler:', err);
    }
}

// Startet die Verbindung direkt beim Laden der Seite
window.addEventListener('load', autoConnect);