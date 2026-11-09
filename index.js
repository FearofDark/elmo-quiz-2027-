const LIVEKIT_URL = 'wss://elmo-quiz.duckdns.org';
const urlParams = new URLSearchParams(window.location.search);
const roomName = urlParams.get('room') || 'quiz-raum';

// WICHTIG: Erzeuge einen eindeutigen Namen für diesen Zentrale-Tab, 
// damit LiveKit ihn nicht als Duplikat behandelt!
const viewerName = 'Zentrale-' + Math.floor(Math.random() * 10000);

function attachVideoTrack(track, participant) {
    const grid = document.getElementById('video-grid');
    
    let card = document.getElementById(`participant-${participant.identity}`);
    if (!card) {
        card = document.createElement('div');
        card.className = 'cam-card';
        card.id = `participant-${participant.identity}`;
        card.innerHTML = `<h3>${participant.identity}</h3><div class="video-container" id="video-${participant.identity}"></div>`;
        grid.appendChild(card);
    }

    const videoContainer = document.getElementById(`video-${participant.identity}`);
    videoContainer.innerHTML = ''; 
    
    const element = track.attach();
    element.autoplay = true;
    element.playsInline = true;
    videoContainer.appendChild(element);
}

async function autoConnect() {
    try {
        console.log('Hole Zentrale-Token von Vercel...');
        // Hier übergeben wir den eindeutigen viewerName
        const res = await fetch(`https://elmoquiz2027.vercel.app/api/token?room=${roomName}&name=${viewerName}`);
        const data = await res.json();

        console.log('Verbinde automatisch mit LiveKit Raum...');
        const room = new LivekitClient.Room({ 
            adaptiveStream: true,
            dynacast: true,
            websocketTransport: true 
        });

        // 1. Wenn neue Tracks dazukommen
        room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
            if (track.kind === LivekitClient.Track.Kind.Video) {
                attachVideoTrack(track, participant);
            }
        });

        // 2. Wenn jemand den Raum verlässt
        room.on(LivekitClient.RoomEvent.ParticipantDisconnected, (participant) => {
            const card = document.getElementById(`participant-${participant.identity}`);
            if (card) {
                card.remove();
            }
        });

        await room.connect(LIVEKIT_URL, data.token);
        console.log('Erfolgreich mit dem Raum verbunden!');

        // 3. Alle bereits vorhandenen Teilnehmer rendern
        room.remoteParticipants.forEach((participant) => {
            participant.trackPublications.forEach((publication) => {
                if (publication.track && publication.track.kind === LivekitClient.Track.Kind.Video) {
                    attachVideoTrack(publication.track, participant);
                }
            });
        });

    } catch (err) {
        console.error('Verbindungsfehler:', err);
    }
}

window.addEventListener('load', autoConnect);