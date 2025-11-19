// Game Detail Page
let currentGameId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Get game ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentGameId = urlParams.get('id');

    if (!currentGameId) {
        alert('No game specified');
        window.location.href = 'index.html';
        return;
    }

    await loadGameData();
});

// Load all game data
async function loadGameData() {
    await Promise.all([
        loadGameHeader(),
        loadGameWeather(),
        loadGameInjuries(),
        loadGameInsights(),
        loadGameNarrative(),
        loadGameBoxScore(),
        loadGameContent()
    ]);
}

// Load game header
async function loadGameHeader() {
    const container = document.getElementById('gameHeader');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const game = await apiService.getGame(currentGameId);

        const gameDate = new Date(game.game_date);
        const isCompleted = game.completed || (game.home_score !== null && game.away_score !== null);

        container.innerHTML = `
            <div class="game-hero">
                <div class="game-date-info">
                    <span class="game-week-label">Week ${game.week}</span>
                    <span class="game-date-label">${gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    ${game.game_time && !isCompleted ? `<span class="game-time-label">${game.game_time}</span>` : ''}
                </div>

                <div class="game-matchup-display">
                    <div class="game-team ${isCompleted && game.away_score > game.home_score ? 'winner' : ''}">
                        <span class="team-logo-large">${getTeamLogo(game.away_team)}</span>
                        <div class="team-info-display">
                            <h2 class="team-name-display">${game.away_team}</h2>
                            ${isCompleted ? `<span class="team-score-display">${game.away_score}</span>` : ''}
                        </div>
                    </div>

                    <div class="vs-divider">${isCompleted ? 'FINAL' : 'VS'}</div>

                    <div class="game-team ${isCompleted && game.home_score > game.away_score ? 'winner' : ''}">
                        <span class="team-logo-large">${getTeamLogo(game.home_team)}</span>
                        <div class="team-info-display">
                            <h2 class="team-name-display">${game.home_team}</h2>
                            ${isCompleted ? `<span class="team-score-display">${game.home_score}</span>` : ''}
                        </div>
                    </div>
                </div>

                ${game.stadium ? `
                    <div class="game-venue">
                        <span class="venue-icon">🏟️</span>
                        <span class="venue-name">${game.stadium}</span>
                    </div>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Error loading game header:', error);
        container.innerHTML = `
            <div class="error-state">
                <span class="error-icon">⚠️</span>
                <h4>Unable to load game details</h4>
            </div>
        `;
    }
}

// Load game weather
async function loadGameWeather() {
    const container = document.getElementById('gameWeather');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const weather = await apiService.getGameWeather(currentGameId);

        if (!weather) {
            container.innerHTML = `<p class="empty-message">Weather data unavailable</p>`;
            return;
        }

        // Determine weather impact
        const impact = getWeatherImpact(weather);
        const weatherIcon = getWeatherIcon(weather.condition);

        container.innerHTML = `
            <div class="weather-card impact-${impact}">
                ${weather.is_dome ? `
                    <div class="weather-dome">Dome Stadium - Controlled Conditions</div>
                ` : ''}

                <div class="weather-main">
                    <span class="weather-icon">${weatherIcon}</span>
                    <div>
                        <div class="weather-temp">${weather.temperature}°${weather.temp_unit}</div>
                        <div class="weather-desc">${weather.condition}</div>
                    </div>
                </div>

                <div class="weather-details">
                    <div class="weather-detail-item">
                        <strong>${weather.wind_speed}</strong>
                        <span>${weather.wind_unit} Wind</span>
                    </div>
                    <div class="weather-detail-item">
                        <strong>${weather.humidity}%</strong>
                        <span>Humidity</span>
                    </div>
                    <div class="weather-detail-item">
                        <strong>${weather.precipitation_chance}%</strong>
                        <span>Precip Chance</span>
                    </div>
                </div>

                ${!weather.is_dome ? `
                    <div class="weather-impact">
                        ${impact === 'none' ? '✅ Ideal conditions for football' : ''}
                        ${impact === 'low' ? '⚠️ Minor weather impact expected' : ''}
                        ${impact === 'medium' ? '🌧️ Moderate weather impact - affects passing game' : ''}
                        ${impact === 'high' ? '❄️ Significant weather impact - low scoring likely' : ''}
                    </div>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Error loading weather:', error);
        container.innerHTML = `<p class="empty-message">Weather forecast unavailable</p>`;
    }
}

// Load game injuries
async function loadGameInjuries() {
    const container = document.getElementById('gameInjuries');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const injuries = await apiService.getGameInjuries(currentGameId);

        if (!injuries || (injuries.away_injuries.length === 0 && injuries.home_injuries.length === 0)) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">✅</span>
                    <p>No injury reports for this game</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="injuries-by-team">
                <div class="team-injuries-column">
                    <h3 class="team-injuries-header">
                        <span class="team-logo">${getTeamLogo(injuries.away_team)}</span>
                        ${injuries.away_team}
                    </h3>
                    ${injuries.away_injuries.length === 0 ?
                        `<p class="empty-message">No injuries reported</p>` :
                        `<div class="injuries-list">
                            ${injuries.away_injuries.map(injury => createInjuryItem(injury)).join('')}
                        </div>`
                    }
                </div>

                <div class="team-injuries-column">
                    <h3 class="team-injuries-header">
                        <span class="team-logo">${getTeamLogo(injuries.home_team)}</span>
                        ${injuries.home_team}
                    </h3>
                    ${injuries.home_injuries.length === 0 ?
                        `<p class="empty-message">No injuries reported</p>` :
                        `<div class="injuries-list">
                            ${injuries.home_injuries.map(injury => createInjuryItem(injury)).join('')}
                        </div>`
                    }
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading injuries:', error);
        container.innerHTML = `<p class="empty-message">Injury report unavailable</p>`;
    }
}

// Load game insights
async function loadGameInsights() {
    const container = document.getElementById('gameInsights');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const insights = await apiService.getGameInsights(currentGameId);

        if (!insights || insights.length === 0) {
            container.innerHTML = `<p class="empty-message">No insights available</p>`;
            return;
        }

        container.innerHTML = `
            <div class="insights-grid">
                ${insights.map(insight => `
                    <div class="insight-card">
                        <div class="insight-header">
                            <span class="insight-type">${insight.insight_type}</span>
                            ${insight.confidence ? `<span class="insight-confidence">${Math.round(insight.confidence * 100)}% confidence</span>` : ''}
                        </div>
                        <h4 class="insight-title">${insight.title}</h4>
                        <p class="insight-description">${insight.description}</p>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        console.error('Error loading insights:', error);
        container.innerHTML = `<p class="empty-message">Insights unavailable</p>`;
    }
}

// Load game narrative
async function loadGameNarrative() {
    const container = document.getElementById('gameNarrative');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const narratives = await apiService.getGameNarrative(currentGameId);

        if (!narratives || narratives.length === 0) {
            container.innerHTML = `<p class="empty-message">No narrative available</p>`;
            return;
        }

        container.innerHTML = `
            <div class="narratives-list">
                ${narratives.map(narrative => `
                    <div class="narrative-item">
                        <h4 class="narrative-type">${narrative.narrative_type}</h4>
                        <div class="narrative-content">${narrative.content}</div>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        console.error('Error loading narrative:', error);
        container.innerHTML = `<p class="empty-message">Narrative unavailable</p>`;
    }
}

// Load game box score (for completed games)
async function loadGameBoxScore() {
    const section = document.getElementById('boxScoreSection');
    const container = document.getElementById('gameBoxScore');
    if (!section || !container) return;

    try {
        const game = await apiService.getGame(currentGameId);
        const isCompleted = game.completed || (game.home_score !== null && game.away_score !== null);

        if (!isCompleted) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

        const boxScore = await apiService.getBoxScore(currentGameId);

        container.innerHTML = `
            <div class="box-score">
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
        container.innerHTML = `<p class="empty-message">Box score unavailable</p>`;
    }
}

// Load game content (videos, articles)
async function loadGameContent() {
    const container = document.getElementById('gameContent');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const content = await apiService.getGameContent(currentGameId, { limit: 6 });

        if (!content || content.length === 0) {
            container.innerHTML = `<p class="empty-message">No related content available</p>`;
            return;
        }

        container.innerHTML = `
            <div class="content-grid">
                ${content.map(item => `
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="content-card">
                        ${item.thumbnail_url ? `<img src="${item.thumbnail_url}" alt="${item.title}" class="content-thumbnail">` : ''}
                        <div class="content-info">
                            <span class="content-type-badge">${item.content_type}</span>
                            <h4 class="content-title">${item.title}</h4>
                            <div class="content-meta">
                                <span class="content-source">${item.source}</span>
                                <span class="content-date">${formatTimeAgo(item.published_at)}</span>
                            </div>
                        </div>
                    </a>
                `).join('')}
            </div>
        `;

    } catch (error) {
        console.error('Error loading content:', error);
        container.innerHTML = `<p class="empty-message">Related content unavailable</p>`;
    }
}

// Helper functions

function createInjuryItem(injury) {
    return `
        <div class="injury-compact-item">
            <div class="injury-compact-header">
                <span class="injury-player">${injury.player_name || 'Unknown Player'}</span>
                <span class="injury-status ${getInjuryStatusClass(injury.status)}">${injury.status || 'Unknown'}</span>
            </div>
            ${injury.description ? `<p class="injury-compact-desc">${injury.description}</p>` : ''}
        </div>
    `;
}

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

function createTeamStatsTable(teamStats) {
    if (!teamStats || !teamStats.away || !teamStats.home) {
        return `<p class="empty-message">Team stats unavailable</p>`;
    }

    const awayStats = teamStats.away;
    const homeStats = teamStats.home;

    const statCategories = [
        { key: 'total_yards', label: 'Total Yards' },
        { key: 'passing_yards', label: 'Passing Yards' },
        { key: 'rushing_yards', label: 'Rushing Yards' },
        { key: 'first_downs', label: 'First Downs' },
        { key: 'third_down_conversions', label: '3rd Down Conversions' },
        { key: 'fourth_down_conversions', label: '4th Down Conversions' },
        { key: 'turnovers', label: 'Turnovers' },
        { key: 'penalties', label: 'Penalties' },
        { key: 'time_of_possession', label: 'Time of Possession' }
    ];

    return `
        <table class="team-stats-table">
            <thead>
                <tr>
                    <th class="stat-away-header">${teamStats.away_team || 'Away'}</th>
                    <th class="stat-category-header">Stat</th>
                    <th class="stat-home-header">${teamStats.home_team || 'Home'}</th>
                </tr>
            </thead>
            <tbody>
                ${statCategories.map(stat => {
                    const awayValue = awayStats[stat.key] !== undefined ? awayStats[stat.key] : '-';
                    const homeValue = homeStats[stat.key] !== undefined ? homeStats[stat.key] : '-';

                    const awayIsBetter = stat.key === 'turnovers' || stat.key === 'penalties'
                        ? (awayValue !== '-' && homeValue !== '-' && awayValue < homeValue)
                        : (awayValue !== '-' && homeValue !== '-' && awayValue > homeValue);
                    const homeIsBetter = stat.key === 'turnovers' || stat.key === 'penalties'
                        ? (awayValue !== '-' && homeValue !== '-' && homeValue < awayValue)
                        : (awayValue !== '-' && homeValue !== '-' && homeValue > awayValue);

                    return `
                        <tr>
                            <td class="stat-value ${awayIsBetter ? 'stat-better' : ''}">${awayValue}</td>
                            <td class="stat-label">${stat.label}</td>
                            <td class="stat-value ${homeIsBetter ? 'stat-better' : ''}">${homeValue}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function getWeatherImpact(weather) {
    if (weather.is_dome) return 'none';

    let score = 0;

    // Wind impact
    if (weather.wind_speed > 20) score += 3;
    else if (weather.wind_speed > 15) score += 2;
    else if (weather.wind_speed > 10) score += 1;

    // Temperature impact
    if (weather.temperature < 20 || weather.temperature > 95) score += 2;
    else if (weather.temperature < 32 || weather.temperature > 85) score += 1;

    // Precipitation impact
    if (weather.precipitation_chance > 70) score += 2;
    else if (weather.precipitation_chance > 40) score += 1;

    if (score === 0) return 'none';
    if (score <= 2) return 'low';
    if (score <= 4) return 'medium';
    return 'high';
}

function getWeatherIcon(condition) {
    const conditionLower = (condition || '').toLowerCase();
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return '☀️';
    if (conditionLower.includes('cloud')) return '☁️';
    if (conditionLower.includes('rain')) return '🌧️';
    if (conditionLower.includes('snow')) return '❄️';
    if (conditionLower.includes('storm')) return '⛈️';
    if (conditionLower.includes('wind')) return '💨';
    return '🌤️';
}

function getInjuryStatusClass(status) {
    if (!status) return 'unknown';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('out')) return 'out';
    if (statusLower.includes('doubtful')) return 'doubtful';
    if (statusLower.includes('questionable')) return 'questionable';
    if (statusLower.includes('probable')) return 'probable';
    return 'unknown';
}

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
    if (!dateStr) return '';
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
