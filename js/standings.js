// Standings Page

const currentSeason = 2024;
const currentWeek = 12;

document.addEventListener('DOMContentLoaded', () => {
    loadStandings();
});

async function loadStandings() {
    try {
        const standings = await apiService.getStandings({ season: currentSeason, week: currentWeek });

        if (!standings || !standings.divisions || standings.divisions.length === 0) {
            showError();
            return;
        }

        // Separate AFC and NFC divisions
        const afcDivisions = standings.divisions.filter(d => d.conference === 'AFC');
        const nfcDivisions = standings.divisions.filter(d => d.conference === 'NFC');

        displayDivisions('afcDivisions', afcDivisions);
        displayDivisions('nfcDivisions', nfcDivisions);
        displayPlayoffPicture(standings);

    } catch (error) {
        console.error('Error loading standings:', error);
        showError();
    }
}

function displayDivisions(containerId, divisions) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = divisions.map(division => `
        <div class="division-card">
            <h3 class="division-title">${division.name}</h3>
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>W</th>
                        <th>L</th>
                        <th>T</th>
                        <th>PCT</th>
                        <th>PF</th>
                        <th>PA</th>
                        <th>DIFF</th>
                        <th>STRK</th>
                    </tr>
                </thead>
                <tbody>
                    ${division.teams.map((team, index) => `
                        <tr class="${index === 0 ? 'division-leader' : ''}">
                            <td class="team-cell">
                                <a href="team.html?id=${team.team_id}">${team.team_name || team.team_id}</a>
                                ${index === 0 ? '<span class="leader-badge">y</span>' : ''}
                            </td>
                            <td>${team.wins || 0}</td>
                            <td>${team.losses || 0}</td>
                            <td>${team.ties || 0}</td>
                            <td>${team.win_percentage ? team.win_percentage.toFixed(3) : '.000'}</td>
                            <td>${team.points_for || 0}</td>
                            <td>${team.points_against || 0}</td>
                            <td class="${(team.point_differential || 0) >= 0 ? 'positive' : 'negative'}">
                                ${(team.point_differential || 0) >= 0 ? '+' : ''}${team.point_differential || 0}
                            </td>
                            <td>${formatStreak(team.streak)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `).join('');
}

function displayPlayoffPicture(standings) {
    if (!standings.playoff_teams) return;

    const afcPlayoffs = standings.playoff_teams.filter(t => t.conference === 'AFC');
    const nfcPlayoffs = standings.playoff_teams.filter(t => t.conference === 'NFC');

    displayPlayoffTeams('afcPlayoffs', afcPlayoffs);
    displayPlayoffTeams('nfcPlayoffs', nfcPlayoffs);
}

function displayPlayoffTeams(containerId, teams) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!teams || teams.length === 0) {
        container.innerHTML = '<p class="empty-message">Playoff picture not available</p>';
        return;
    }

    container.innerHTML = `
        <div class="playoff-teams-list">
            ${teams.map((team, index) => `
                <div class="playoff-team-item ${team.seed <= 4 ? 'division-winner' : 'wildcard'}">
                    <span class="seed-number">${team.seed}</span>
                    <a href="team.html?id=${team.team_id}" class="playoff-team-name">
                        ${team.team_name || team.team_id}
                    </a>
                    <span class="team-record">${team.wins}-${team.losses}${team.ties > 0 ? `-${team.ties}` : ''}</span>
                    ${team.seed <= 4 ? '<span class="status-badge">Division</span>' : '<span class="status-badge wildcard-badge">Wild Card</span>'}
                </div>
            `).join('')}
        </div>
    `;
}

function formatStreak(streak) {
    if (!streak) return '-';
    return streak; // e.g., "W3", "L2"
}

function showError() {
    const afcContainer = document.getElementById('afcDivisions');
    const nfcContainer = document.getElementById('nfcDivisions');

    const errorHTML = '<p class="empty-message">Unable to load standings data</p>';

    if (afcContainer) afcContainer.innerHTML = errorHTML;
    if (nfcContainer) nfcContainer.innerHTML = errorHTML;
}
