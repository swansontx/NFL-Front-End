// Schedule Page - Focused on games grid with team stats

let currentDay = 0;
let currentWeek = 12;
let currentSeason = 2024;

// ESPN team URL mapping
const ESPN_TEAM_IDS = {
    'ARI': 'ari', 'ATL': 'atl', 'BAL': 'bal', 'BUF': 'buf',
    'CAR': 'car', 'CHI': 'chi', 'CIN': 'cin', 'CLE': 'cle',
    'DAL': 'dal', 'DEN': 'den', 'DET': 'det', 'GB': 'gb',
    'HOU': 'hou', 'IND': 'ind', 'JAX': 'jax', 'KC': 'kc',
    'LAC': 'lac', 'LAR': 'lar', 'LV': 'lv', 'MIA': 'mia',
    'MIN': 'min', 'NE': 'ne', 'NO': 'no', 'NYG': 'nyg',
    'NYJ': 'nyj', 'PHI': 'phi', 'PIT': 'pit', 'SEA': 'sea',
    'SF': 'sf', 'TB': 'tb', 'TEN': 'ten', 'WAS': 'wsh'
};

function getESPNTeamUrl(teamAbbr) {
    const espnId = ESPN_TEAM_IDS[teamAbbr] || teamAbbr.toLowerCase();
    return `https://www.espn.com/nfl/team/_/name/${espnId}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeDayTabs();
    loadGames(currentDay);
    setupEventListeners();
    updateWeekDisplay();
});

function updateWeekDisplay() {
    const display = document.getElementById('weekDisplay');
    if (display) {
        display.textContent = `Week ${currentWeek}`;
    }
}

function initializeDayTabs() {
    const dayTabs = document.getElementById('dayTabs');
    if (!dayTabs) return;

    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const tabs = dayTabs.querySelectorAll('.day-tab');
    tabs.forEach((tab, index) => {
        const date = new Date(today);
        date.setDate(date.getDate() + index);
        const dayName = days[date.getDay()];
        const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;

        if (index === 0) {
            tab.innerHTML = `Today<br><small>${monthDay}</small>`;
        } else if (index === 1) {
            tab.innerHTML = `Tomorrow<br><small>${monthDay}</small>`;
        } else {
            tab.innerHTML = `${dayName}<br><small>${monthDay}</small>`;
        }
    });
}

function setupEventListeners() {
    // Day tab navigation
    const dayTabs = document.querySelectorAll('.day-tab');
    dayTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            dayTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentDay = parseInt(this.getAttribute('data-day'));
            loadGames(currentDay);
        });
    });

    // Week navigation
    const prevWeek = document.getElementById('prevWeek');
    const nextWeek = document.getElementById('nextWeek');

    if (prevWeek) {
        prevWeek.addEventListener('click', () => navigateWeek(-1));
    }
    if (nextWeek) {
        nextWeek.addEventListener('click', () => navigateWeek(1));
    }
}

function navigateWeek(direction) {
    currentWeek += direction;
    if (currentWeek < 1) currentWeek = 1;
    if (currentWeek > 18) currentWeek = 18;
    updateWeekDisplay();
    loadGames(0);
}

// Load games from backend
async function loadGames(dayOffset) {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) return;

    gamesGrid.innerHTML = `
        <div class="loading-state" style="grid-column: 1 / -1;">
            <div class="spinner"></div>
            <p>Loading games...</p>
        </div>
    `;

    try {
        const response = await apiService.getGames({
            season: currentSeason,
            week: currentWeek,
            upcoming: true
        });

        const games = response.games || [];

        if (games.length === 0) {
            gamesGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <h3>No games scheduled</h3>
                    <p>Check another week for upcoming games</p>
                </div>
            `;
            return;
        }

        // Fetch team stats for each unique team
        const teamStats = await loadTeamStats(games);

        // Render game cards
        gamesGrid.innerHTML = games.map(game => createGameCard(game, teamStats)).join('');

        // Add click handlers
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', function(e) {
                // Don't navigate if clicking on team link
                if (e.target.closest('.team-link')) return;

                const gameId = this.getAttribute('data-game-id');
                window.location.href = `game.html?id=${gameId}`;
            });
        });

    } catch (error) {
        console.error('Error loading games:', error);
        gamesGrid.innerHTML = `
            <div class="error-state" style="grid-column: 1 / -1;">
                <h3>Unable to load games</h3>
                <p>Please ensure the backend is running at localhost:8000</p>
                <p class="error-detail">${error.message}</p>
            </div>
        `;
    }
}

// Load team stats for all teams in games
async function loadTeamStats(games) {
    const teamStats = {};
    const uniqueTeams = new Set();

    games.forEach(game => {
        uniqueTeams.add(game.home_team);
        uniqueTeams.add(game.away_team);
    });

    // Fetch stats for each team (in parallel)
    const statsPromises = Array.from(uniqueTeams).map(async (teamId) => {
        try {
            const stats = await apiService.getTeamStats(teamId, currentSeason);
            teamStats[teamId] = stats;
        } catch (error) {
            console.warn(`Could not load stats for ${teamId}:`, error);
            teamStats[teamId] = null;
        }
    });

    await Promise.all(statsPromises);
    return teamStats;
}

function createGameCard(game, teamStats) {
    const homeStats = teamStats[game.home_team];
    const awayStats = teamStats[game.away_team];

    const homeRecord = homeStats ? `${homeStats.wins || 0}-${homeStats.losses || 0}` : '';
    const awayRecord = awayStats ? `${awayStats.wins || 0}-${awayStats.losses || 0}` : '';

    const gameTime = formatTime(game.game_time || '13:00');

    return `
        <div class="game-card" data-game-id="${game.game_id}">
            <div class="game-time">${gameTime}</div>
            <div class="game-matchup">
                <div class="team">
                    <a href="${getESPNTeamUrl(game.away_team)}" target="_blank" rel="noopener" class="team-link" title="View on ESPN">
                        <span class="team-name">${game.away_team}</span>
                    </a>
                    <span class="team-record">${awayRecord}</span>
                </div>
                <div class="at">@</div>
                <div class="team">
                    <a href="${getESPNTeamUrl(game.home_team)}" target="_blank" rel="noopener" class="team-link" title="View on ESPN">
                        <span class="team-name">${game.home_team}</span>
                    </a>
                    <span class="team-record">${homeRecord}</span>
                </div>
            </div>
            <div class="game-card-footer">
                <span class="view-matchup">View Matchup →</span>
            </div>
        </div>
    `;
}

function formatTime(time) {
    if (!time) return 'TBD';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minutes} ${ampm} ET`;
}
