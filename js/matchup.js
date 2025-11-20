// Matchup Page - Game details with top props, weather, injuries

let currentGameId = null;

// ESPN player URL helper
function getESPNPlayerUrl(playerName) {
    const searchName = encodeURIComponent(playerName);
    return `https://www.espn.com/nfl/players/_/search/${searchName}`;
}

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
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentGameId = urlParams.get('id');

    if (!currentGameId) {
        alert('No game specified');
        window.location.href = 'index.html';
        return;
    }

    await loadMatchupData();
});

// Load all matchup data
async function loadMatchupData() {
    await Promise.all([
        loadGameHeader(),
        loadWeather(),
        loadInjuries(),
        loadTopProps()
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

        container.innerHTML = `
            <div class="game-hero">
                <div class="game-date-info">
                    <span class="game-week-label">Week ${game.week}</span>
                    <span class="game-date-label">${gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    ${game.game_time ? `<span class="game-time-label">${formatTime(game.game_time)}</span>` : ''}
                </div>

                <div class="game-matchup-display">
                    <div class="game-team">
                        <a href="${getESPNTeamUrl(game.away_team)}" target="_blank" rel="noopener" class="team-logo-link">
                            <span class="team-logo-large">${getTeamEmoji(game.away_team)}</span>
                        </a>
                        <div class="team-info-display">
                            <h2 class="team-name-display">
                                <a href="${getESPNTeamUrl(game.away_team)}" target="_blank" rel="noopener">${game.away_team}</a>
                            </h2>
                        </div>
                    </div>

                    <div class="vs-divider">@</div>

                    <div class="game-team">
                        <a href="${getESPNTeamUrl(game.home_team)}" target="_blank" rel="noopener" class="team-logo-link">
                            <span class="team-logo-large">${getTeamEmoji(game.home_team)}</span>
                        </a>
                        <div class="team-info-display">
                            <h2 class="team-name-display">
                                <a href="${getESPNTeamUrl(game.home_team)}" target="_blank" rel="noopener">${game.home_team}</a>
                            </h2>
                        </div>
                    </div>
                </div>

                ${game.stadium ? `
                    <div class="game-venue">
                        <span class="venue-name">${game.stadium}</span>
                    </div>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Error loading game header:', error);
        container.innerHTML = `
            <div class="error-state">
                <h4>Unable to load game details</h4>
            </div>
        `;
    }
}

// Load weather
async function loadWeather() {
    const container = document.getElementById('gameWeather');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const weather = await apiService.getGameWeather(currentGameId);

        if (!weather) {
            container.innerHTML = `<p class="empty-message">Weather unavailable</p>`;
            return;
        }

        const impact = getWeatherImpact(weather);
        const icon = getWeatherIcon(weather.condition);

        container.innerHTML = `
            <div class="weather-compact impact-${impact}">
                ${weather.is_dome ? `
                    <div class="weather-dome-badge">Dome</div>
                ` : ''}
                <div class="weather-main">
                    <span class="weather-icon">${icon}</span>
                    <span class="weather-temp">${weather.temperature}°${weather.temp_unit}</span>
                </div>
                <div class="weather-details-compact">
                    <span>Wind: ${weather.wind_speed} ${weather.wind_unit}</span>
                    <span>Precip: ${weather.precipitation_chance}%</span>
                </div>
                ${!weather.is_dome && impact !== 'none' ? `
                    <div class="weather-impact-note">
                        ${impact === 'high' ? '⚠️ High weather impact' : ''}
                        ${impact === 'medium' ? '⚠️ Moderate impact' : ''}
                        ${impact === 'low' ? 'Minor impact' : ''}
                    </div>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Error loading weather:', error);
        container.innerHTML = `<p class="empty-message">Weather unavailable</p>`;
    }
}

// Load injuries
async function loadInjuries() {
    const container = document.getElementById('gameInjuries');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const injuries = await apiService.getGameInjuries(currentGameId);

        if (!injuries || (injuries.away_injuries.length === 0 && injuries.home_injuries.length === 0)) {
            container.innerHTML = `<p class="empty-message">No injuries reported</p>`;
            return;
        }

        const allInjuries = [
            ...injuries.away_injuries.map(i => ({ ...i, team: injuries.away_team })),
            ...injuries.home_injuries.map(i => ({ ...i, team: injuries.home_team }))
        ];

        // Sort by severity (Out > Doubtful > Questionable > Probable)
        const severity = { 'out': 0, 'doubtful': 1, 'questionable': 2, 'probable': 3 };
        allInjuries.sort((a, b) => {
            const aS = severity[(a.status || '').toLowerCase()] ?? 4;
            const bS = severity[(b.status || '').toLowerCase()] ?? 4;
            return aS - bS;
        });

        container.innerHTML = `
            <div class="injuries-compact">
                ${allInjuries.slice(0, 8).map(injury => `
                    <div class="injury-item-compact">
                        <a href="${getESPNPlayerUrl(injury.player_name)}" target="_blank" rel="noopener" class="injury-player-link">
                            ${injury.player_name}
                        </a>
                        <span class="injury-team-badge">${injury.team}</span>
                        <span class="injury-status-badge status-${(injury.status || '').toLowerCase()}">${injury.status || 'Unknown'}</span>
                    </div>
                `).join('')}
                ${allInjuries.length > 8 ? `<p class="more-injuries">+${allInjuries.length - 8} more</p>` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Error loading injuries:', error);
        container.innerHTML = `<p class="empty-message">Injuries unavailable</p>`;
    }
}

// Load top 12 props
async function loadTopProps() {
    const container = document.getElementById('gameTopProps');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const projections = await apiService.getGameProjections(currentGameId, { limit: 50 });

        if (!projections || !projections.projections || projections.projections.length === 0) {
            container.innerHTML = `<p class="empty-message">No props available for this game</p>`;
            return;
        }

        // Sort by confidence and take top 12
        const topProps = projections.projections
            .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
            .slice(0, 12);

        container.innerHTML = `
            <div class="top-props-grid">
                ${topProps.map((prop, index) => `
                    <div class="prop-card-compact">
                        <div class="prop-rank">#${index + 1}</div>
                        <div class="prop-info">
                            <a href="${getESPNPlayerUrl(prop.player_name)}" target="_blank" rel="noopener" class="prop-player-name">
                                ${prop.player_name}
                            </a>
                            <span class="prop-team-pos">${prop.team} • ${prop.position}</span>
                        </div>
                        <div class="prop-details">
                            <span class="prop-market">${formatMarketName(prop.market)}</span>
                            <span class="prop-line">${prop.mu ? prop.mu.toFixed(1) : 'N/A'}</span>
                        </div>
                        ${prop.confidence ? `
                            <div class="prop-confidence confidence-${getConfidenceLevel(prop.confidence)}">
                                ${Math.round(prop.confidence * 100)}%
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        console.error('Error loading top props:', error);
        container.innerHTML = `<p class="empty-message">Props unavailable</p>`;
    }
}

// Helper functions
function formatTime(time) {
    if (!time) return 'TBD';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minutes} ${ampm} ET`;
}

function formatMarketName(market) {
    if (!market) return 'Unknown';
    return market
        .replace('player_', '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

function getConfidenceLevel(confidence) {
    if (confidence >= 0.75) return 'high';
    if (confidence >= 0.60) return 'medium';
    return 'low';
}

function getWeatherImpact(weather) {
    if (weather.is_dome) return 'none';
    let score = 0;
    if (weather.wind_speed > 20) score += 3;
    else if (weather.wind_speed > 15) score += 2;
    else if (weather.wind_speed > 10) score += 1;
    if (weather.temperature < 20 || weather.temperature > 95) score += 2;
    else if (weather.temperature < 32 || weather.temperature > 85) score += 1;
    if (weather.precipitation_chance > 70) score += 2;
    else if (weather.precipitation_chance > 40) score += 1;
    if (score === 0) return 'none';
    if (score <= 2) return 'low';
    if (score <= 4) return 'medium';
    return 'high';
}

function getWeatherIcon(condition) {
    const c = (condition || '').toLowerCase();
    if (c.includes('clear') || c.includes('sunny')) return '☀️';
    if (c.includes('cloud')) return '☁️';
    if (c.includes('rain')) return '🌧️';
    if (c.includes('snow')) return '❄️';
    if (c.includes('storm')) return '⛈️';
    return '🌤️';
}

function getTeamEmoji(teamId) {
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
