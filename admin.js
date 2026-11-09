const modeSelect = document.getElementById('admin-mode');
const countSelect = document.getElementById('admin-team-count');
const container = document.getElementById('teams-config-container');

function renderBuilder() {
    const count = parseInt(countSelect.value);
    const mode = modeSelect.value;
    container.innerHTML = '';

    // Lade evtl. alte Werte
    const saved = JSON.parse(localStorage.getItem('quiz_config') || '{}');
    const oldTeams = saved.teams || [];

    for (let i = 0; i < count; i++) {
        const tData = oldTeams[i] || { name: `Team ${i+1}`, score: 0, players: [`Spieler ${i+1}`] };
        
        let html = `<div class="team-block">
            <label>Team ${i+1} Name</label>
            <input type="text" class="t-name" value="${tData.name}">
            <label>Punkte</label>
            <input type="number" class="t-score" value="${tData.score}">
            <label>Spieler in diesem Team (Komma-getrennt, z.B. Marvin, Samira)</label>
            <input type="text" class="t-players" value="${Array.isArray(tData.players) ? tData.players.join(', ') : tData.players}">
        </div>`;
        container.insertAdjacentHTML('beforeend', html);
    }
}

modeSelect.addEventListener('change', renderBuilder);
countSelect.addEventListener('change', renderBuilder);
window.addEventListener('DOMContentLoaded', renderBuilder);

document.getElementById('save-admin-btn').addEventListener('click', () => {
    const blocks = document.querySelectorAll('.team-block');
    const teams = [];

    blocks.forEach((block) => {
        const name = block.querySelector('.t-name').value;
        const score = block.querySelector('.t-score').value;
        const rawPlayers = block.querySelector('.t-players').value;
        const players = rawPlayers.split(',').map(p => p.trim()).filter(p => p.length > 0);

        teams.push({ name, score, players });
    });

    const config = {
        mode: modeSelect.value,
        teamCount: countSelect.value,
        teams: teams
    };

    localStorage.setItem('quiz_config', JSON.stringify(config));
    alert('Konfiguration gespeichert! Zentrale aktualisiert sich.');
});