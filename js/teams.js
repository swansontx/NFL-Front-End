// Teams Directory Page
let allTeams = [];
let currentFilter = { conference: 'all', division: 'all' };

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadTeams();
    setupEventListeners();
});

// Load teams from backend
async function loadTeams() {
    const container = document.getElementById('teamsGrid');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading teams...</p>
        </div>
    `;

    try {
        allTeams = await apiService.getTeams();

        if (!allTeams || allTeams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🏈</span>
                    <p>No teams available</p>
                    <small>Backend API unavailable</small>
                </div>
            `;
            return;
        }

        renderTeams();

    } catch (error) {
        console.error('Error loading teams:', error);
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p>Unable to load teams</p>
                <small>Backend API unavailable</small>
            </div>
        `;
    }
}

// Render teams based on current filter
function renderTeams() {
    const container = document.getElementById('teamsGrid');

    let filteredTeams = allTeams;

    // Filter by conference
    if (currentFilter.conference !== 'all') {
        filteredTeams = filteredTeams.filter(team =>
            team.conference === currentFilter.conference
        );
    }

    // Filter by division
    if (currentFilter.division !== 'all') {
        filteredTeams = filteredTeams.filter(team =>
            team.division === currentFilter.division
        );
    }

    // Sort by wins descending
    filteredTeams.sort((a, b) => {
        const aWins = a.wins || 0;
        const bWins = b.wins || 0;
        return bWins - aWins;
    });

    if (filteredTeams.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🏈</span>
                <p>No teams found for this filter</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredTeams.map(team => createTeamCard(team)).join('');
}

// Create team card HTML
function createTeamCard(team) {
    const wins = team.wins || 0;
    const losses = team.losses || 0;
    const ties = team.ties || 0;
    const record = `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`;

    const winPct = wins + losses + ties > 0
        ? (wins / (wins + losses + ties)).toFixed(3)
        : '.000';

    return `
        <a href="team.html?id=${team.team_id}" class="team-card">
            <div class="team-card-header">
                <div class="team-logo">${getTeamLogo(team.team_id)}</div>
                <div class="team-info">
                    <h3 class="team-name">${team.team_name}</h3>
                    <p class="team-location">${team.city || ''}</p>
                </div>
            </div>

            <div class="team-card-body">
                <div class="team-record">
                    <span class="record-value">${record}</span>
                    <span class="record-label">Record</span>
                </div>

                <div class="team-division">
                    <span class="division-name">${team.division || 'Unknown'}</span>
                    <span class="conference-badge ${team.conference}">${team.conference}</span>
                </div>
            </div>

            <div class="team-card-footer">
                <div class="team-stat">
                    <span class="stat-label">Win %</span>
                    <span class="stat-value">${winPct}</span>
                </div>
                <div class="team-stat">
                    <span class="stat-label">Off Rank</span>
                    <span class="stat-value">${team.offensive_rank || '-'}</span>
                </div>
                <div class="team-stat">
                    <span class="stat-label">Def Rank</span>
                    <span class="stat-value">${team.defensive_rank || '-'}</span>
                </div>
            </div>
        </a>
    `;
}

// Get team logo emoji (placeholder - can be replaced with actual logos)
function getTeamLogo(teamId) {
    const logos = {
        'KC': '🏆', 'BUF': '🦬', 'MIA': '🐬', 'NE': '🔵',
        'BAL': '🐦', 'CIN': '🐅', 'CLE': '🟤', 'PIT': '⚫',
        'JAX': '🐆', 'IND': '🐴', 'HOU': '🐂', 'TEN': '⚔️',
        'LAC': '⚡', 'LV': '🏴‍☠️', 'DEN': '🐴', 'KC': '👑',
        'PHI': '🦅', 'DAL': '⭐', 'NYG': '🗽', 'WAS': '🦅',
        'GB': '🧀', 'MIN': '⚔️', 'CHI': '🐻', 'DET': '🦁',
        'TB': '🏴‍☠️', 'NO': '⚜️', 'CAR': '🐆', 'ATL': '🦅',
        'SF': '⛏️', 'SEA': '🦅', 'LAR': '🐏', 'ARI': '🦅'
    };
    return logos[teamId] || '🏈';
}

// Setup event listeners
function setupEventListeners() {
    // Conference tabs
    const conferenceTabs = document.querySelectorAll('.conference-tab');
    conferenceTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active state
            conferenceTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update filter
            currentFilter.conference = tab.dataset.conference;
            currentFilter.division = 'all';

            // Update division filters visibility
            updateDivisionFilters();

            // Re-render teams
            renderTeams();
        });
    });

    // Division filters
    const divisionFilters = document.querySelectorAll('.division-filter');
    divisionFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Update active state
            divisionFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');

            // Update filter
            currentFilter.division = filter.dataset.division;

            // Re-render teams
            renderTeams();
        });
    });
}

// Update division filters based on conference
function updateDivisionFilters() {
    const divisionFilters = document.querySelectorAll('.division-filter');

    divisionFilters.forEach(filter => {
        const division = filter.dataset.division;

        if (division === 'all') {
            filter.style.display = 'block';
            filter.classList.add('active');
            return;
        }

        if (currentFilter.conference === 'all') {
            filter.style.display = 'block';
        } else if (currentFilter.conference === 'AFC') {
            filter.style.display = division.startsWith('AFC') ? 'block' : 'none';
        } else if (currentFilter.conference === 'NFC') {
            filter.style.display = division.startsWith('NFC') ? 'block' : 'none';
        }

        // Reset to 'all' if hidden
        if (filter.style.display === 'none' && filter.classList.contains('active')) {
            filter.classList.remove('active');
            document.querySelector('.division-filter[data-division="all"]').classList.add('active');
            currentFilter.division = 'all';
        }
    });
}
