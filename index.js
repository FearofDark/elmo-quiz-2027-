const LIVEKIT_URL = 'wss://elmo-quiz.duckdns.org';
const roomName = 'quiz-raum';

// Setzt die Video-Streams basierend auf der Admin-Zuordnung ein
function updateVideoAssignments(room) {
    const savedMapping = localStorage.getItem('quiz_slot_mapping');
    if (!savedMapping) return;

    const slotMapping = JSON.parse(savedMapping);

    // Gehe alle 4 Slots durch und platziere die zugewiesenen Kameras
    Object.keys(slotMapping).forEach(slotId => {
        const assignedName = slotMapping[slotId];
        const videoContainer = document.getElementById(`video-slot-${slotId}`);

        if (!videoContainer) return;

        if (!assignedName) {
            videoContainer.innerHTML = ''; // Slot leeren, falls abgewählt
            return;
        }

        // Suche den passenden LiveKit-Teilnehmer anhand seines Namens
        const participant = Array.from(room.remoteParticipants.values()).find(p => p.identity === assignedName);

        if (participant) {
            participant.trackPublications.forEach(pub => {
                if (pub.track && pub.track.kind === LivekitClient.Track.Kind.Video) {
                    videoContainer.innerHTML = '';
                    const el = pub.track.attach();
                    el.autoplay = true;
                    el.playsInline = true;
                    videoContainer.appendChild(el);
                    console.log(`Kamera von ${assignedName} in ${slotId} platziert.`);
                }
            });
        }
    });
}

// Live-Events & Verbindung
async function initMainDisplay() {
    try {
        const res = await fetch(`https://elmoquiz2027.vercel.app/api/token?room=${roomName}&name=Haupt-Display`);
        const data = await res.json();

        const room = new LivekitClient.Room({ adaptiveStream: true, dynacast: true });

        // Wenn sich im Admin-Panel etwas ändert
        window.addEventListener('storage', (e) => {
            if (e.key === 'quiz_slot_mapping') updateVideoAssignments(room);
        });

        // Wenn Streams abboniert werden
        room.on(LivekitClient.RoomEvent.TrackSubscribed, () => updateVideoAssignments(room));
        room.on(LivekitClient.RoomEvent.ParticipantDisconnected, () => updateVideoAssignments(room));

        await room.connect(LIVEKIT_URL, data.token);
        console.log('Haupt-Display mit Hetzner LiveKit verbunden!');

    } catch (err) {
        console.error('Fehler in index.js:', err);
    }
}

window.addEventListener('load', initMainDisplay);