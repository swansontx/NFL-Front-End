// Individual Team Page
let currentTeamId = null;
let currentSeason = 2024;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Get team ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentTeamId = urlParams.get('id');

    if (!currentTeamId) {
        alert('No team specified');
        window.location.href = 'teams.html';
        return;
    }

    await loadTeamData();
    setupEventListeners();
});

// Load all team data
async function loadTeamData() {
    await Promise.all([
        loadTeamHeader(),
        loadTeamStats(),
        loadTeamNews(),
        loadTeamSchedule()
    ]);
}

// Load team header
async function loadTeamHeader() {
    const container = document.getElementById('teamHeader');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
        </div>
    `;

    try {
        const team = await apiService.getTeamDetails(currentTeamId);

        const wins = team.wins || 0;
        const losses = team.losses || 0;
        const ties = team.ties || 0;
        const record = `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`;

        container.innerHTML = `
            <div class="team-hero">
                <div class="team-hero-logo">${getTeamLogo(currentTeamId)}</div>
                <div class="team-hero-info">
                    <h1 class="team-hero-name">${team.team_name}</h1>
                    <div class="team-hero-meta">
                        <span class="team-record">${record}</span>
                        <span class="team-division">${team.conference} ${team.division}</span>
                        ${team.playoff_seed ? `<span class="playoff-seed">#${team.playoff_seed} Seed</span>` : ''}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading team header:', error);
        container.innerHTML = `
            <div class="error-state">
                <span class="error-icon">⚠️</span>
                <h4>Unable to load team details</h4>
            </div>
        `;
    }
}

// Load team stats
async function loadTeamStats() {
    const container = document.getElementById('teamStatsWidget');
    const rankingsContainer = document.getElementById('teamRankings');

    if (!container || !rankingsContainer) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
    rankingsContainer.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const stats = await apiService.getTeamStats(currentTeamId, currentSeason);

        // Offensive stats
        const offStats = stats.offensive_stats || {};
        const defStats = stats.defensive_stats || {};

        container.innerHTML = `
            <div class="stat-group">
                <h4>Offense</h4>
                <div class="stat-item">
                    <span class="stat-label">Points/Game</span>
                    <span class="stat-value">${offStats.points_per_game?.toFixed(1) || '-'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Yards/Game</span>
                    <span class="stat-value">${offStats.yards_per_game?.toFixed(1) || '-'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Pass Yards/Game</span>
                    <span class="stat-value">${offStats.pass_yards_per_game?.toFixed(1) || '-'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Rush Yards/Game</span>
                    <span class="stat-value">${offStats.rush_yards_per_game?.toFixed(1) || '-'}</span>
                </div>
            </div>

            <div class="stat-group">
                <h4>Defense</h4>
                <div class="stat-item">
                    <span class="stat-label">Points Allowed/Game</span>
                    <span class="stat-value">${defStats.points_allowed_per_game?.toFixed(1) || '-'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Yards Allowed/Game</span>
                    <span class="stat-value">${defStats.yards_allowed_per_game?.toFixed(1) || '-'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Sacks</span>
                    <span class="stat-value">${defStats.sacks || '-'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Turnovers Forced</span>
                    <span class="stat-value">${defStats.turnovers_forced || '-'}</span>
                </div>
            </div>
        `;

        // Rankings
        const rankings = stats.rankings || {};
        rankingsContainer.innerHTML = `
            <div class="ranking-item">
                <span class="ranking-label">Offense</span>
                <span class="ranking-value">#${rankings.offensive_rank || '-'}</span>
            </div>
            <div class="ranking-item">
                <span class="ranking-label">Defense</span>
                <span class="ranking-value">#${rankings.defensive_rank || '-'}</span>
            </div>
            <div class="ranking-item">
                <span class="ranking-label">Scoring</span>
                <span class="ranking-value">#${rankings.scoring_rank || '-'}</span>
            </div>
            <div class="ranking-item">
                <span class="ranking-label">Pass Offense</span>
                <span class="ranking-value">#${rankings.pass_offense_rank || '-'}</span>
            </div>
            <div class="ranking-item">
                <span class="ranking-label">Rush Offense</span>
                <span class="ranking-value">#${rankings.rush_offense_rank || '-'}</span>
            </div>
            <div class="ranking-item">
                <span class="ranking-label">Pass Defense</span>
                <span class="ranking-value">#${rankings.pass_defense_rank || '-'}</span>
            </div>
        `;

    } catch (error) {
        console.error('Error loading team stats:', error);
        container.innerHTML = `<p class="empty-message">Stats unavailable</p>`;
        rankingsContainer.innerHTML = `<p class="empty-message">Rankings unavailable</p>`;
    }
}

// Load team news
async function loadTeamNews() {
    const container = document.getElementById('teamNews');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const news = await apiService.getNews({
            team: currentTeamId,
            limit: 5
        });

        if (!news || news.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📰</span>
                    <p>No recent news</p>
                </div>
            `;
            return;
        }

        container.innerHTML = news.map(item => `
            <div class="news-item-card">
                <div class="news-item-header">
                    <span class="news-category ${item.category}">${item.category || 'News'}</span>
                    <span class="news-time">${formatTimeAgo(item.published_at)}</span>
                </div>
                <h4 class="news-title">${item.title}</h4>
                <p class="news-excerpt">${item.description || ''}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading team news:', error);
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📰</span>
                <p>Unable to load news</p>
            </div>
        `;
    }
}

// Load team schedule
async function loadTeamSchedule() {
    const container = document.getElementById('teamSchedule');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const schedule = await apiService.getTeamSchedule(currentTeamId, currentSeason);

        if (!schedule.games || schedule.games.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📅</span>
                    <p>No games found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="schedule-list">
                ${schedule.games.map(game => createGameRow(game)).join('')}
            </div>
        `;

    } catch (error) {
        console.error('Error loading schedule:', error);
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📅</span>
                <p>Unable to load schedule</p>
            </div>
        `;
    }
}

// Create game row HTML
function createGameRow(game) {
    const isComplete = game.completed;
    const isHome = game.home_team === currentTeamId;
    const opponent = isHome ? game.away_team : game.home_team;
    const gameDate = new Date(game.game_date);

    let resultHTML = '';
    if (isComplete) {
        const teamScore = isHome ? game.home_score : game.away_score;
        const oppScore = isHome ? game.away_score : game.home_score;
        const won = teamScore > oppScore;

        resultHTML = `
            <div class="game-result ${won ? 'win' : 'loss'}">
                <span class="result-label">${won ? 'W' : 'L'}</span>
                <span class="game-score">${teamScore}-${oppScore}</span>
                <button class="box-score-btn" onclick="showBoxScore('${game.game_id}')">
                    Box Score
                </button>
            </div>
        `;
    } else {
        resultHTML = `
            <div class="game-upcoming">
                <span class="game-time">${game.game_time || 'TBD'}</span>
                ${game.spread ? `<span class="game-spread">${game.spread > 0 ? '+' : ''}${game.spread}</span>` : ''}
            </div>
        `;
    }

    return `
        <div class="schedule-game-row ${isComplete ? 'completed' : 'upcoming'}">
            <div class="game-week">
                Week ${game.week}
            </div>
            <div class="game-date">
                ${gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div class="game-matchup">
                <span class="home-indicator">${isHome ? 'vs' : '@'}</span>
                <span class="opponent-name">${opponent}</span>
            </div>
            ${resultHTML}
        </div>
    `;
}

// Show box score modal
async function showBoxScore(gameId) {
    const modal = document.getElementById('boxScoreModal');
    const content = document.getElementById('boxScoreContent');

    modal.style.display = 'block';
    content.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading box score...</p></div>`;

    try {
        const boxScore = await apiService.getBoxScore(gameId);

        content.innerHTML = `
            <div class="box-score">
                <div class="box-score-header">
                    <div class="box-score-team">
                        <span class="team-logo">${getTeamLogo(boxScore.away_team)}</span>
                        <span class="team-name">${boxScore.away_team}</span>
                        <span class="team-score">${boxScore.away_score}</span>
                    </div>
                    <div class="box-score-team">
                        <span class="team-logo">${getTeamLogo(boxScore.home_team)}</span>
                        <span class="team-name">${boxScore.home_team}</span>
                        <span class="team-score">${boxScore.home_score}</span>
                    </div>
                </div>

                ${boxScore.quarter_scores && boxScore.quarter_scores.length > 0 ? `
                    <div class="quarter-scores">
                        <table>
                            <thead>
                                <tr>
                                    <th>Team</th>
                                    <th>Q1</th>
                                    <th>Q2</th>
                                    <th>Q3</th>
                                    <th>Q4</th>
                                    ${boxScore.quarter_scores[0]?.ot ? '<th>OT</th>' : ''}
                                    <th>Final</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${createQuarterScoreRows(boxScore)}
                            </tbody>
                        </table>
                    </div>
                ` : ''}

                ${boxScore.team_stats ? `
                    <div class="box-score-stats">
                        <h3>Team Stats</h3>
                        ${createTeamStatsTable(boxScore.team_stats)}
                    </div>
                ` : ''}

                ${boxScore.top_performers && boxScore.top_performers.length > 0 ? `
                    <div class="top-performers">
                        <h3>Top Performers</h3>
                        ${boxScore.top_performers.map(p => `
                            <div class="performer">
                                <span class="performer-name">${p.player_name}</span>
                                <span class="performer-stats">${p.stats}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Error loading box score:', error);
        content.innerHTML = `
            <div class="error-state">
                <span class="error-icon">⚠️</span>
                <h4>Unable to load box score</h4>
                <p>Backend API unavailable</p>
            </div>
        `;
    }
}

// Create quarter score rows
function createQuarterScoreRows(boxScore) {
    const awayScores = boxScore.quarter_scores.find(q => q.team === boxScore.away_team) || {};
    const homeScores = boxScore.quarter_scores.find(q => q.team === boxScore.home_team) || {};

    return `
        <tr>
            <td>${boxScore.away_team}</td>
            <td>${awayScores.q1 || 0}</td>
            <td>${awayScores.q2 || 0}</td>
            <td>${awayScores.q3 || 0}</td>
            <td>${awayScores.q4 || 0}</td>
            ${awayScores.ot ? `<td>${awayScores.ot}</td>` : ''}
            <td><strong>${boxScore.away_score}</strong></td>
        </tr>
        <tr>
            <td>${boxScore.home_team}</td>
            <td>${homeScores.q1 || 0}</td>
            <td>${homeScores.q2 || 0}</td>
            <td>${homeScores.q3 || 0}</td>
            <td>${homeScores.q4 || 0}</td>
            ${homeScores.ot ? `<td>${homeScores.ot}</td>` : ''}
            <td><strong>${boxScore.home_score}</strong></td>
        </tr>
    `;
}

// Create team stats table
function createTeamStatsTable(teamStats) {
    const categories = ['Total Yards', 'Passing Yards', 'Rushing Yards', 'Turnovers', 'Time of Possession'];
    // This is a placeholder - actual implementation depends on backend data structure
    return `<p class="empty-message">Team stats breakdown coming soon</p>`;
}

// Setup event listeners
function setupEventListeners() {
    // Season filter
    const seasonFilter = document.getElementById('seasonFilter');
    if (seasonFilter) {
        seasonFilter.addEventListener('change', (e) => {
            currentSeason = parseInt(e.target.value);
            loadTeamSchedule();
            loadTeamStats();
        });
    }

    // Modal close
    const closeModal = document.getElementById('closeModal');
    const modal = document.getElementById('boxScoreModal');

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Utility functions
function getTeamLogo(teamId) {
    const logos = {
        'KC': '👑', 'BUF': '🦬', 'MIA': '🐬', 'NE': '🔵',
        'BAL': '🐦', 'CIN': '🐅', 'CLE': '🟤', 'PIT': '⚫',
        'JAX': '🐆', 'IND': '🐴', 'HOU': '🐂', 'TEN': '⚔️',
        'LAC': '⚡', 'LV': '🏴‍☠️', 'DEN': '🐴',
        'PHI': '🦅', 'DAL': '⭐', 'NYG': '🗽', 'WAS': '🦅',
        'GB': '🧀', 'MIN': '⚔️', 'CHI': '🐻', 'DET': '🦁',
        'TB': '🏴‍☠️', 'NO': '⚜️', 'CAR': '🐆', 'ATL': '🦅',
        'SF': '⛏️', 'SEA': '🦅', 'LAR': '🐏', 'ARI': '🦅'
    };
    return logos[teamId] || '🏈';
}

function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}
