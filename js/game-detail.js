// Game detail page functionality

let currentGameId = null;
let allPlayerProps = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    // Get game ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentGameId = urlParams.get('id');

    if (!currentGameId) {
        window.location.href = 'index.html';
        return;
    }

    loadGameDetails();
    setupEventListeners();
});

function setupEventListeners() {
    // Filter buttons for player props
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            currentFilter = this.getAttribute('data-filter');
            filterPlayerProps();
        });
    });

    // Sort controls
    const propSort = document.getElementById('propSort');
    if (propSort) {
        propSort.addEventListener('change', function() {
            sortPlayerProps(this.value);
        });
    }

    const marketSort = document.getElementById('marketSort');
    if (marketSort) {
        marketSort.addEventListener('change', function() {
            sortMarkets(this.value);
        });
    }
}

// Load game details from backend API
async function loadGameDetails() {
    // First try to load game info from backend
    let game = null;
    try {
        const gameResponse = await apiService.getGame(currentGameId);
        game = convertBackendGameToFrontend(gameResponse);
    } catch (error) {
        console.error('Error loading game from backend:', error);
        // Show error and redirect
        alert('Unable to load game details. Backend API is not available.');
        window.location.href = 'index.html';
        return;
    }

    // Load game header
    loadGameHeader(game);

    // Load weather conditions
    loadWeather(game);

    // Load injury report
    loadInjuryReport(game);

    // Load game insights
    loadGameInsights(game);

    // Load related content
    loadRelatedContent(game);

    // Load top props and parlays
    loadTopPropsAndParlays(game);

    // Load betting markets
    loadGameLines(game);

    // Load player props from backend
    await loadPlayerPropsFromBackend();

    // Load team props
    loadTeamProps(currentGameId);
}

// Convert backend game format to frontend format
function convertBackendGameToFrontend(backendGame) {
    return {
        id: backendGame.game_id,
        homeTeam: backendGame.home_team,
        awayTeam: backendGame.away_team,
        homeRecord: '8-2', // Would come from team stats
        awayRecord: '9-1', // Would come from team stats
        date: backendGame.game_date,
        time: backendGame.game_time || '13:00',
        status: backendGame.completed ? 'Final' : 'Upcoming',
        spread: {
            home: -3.5,
            away: 3.5
        },
        moneyline: {
            home: -180,
            away: +150
        },
        total: {
            over: 54.5,
            under: 54.5
        },
        overOdds: -110,
        underOdds: -110
    };
}

// Load player props from backend API
async function loadPlayerPropsFromBackend() {
    const playerPropsBody = document.getElementById('playerPropsBody');
    if (!playerPropsBody) return;

    // Show loading state
    playerPropsBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                Loading player props...
            </td>
        </tr>
    `;

    try {
        // Get projections from backend
        const response = await apiService.getGameProjections(currentGameId, {
            limit: 50
        });

        if (!response.projections || response.projections.length === 0) {
            throw new Error('No projections available');
        }

        // Convert backend projections to frontend prop format
        allPlayerProps = response.projections.map(proj => convertProjectionToProp(proj));

        // Load the props
        loadPlayerProps(allPlayerProps);

    } catch (error) {
        console.error('Error loading props from backend:', error);

        // Show error state
        playerPropsBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <h4>Unable to load player props</h4>
                    <p>Backend API is not available.</p>
                </td>
            </tr>
        `;
    }
}

// Convert backend projection to frontend prop format
function convertProjectionToProp(projection) {
    // Determine category from market
    let category = 'all';
    if (projection.market.includes('passing')) category = 'passing';
    else if (projection.market.includes('rushing')) category = 'rushing';
    else if (projection.market.includes('receiving') || projection.market.includes('rec')) category = 'receiving';
    else if (projection.market.includes('defense') || projection.market.includes('tackle')) category = 'defensive';

    // Map confidence to rating
    const rating = mapConfidenceToRating(projection.confidence);
    const ratingText = rating.charAt(0).toUpperCase() + rating.slice(1);

    // Format prop type
    const propType = formatMarketToPropType(projection.market);

    // Calculate odds (simplified - would come from market odds if available)
    const overOdds = -110;
    const underOdds = -110;

    return {
        player: projection.player_name,
        team: projection.team,
        propType: propType,
        category: category,
        line: projection.mu.toFixed(1),
        overOdds: overOdds,
        underOdds: underOdds,
        rating: rating,
        ratingText: ratingText
    };
}

function formatMarketToPropType(market) {
    // Convert player_passing_yds to "Passing Yards"
    const parts = market.replace('player_', '').split('_');
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function mapConfidenceToRating(confidence) {
    if (confidence >= 0.8) return 'excellent';
    if (confidence >= 0.7) return 'good';
    if (confidence >= 0.6) return 'moderate';
    if (confidence >= 0.4) return 'poor';
    return 'avoid';
}

function loadGameHeader(game) {
    const gameHeader = document.getElementById('gameHeader');
    if (!gameHeader) return;

    const homeSpread = game.spread.home > 0 ? `+${game.spread.home}` : game.spread.home;

    gameHeader.innerHTML = `
        <div class="game-matchup">
            <div class="team-detail">
                <h2>${game.awayTeam}</h2>
                <p>${game.awayRecord}</p>
            </div>
            <div class="vs-separator">@</div>
            <div class="team-detail">
                <h2>${game.homeTeam}</h2>
                <p>${game.homeRecord}</p>
            </div>
        </div>
        <div class="game-info">
            <span>${formatGameDate(game.date)}</span>
            <span>${formatTime(game.time)}</span>
            <span>Spread: ${homeSpread}</span>
            <span>Total: ${game.total.over}</span>
        </div>
    `;
}

function loadGameLines(game) {
    const gameLinesContainer = document.getElementById('gameLines');
    if (!gameLinesContainer) return;

    const markets = [
        {
            label: 'Point Spread',
            home: `${game.homeTeam} ${game.spread.home > 0 ? '+' : ''}${game.spread.home}`,
            away: `${game.awayTeam} ${game.spread.away > 0 ? '+' : ''}${game.spread.away}`,
            odds: '-110',
            rating: 'good'
        },
        {
            label: 'Moneyline',
            home: `${game.homeTeam} ${formatOdds(game.moneyline.home)}`,
            away: `${game.awayTeam} ${formatOdds(game.moneyline.away)}`,
            odds: '',
            rating: 'moderate'
        },
        {
            label: 'Total Points',
            home: `Over ${game.total.over}`,
            away: `Under ${game.total.under}`,
            odds: `${formatOdds(game.overOdds)} / ${formatOdds(game.underOdds)}`,
            rating: 'excellent'
        }
    ];

    gameLinesContainer.innerHTML = markets.map(market => `
        <div class="prop-card">
            <div class="prop-label">${market.label}</div>
            <div class="prop-value" style="font-size: 1rem; margin-bottom: 0.25rem;">
                ${market.home}
            </div>
            <div class="prop-value" style="font-size: 1rem; margin-bottom: 0.5rem;">
                ${market.away}
            </div>
            ${market.odds ? `<div class="prop-odds">${market.odds}</div>` : ''}
            <div style="margin-top: 0.5rem;">
                <span class="rating-badge ${getRatingClass(market.rating)}">
                    ${market.rating.charAt(0).toUpperCase() + market.rating.slice(1)}
                </span>
            </div>
        </div>
    `).join('');
}

function loadPlayerProps(props) {
    const playerPropsBody = document.getElementById('playerPropsBody');
    if (!playerPropsBody) return;

    if (props.length === 0) {
        playerPropsBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No player props available for this game
                </td>
            </tr>
        `;
        return;
    }

    playerPropsBody.innerHTML = props.map(prop => `
        <tr>
            <td>
                <div class="player-name">${prop.player}</div>
                <div class="player-team">${prop.team}</div>
            </td>
            <td class="prop-type">${prop.propType}</td>
            <td><strong>${prop.line}</strong></td>
            <td class="odds-value ${prop.overOdds > 0 ? 'positive' : ''}">${formatOdds(prop.overOdds)}</td>
            <td class="odds-value ${prop.underOdds > 0 ? 'positive' : ''}">${formatOdds(prop.underOdds)}</td>
            <td>
                <span class="rating-badge ${getRatingClass(prop.rating)}">
                    ${prop.ratingText}
                </span>
            </td>
        </tr>
    `).join('');
}

function filterPlayerProps() {
    let filteredProps = allPlayerProps;

    if (currentFilter !== 'all') {
        filteredProps = allPlayerProps.filter(prop => prop.category === currentFilter);
    }

    loadPlayerProps(filteredProps);
}

function sortPlayerProps(sortBy) {
    let sortedProps = [...allPlayerProps];

    if (currentFilter !== 'all') {
        sortedProps = sortedProps.filter(prop => prop.category === currentFilter);
    }

    switch(sortBy) {
        case 'rating':
            const ratingOrder = { 'excellent': 1, 'good': 2, 'moderate': 3, 'poor': 4, 'avoid': 5 };
            sortedProps.sort((a, b) => ratingOrder[a.rating] - ratingOrder[b.rating]);
            break;
        case 'player':
            sortedProps.sort((a, b) => a.player.localeCompare(b.player));
            break;
        case 'odds':
            sortedProps.sort((a, b) => b.overOdds - a.overOdds);
            break;
    }

    loadPlayerProps(sortedProps);
}

function sortMarkets(sortBy) {
    // Market sorting logic would go here
    console.log('Sorting markets by:', sortBy);
}

function loadTeamProps(gameId) {
    const teamPropsContainer = document.getElementById('teamProps');
    if (!teamPropsContainer) return;

    const teamProps = getTeamProps(gameId);

    if (teamProps.length === 0) {
        teamPropsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary);">
                No team props available for this game
            </div>
        `;
        return;
    }

    teamPropsContainer.innerHTML = teamProps.map(prop => `
        <div class="prop-card">
            <div class="prop-label">${prop.label}</div>
            <div class="prop-value">${prop.value}</div>
            <div class="prop-odds">${prop.odds}</div>
            <div style="margin-top: 0.5rem;">
                <span class="rating-badge ${getRatingClass(prop.rating)}">
                    ${prop.rating.charAt(0).toUpperCase() + prop.rating.slice(1)}
                </span>
            </div>
        </div>
    `).join('');
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm} ET`;
}

function formatGameDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Load Weather Conditions
async function loadWeather(game) {
    const container = document.getElementById('weatherWidget');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading weather...</p>
        </div>
    `;

    try {
        const weather = await apiService.getGameWeather(currentGameId);

        container.innerHTML = `
            <div class="weather-card ${getWeatherImpact(weather)}">
                <div class="weather-main">
                    <div class="weather-icon">${getWeatherIcon(weather.condition)}</div>
                    <div class="weather-temp">
                        <span class="temp-value">${weather.temperature}°${weather.temp_unit}</span>
                        <span class="weather-condition">${weather.condition}</span>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="weather-detail">
                        <span class="detail-label">Wind</span>
                        <span class="detail-value ${weather.wind_speed > 15 ? 'warning' : ''}">${weather.wind_speed} ${weather.wind_unit}</span>
                    </div>
                    <div class="weather-detail">
                        <span class="detail-label">Humidity</span>
                        <span class="detail-value">${weather.humidity}%</span>
                    </div>
                    <div class="weather-detail">
                        <span class="detail-label">Precipitation</span>
                        <span class="detail-value">${weather.precipitation_chance}%</span>
                    </div>
                    ${weather.is_dome ? '<div class="weather-dome">🏟️ Indoor Stadium</div>' : ''}
                </div>
                ${getWeatherImpactMessage(weather)}
            </div>
        `;

    } catch (error) {
        console.error('Error loading weather:', error);
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🌤️</span>
                <p>Weather data unavailable</p>
            </div>
        `;
    }
}

function getWeatherIcon(condition) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Snow': '❄️',
        'Fog': '🌫️'
    };
    return icons[condition] || '🌤️';
}

function getWeatherImpact(weather) {
    if (weather.is_dome) return 'impact-none';
    if (weather.wind_speed > 20 || weather.condition === 'Snow' || weather.condition === 'Rain') return 'impact-high';
    if (weather.wind_speed > 15 || weather.precipitation_chance > 50) return 'impact-medium';
    return 'impact-low';
}

function getWeatherImpactMessage(weather) {
    if (weather.is_dome) {
        return '<div class="weather-impact impact-none">✅ Indoor game - No weather impact</div>';
    }

    if (weather.wind_speed > 20) {
        return '<div class="weather-impact impact-high">⚠️ High winds - Significant impact on passing game</div>';
    }

    if (weather.condition === 'Rain' || weather.condition === 'Snow') {
        return '<div class="weather-impact impact-high">⚠️ Adverse conditions - Favor rushing props</div>';
    }

    if (weather.wind_speed > 15) {
        return '<div class="weather-impact impact-medium">⚠️ Moderate winds - May affect deep passes</div>';
    }

    return '<div class="weather-impact impact-low">✅ Good conditions for all prop types</div>';
}

// Load Injury Report
async function loadInjuryReport(game) {
    const container = document.getElementById('injuryRoster');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading injury report...</p>
        </div>
    `;

    try {
        const injuries = await apiService.getGameInjuries(currentGameId);

        if (injuries.away_injuries.length === 0 && injuries.home_injuries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">✅</span>
                    <p>No injuries reported for this game</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="injury-column">
                <h4>${injuries.away_team} Injuries</h4>
                ${injuries.away_injuries.length > 0 ? injuries.away_injuries.map(injury => createInjuryCard(injury)).join('') : '<p class="no-injuries">No injuries reported</p>'}
            </div>
            <div class="injury-column">
                <h4>${injuries.home_team} Injuries</h4>
                ${injuries.home_injuries.length > 0 ? injuries.home_injuries.map(injury => createInjuryCard(injury)).join('') : '<p class="no-injuries">No injuries reported</p>'}
            </div>
        `;

    } catch (error) {
        console.error('Error loading injuries:', error);
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🏥</span>
                <p>Injury data unavailable</p>
                <small>Backend API unavailable</small>
            </div>
        `;
    }
}

function createInjuryCard(injury) {
    const statusClass = injury.injury_status.toLowerCase().replace(' ', '-');
    const impactLevel = getInjuryImpact(injury.position, injury.injury_status);

    return `
        <div class="injury-card impact-${impactLevel}">
            <div class="injury-header">
                <span class="injury-player">${injury.player_name}</span>
                <span class="injury-status status-${statusClass}">${injury.injury_status}</span>
            </div>
            <div class="injury-details">
                <span class="injury-position">${injury.position}</span>
                ${injury.injury_body_part ? `<span class="injury-type">${injury.injury_body_part}</span>` : ''}
            </div>
            ${injury.injury_notes ? `<p class="injury-description">${injury.injury_notes}</p>` : ''}
        </div>
    `;
}

function getInjuryImpact(position, status) {
    // QB, RB, WR are high impact positions
    const highImpactPositions = ['QB', 'RB', 'WR', 'TE'];
    const isHighImpactPosition = highImpactPositions.includes(position);

    if (status === 'Out' || status === 'IR') {
        return isHighImpactPosition ? 'high' : 'medium';
    }

    if (status === 'Doubtful') {
        return isHighImpactPosition ? 'medium' : 'low';
    }

    return 'low';
}

// Load Game Insights
async function loadGameInsights(game) {
    const container = document.getElementById('matchupInsights');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading insights...</p>
        </div>
    `;

    try {
        const insights = await apiService.getGameInsights(currentGameId);

        if (!insights || insights.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">⚡</span>
                    <p>No insights available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon">${getInsightIcon(insight.insight_type)}</span>
                    <h4>${insight.title}</h4>
                </div>
                <p class="insight-description">${insight.description}</p>
                <div class="insight-confidence">
                    <span class="confidence-label">Confidence:</span>
                    <span class="confidence-value">${(insight.confidence * 100).toFixed(0)}%</span>
                </div>
                ${insight.supporting_data ? createSupportingData(insight.supporting_data) : ''}
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading insights:', error);
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚡</span>
                <p>Insights unavailable</p>
                <small>Backend API unavailable</small>
            </div>
        `;
    }
}

function getInsightIcon(type) {
    const icons = {
        'trend': '📈',
        'stat': '📊',
        'matchup': '⚔️',
        'weather': '🌤️',
        'injury': '🏥'
    };
    return icons[type] || '💡';
}

function createSupportingData(data) {
    if (!data || typeof data !== 'object') return '';

    const stats = Object.entries(data)
        .filter(([key, value]) => typeof value === 'number' || typeof value === 'string')
        .slice(0, 3)
        .map(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `<span class="insight-stat">${label}: ${value}</span>`;
        })
        .join('');

    return stats ? `<div class="insight-stats">${stats}</div>` : '';
}

// Load Related Content (Articles & Videos)
async function loadRelatedContent(game) {
    const container = document.getElementById('relatedContent');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading related content...</p>
        </div>
    `;

    try {
        // Fetch content from backend
        const content = await apiService.getGameContent(currentGameId, {
            limit: 8
        });

        if (!content || content.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📰</span>
                    <p>No related content available</p>
                </div>
            `;
            return;
        }

        // Render content
        container.innerHTML = content.map(item => `
            <a href="${item.url}" class="content-card" target="_blank" rel="noopener noreferrer">
                <div class="content-thumbnail">${item.content_type === 'video' ? '🎥' : '📄'}</div>
                <div class="content-info">
                    <h4 class="content-title">${item.title}</h4>
                    <div class="content-meta">
                        <span class="content-source">${item.source}</span>
                        <span class="content-time">${formatTimeAgo(item.published_at)}</span>
                    </div>
                </div>
            </a>
        `).join('');

    } catch (error) {
        console.error('Error loading related content:', error);
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📰</span>
                <p>Unable to load related content</p>
                <small>Backend API unavailable</small>
            </div>
        `;
    }
}

// Format time ago helper
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

// Load Top Props & Suggested Parlays
async function loadTopPropsAndParlays(game) {
    const topPropsContainer = document.getElementById('topProps');
    const parlaysContainer = document.getElementById('suggestedParlays');

    if (!topPropsContainer || !parlaysContainer) return;

    // Try to load from backend
    try {
        // Get recommendations for top props
        const recs = await apiService.getRecommendations(currentGameId, {
            limit: 5,
            min_confidence: 0.65
        });

        if (recs.recommendations && recs.recommendations.length > 0) {
            const topProps = recs.recommendations.slice(0, 5);
            topPropsContainer.innerHTML = topProps.map((prop, index) => `
                <div class="top-prop-item">
                    <div class="top-prop-rank">#${index + 1}</div>
                    <div class="top-prop-details">
                        <div class="top-prop-player">${prop.player_name}</div>
                        <div class="top-prop-market">${formatMarketName(prop.market)} ${prop.line}</div>
                        <div class="top-prop-odds">${prop.market_odds ? formatOdds(prop.market_odds) : '-110'}</div>
                    </div>
                    <div class="rating-badge ${getRatingClass(mapConfidenceToRating(prop.confidence))}">
                        ${mapConfidenceToRating(prop.confidence).toUpperCase()}
                    </div>
                </div>
            `).join('');
        }

        // Get parlay suggestions
        const parlays = await apiService.getParlays(currentGameId, {
            num_legs: 3,
            risk_category: 'moderate'
        });

        if (parlays.parlays && parlays.parlays.length > 0) {
            parlaysContainer.innerHTML = parlays.parlays.slice(0, 3).map((parlay, index) => `
                <div class="parlay-card">
                    <div class="parlay-header">
                        <span class="parlay-name">${parlay.name || `Parlay ${index + 1}`}</span>
                        <span class="parlay-odds">${parlay.total_odds ? formatOdds(parlay.total_odds) : '+280'}</span>
                    </div>
                    <div class="parlay-legs">
                        ${(parlay.legs || []).map(leg => `
                            <div class="parlay-leg">
                                ${leg.player_name ? `${leg.player_name} - ` : ''}
                                ${leg.description || formatMarketName(leg.market) + ' ' + leg.line}
                            </div>
                        `).join('')}
                    </div>
                    <div class="parlay-confidence">
                        Confidence: ${parlay.confidence ? (parlay.confidence * 100).toFixed(0) : '65'}%
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading props and parlays:', error);

        // Show helpful empty state
        topPropsContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📊</span>
                <p>Unable to load top props</p>
                <small>Backend API unavailable. Please ensure the server is running at http://localhost:8000</small>
            </div>
        `;

        parlaysContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🎲</span>
                <p>Unable to load parlays</p>
                <small>Backend API unavailable.</small>
            </div>
        `;
    }
}

function formatMarketName(market) {
    const parts = market.replace('player_', '').split('_');
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function mapConfidenceToRating(confidence) {
    if (confidence >= 0.8) return 'excellent';
    if (confidence >= 0.7) return 'good';
    if (confidence >= 0.6) return 'moderate';
    return 'poor';
}
