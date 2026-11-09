const LIVEKIT_URL = 'wss://elmo-quiz.duckdns.org';
const roomName = 'quiz-raum';

// Baut das Layout in der Zentrale auf Basis von localStorage auf
function buildDashboardLayout() {
    const saved = localStorage.getItem('quiz_config');
    if (!saved) return;

    const config = JSON.parse(saved);
    const leftCol = document.getElementById('left-column');
    const rightCol = document.getElementById('right-column');
    
    if (!leftCol || !rightCol) return;

    leftCol.innerHTML = '';
    rightCol.innerHTML = '';

    const teams = config.teams || [];
    const midpoint = Math.ceil(teams.length / 2);

    teams.forEach((team, index) => {
        const teamNum = (index % 4) + 1;
        let playersHtml = '';
        
        team.players.forEach((pName, pIndex) => {
            const isCaptain = (pIndex === 0) ? '<span class="captain-badge">CAPTAIN</span>' : '';
            playersHtml += `
                <div class="player-box">
                    <div class="player-info">
                        <span>${pName}</span>
                        ${isCaptain}
                    </div>
                    <!-- Slot-ID entspricht exakt dem Spielernamen -->
                    <div class="video-container" id="video-slot-${pName}"></div>
                </div>
            `;
        });

        const teamCardHtml = `
            <div class="team-card team-${teamNum}">
                <div class="team-header">
                    <span>${team.name}</span>
                    <span class="team-score">${team.score}</span>
                </div>
                ${playersHtml}
            </div>
        `;

        if (index < midpoint) {
            leftCol.insertAdjacentHTML('beforeend', teamCardHtml);
        } else {
            rightCol.insertAdjacentHTML('beforeend', teamCardHtml);
        }
    });
}

// Stream einem Slot zuordnen
function attachVideoTrack(track, participant) {
    const identity = participant.identity; // z.B. "Marvin" oder "player1"
    
    // Suche direkt nach dem Slot mit dem Namen
    let slot = document.getElementById(`video-slot-${identity}`);

    // Falls nicht gefunden, prüfen ob es ein Slot-Name wie "player1" ist und mappen
    if (!slot && identity.toLowerCase().startsWith('player')) {
        // Optionaler Fallback, falls du player1 nutzt
        slot = document.getElementById(`video-slot-${identity}`);
    }

    if (slot) {
        slot.innerHTML = '';
        const element = track.attach();
        element.autoplay = true;
        element.playsInline = true;
        slot.appendChild(element);
        console.log(`Stream von "${identity}" erfolgreich platziert.`);
    } else {
        console.warn(`Kein Video-Slot für Teilnehmer "${identity}" gefunden.`);
    }
}

async function initMainDisplay() {
    try {
        buildDashboardLayout();

        const res = await fetch(`https://elmoquiz2027.vercel.app/api/token?room=${roomName}&name=Haupt-Display`);
        const data = await res.json();

        const room = new LivekitClient.Room({ adaptiveStream: true, dynacast: true });

        // Bei Änderungen im Admin-Panel das Layout neu laden
        window.addEventListener('storage', (e) => {
            if (e.key === 'quiz_config') {
                buildDashboardLayout();
            }
        });

        room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
            if (track.kind === LivekitClient.Track.Kind.Video) {
                attachVideoTrack(track, participant);
            }
        });

        room.on(LivekitClient.RoomEvent.ParticipantDisconnected, (participant) => {
            const slot = document.getElementById(`video-slot-${participant.identity}`);
            if (slot) slot.innerHTML = '';
        });

        await room.connect(LIVEKIT_URL, data.token);
        console.log('Haupt-Display mit LiveKit verbunden!');

        // Bereits aktive Streams abgreifen
        room.remoteParticipants.forEach((participant) => {
            participant.trackPublications.forEach((publication) => {
                if (publication.track && publication.track.kind === LivekitClient.Track.Kind.Video) {
                    attachVideoTrack(publication.track, participant);
                }
            });
        });

    } catch (err) {
        console.error('Fehler in index.js:', err);
    }
}

window.addEventListener('load', initMainDisplay);