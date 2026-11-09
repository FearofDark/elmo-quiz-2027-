// Supabase initialisieren
const supabaseClient = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
const slots = ["spieler1", "spieler2", "spieler3", "spieler4", "spieler5", "spieler6", "spieler7", "spieler8"];

function getWhepUrl(playerID) {
    return `https://${CONFIG.serverIp}/${playerID}/whep`;
}

async function getSlotName(slotId) {
    const { data } = await supabaseClient.from('quiz_slots').select('player_name').eq('slot_id', slotId).single();
    if (data && data.player_name) return data.player_name;
    return slotId.toUpperCase();
}

async function renderTable() {
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = "";

    for (const slotId of slots) {
        const currentName = await getSlotName(slotId);
        const displayName = currentName === slotId.toUpperCase() ? '' : currentName;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${slotId.toUpperCase()}</strong></td>
            <td><input type="text" id="input-${slotId}" value="${displayName}" placeholder="Name eingeben..."></td>
            <td><span id="status-${slotId}" class="badge offline">Prüfe...</span></td>
            <td><button onclick="saveName('${slotId}')">Speichern</button></td>
        `;
        tbody.appendChild(tr);

        checkStreamStatus(slotId);
    }
}

async function saveName(slotId) {
    const inputVal = document.getElementById(`input-${slotId}`).value.trim();
    const finalName = inputVal || slotId.toUpperCase();
    
    await supabaseClient.from('quiz_slots').upsert({ slot_id: slotId, player_name: finalName, updated_at: new Date() });
    alert(`Name für ${slotId.toUpperCase()} gespeichert als: ${finalName}`);
}

async function checkStreamStatus(slotId) {
    const statusBadge = document.getElementById(`status-${slotId}`);
    try {
        const pc = new RTCPeerConnection();
        pc.addTransceiver('video', { direction: 'recvonly' });
        
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const response = await fetch(getWhepUrl(slotId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/sdp' },
            body: offer.sdp
        });

        if (response.ok) {
            if (statusBadge) {
                statusBadge.className = "badge online";
                statusBadge.innerText = "ONLINE (LIVE)";
            }
        } else {
            throw new Error();
        }
    } catch (err) {
        if (statusBadge) {
            statusBadge.className = "badge offline";
            statusBadge.innerText = "Offline";
        }
    }
    
    setTimeout(() => checkStreamStatus(slotId), 4000);
}

window.onload = () => {
    renderTable();
};