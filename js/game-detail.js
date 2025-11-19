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
