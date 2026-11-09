// Supabase initialisieren
const supabaseClient = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
const slots = ["spieler1", "spieler2", "spieler3", "spieler4", "spieler5", "spieler6", "spieler7", "spieler8"];
let mySlot = localStorage.getItem('quiz_assigned_slot');
let activeStream = null;

// URLs generieren (Über Standard-Port 443 via Caddy)
function getWhipUrl(playerID) {
    return `https://${CONFIG.serverIp}/${playerID}/whip`;
}

function getWhepUrl(playerID) {
    return `https://${CONFIG.serverIp}/${playerID}/whep`;
}

// Namen aus Supabase laden
async function getSlotName(slotId) {
    const { data } = await supabaseClient.from('quiz_slots').select('player_name').eq('slot_id', slotId).single();
    if (data && data.player_name) return data.player_name;
    return localStorage.getItem(`quiz_name_${slotId}`) || slotId.toUpperCase();
}

window.onload = async function() {
    if (mySlot) {
        startStudio(mySlot);
    } else {
        showSlotSelector();
    }
    
    // Realtime: Hört sofort zu, wenn der Admin einen Namen ändert
    supabaseClient.channel('public:quiz_slots')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_slots' }, (payload) => {
            if (payload.new) {
                const slotId = payload.new.slot_id;
                const newName = payload.new.player_name;
                const nameEl = document.getElementById(`name-${slotId}`);
                if (nameEl) {
                    const isMe = (slotId === mySlot);
                    nameEl.innerText = `${newName} ${isMe ? '(Du)' : ''}`;
                }
            }
        })
        .subscribe();
};

async function showSlotSelector() {
    const container = document.getElementById('slotButtonsContainer');
    container.innerHTML = "";
    for (const slot of slots) {
        const name = await getSlotName(slot);
        const btn = document.createElement('button');
        btn.className = "slot-btn";
        btn.innerText = `${name} (${slot.toUpperCase()})`;
        btn.onclick = () => {
            localStorage.setItem('quiz_assigned_slot', slot);
            startStudio(slot);
        };
        container.appendChild(btn);
    }
}

function resetSlot() {
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
    }
    localStorage.removeItem('quiz_assigned_slot');
    location.reload();
}

async function startStudio(slot) {
    mySlot = slot;
    document.getElementById('slot-screen').classList.add('hidden');
    document.getElementById('studio-screen').classList.remove('hidden');
    
    const realName = await getSlotName(mySlot);
    document.getElementById('displayName').innerText = realName;

    await initGrid();
    startPublishing();
}

async function initGrid() {
    const grid = document.getElementById('playerGrid');
    grid.innerHTML = "";

    for (const slotId of slots) {
        const isMe = (slotId === mySlot);
        const realName = await getSlotName(slotId);

        const card = document.createElement('div');
        card.className = `player-card ${isMe ? 'is-me' : ''}`;
        card.innerHTML = `
            <div class="player-name" id="name-${slotId}">${realName} ${isMe ? '(Du)' : ''}</div>
            <video id="vid-${slotId}" autoplay playsinline ${isMe ? 'muted' : ''}></video>
            <div class="status" id="stat-${slotId}">Warte...</div>
        `;
        grid.appendChild(card);

        if (!isMe) {
            startReceiving(slotId, `vid-${slotId}`, `stat-${slotId}`);
        }
    }
}

// Eigene Kamera senden (WHIP)
async function startPublishing() {
    const statusEl = document.getElementById('connectionStatus');
    try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: true });
        
        const myVideo = document.getElementById(`vid-${mySlot}`);
        if (myVideo) myVideo.srcObject = activeStream;
        
        document.getElementById(`stat-${mySlot}`).innerText = "Live aktiv";
        document.getElementById(`stat-${mySlot}`).style.color = "#4CAF50";

        const pc = new RTCPeerConnection();
        activeStream.getTracks().forEach(track => pc.addTrack(track, activeStream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const response = await fetch(getWhipUrl(mySlot), {
            method: 'POST',
            headers: { 'Content-Type': 'application/sdp' },
            body: offer.sdp
        });

        if (!response.ok) throw new Error("Server hat Stream abgelehnt");

        const answerSdp = await response.text();
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));

        statusEl.style.color = "#4CAF50";
        statusEl.innerText = "Status: Kamera erfolgreich übertragen!";
    } catch (err) {
        console.error(err);
        statusEl.style.color = "#f44336";
        statusEl.innerText = "Kamera-Fehler: " + err.message;
    }
}

// Andere Spieler empfangen (WHEP)
async function startReceiving(slotId, videoId, statusId) {
    const videoEl = document.getElementById(videoId);
    const statusEl = document.getElementById(statusId);
    
    const pc = new RTCPeerConnection();
    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    pc.ontrack = (event) => {
        videoEl.srcObject = event.streams[0];
        statusEl.style.color = "#4CAF50";
        statusEl.innerText = "Verbunden";
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    try {
        const response = await fetch(getWhepUrl(slotId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/sdp' },
            body: offer.sdp
        });

        if (!response.ok) throw new Error("Offline");

        const answerSdp = await response.text();
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));
    } catch (err) {
        statusEl.style.color = "#777";
        statusEl.innerText = "Offline / Wartet...";
        setTimeout(() => startReceiving(slotId, videoId, statusId), 4000);
    }
}

window.addEventListener('beforeunload', () => {
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
    }
});