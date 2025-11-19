// Main app.js for home page functionality

let currentDay = 0;
let currentWeek = 12;
let currentSeason = 2024;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDayTabs();
    loadBestBets();
    loadBestProps();
    loadProjections();
    loadGames(currentDay);
    setupEventListeners();
});

function initializeDayTabs() {
    const dayTabs = document.getElementById('dayTabs');
    if (!dayTabs) return;

    const today = new Date('2025-11-18'); // Mock current date
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Update tab labels with actual day names
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

    console.log(`Navigate to week: ${currentWeek}`);
    loadGames(0); // Reload current day's games for new week
}

// Load games from backend API
async function loadGames(dayOffset) {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) return;

    // Show loading state
    gamesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-secondary);">
            <p>Loading games...</p>
        </div>
    `;

    try {
        // Try backend API first
        const response = await apiService.getGames({
            season: currentSeason,
            week: currentWeek,
            upcoming: true
        });

        const games = response.games || [];

        if (games.length === 0) {
            gamesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-secondary);">
                    <h3>No games scheduled for this week</h3>
                    <p>Check another week for upcoming games</p>
                </div>
            `;
            return;
        }

        // Convert backend format to frontend format
        const formattedGames = games.map(g => convertBackendGame(g));
        gamesGrid.innerHTML = formattedGames.map(game => createGameCard(game)).join('');

        // Add click handlers to game cards
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', function() {
                const gameId = this.getAttribute('data-game-id');
                window.location.href = `game-detail.html?id=${gameId}`;
            });
        });

    } catch (error) {
        console.error('Error loading games from backend:', error);

        // Show error state
        gamesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-secondary);">
                <h3>Unable to load games</h3>
                <p>Backend API is not available. Please ensure the backend is running at http://localhost:8000</p>
                <p style="color: var(--text-tertiary); margin-top: 1rem; font-size: 0.875rem;">Error: ${error.message}</p>
            </div>
        `;
    }
}

// Convert backend game format to frontend format
function convertBackendGame(backendGame) {
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
            home: -3.5, // Would come from odds data
            away: 3.5
        },
        moneyline: {
            home: -180,
            away: +150
        },
        total: {
            over: 54.5,
            under: 54.5,
            odds: -110
        }
    };
}

function createGameCard(game) {
    const homeSpread = game.spread.home > 0 ? `+${game.spread.home}` : game.spread.home;
    const awaySpread = game.spread.away > 0 ? `+${game.spread.away}` : game.spread.away;

    return `
        <div class="game-card" data-game-id="${game.id}">
            <div class="game-time">${formatTime(game.time)}</div>
            <div class="game-matchup">
                <div class="team">
                    <span class="team-name">${game.awayTeam}</span>
                    <span class="team-record">${game.awayRecord}</span>
                </div>
                <div class="at">@</div>
                <div class="team">
                    <span class="team-name">${game.homeTeam}</span>
                    <span class="team-record">${game.homeRecord}</span>
                </div>
            </div>
            <div class="game-lines">
                <div class="game-line">
                    <span class="line-label">Spread</span>
                    <span class="line-value">${homeSpread}</span>
                </div>
                <div class="game-line">
                    <span class="line-label">Total</span>
                    <span class="line-value">${game.total.over}</span>
                </div>
                <div class="game-line">
                    <span class="line-label">ML</span>
                    <span class="line-value ${game.moneyline.home > 0 ? 'positive-odds' : ''}">${formatOdds(game.moneyline.home)}</span>
                </div>
            </div>
        </div>
    `;
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minutes} ${ampm} ET`;
}

// Load Best Bets from backend API
async function loadBestBets() {
    const container = document.getElementById('bestBetsGrid');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary);">
            <p>Loading best bets...</p>
        </div>
    `;

    try {
        // Get today's games
        const gamesResponse = await apiService.getGames({
            season: currentSeason,
            week: currentWeek,
            upcoming: true
        });

        const games = gamesResponse.games || [];

        if (games.length === 0) {
            throw new Error('No games available');
        }

        // Get recommendations for each game (limit to first 4 games)
        const allRecommendations = [];
        for (const game of games.slice(0, 4)) {
            try {
                const recs = await apiService.getRecommendations(game.game_id, {
                    limit: 2,
                    min_confidence: 0.6
                });

                // Add game context to each recommendation
                recs.recommendations.forEach(rec => {
                    rec.game_context = `${game.away_team} @ ${game.home_team}`;
                });

                allRecommendations.push(...recs.recommendations);
            } catch (err) {
                console.warn(`Could not load recommendations for game ${game.game_id}:`, err);
            }
        }

        if (allRecommendations.length === 0) {
            throw new Error('No recommendations available');
        }

        // Sort by overall_score and take top 4
        const bestBets = allRecommendations
            .sort((a, b) => b.overall_score - a.overall_score)
            .slice(0, 4);

        // Render
        container.innerHTML = bestBets.map(bet => createBestBetCard(bet)).join('');

    } catch (error) {
        console.error('Error loading best bets from backend:', error);

        // Show error state
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary);">
                <h4>Unable to load best bets</h4>
                <p>Backend API is not available.</p>
            </div>
        `;
    }
}

function createBestBetCard(rec) {
    const confidence = rec.recommendation_strength === 'elite' || rec.recommendation_strength === 'strong' ? 'High' : 'Medium';
    const odds = rec.market_odds ? formatOdds(rec.market_odds) : '-110';
    const pick = `${rec.player_name} ${formatMarketName(rec.market)} ${rec.line}`;
    const reason = rec.reasoning && rec.reasoning.length > 0 ? rec.reasoning[0] : `Score: ${(rec.overall_score * 100).toFixed(0)}%`;

    return `
        <div class="best-bet-card">
            <div class="best-bet-header">
                <div class="best-bet-matchup">
                    <div class="best-bet-game">${rec.game_context || 'Game'}</div>
                    <div class="best-bet-pick">${pick}</div>
                </div>
                <div class="best-bet-confidence">${confidence}</div>
            </div>
            <div class="best-bet-details">
                <div class="best-bet-odds">${odds}</div>
                <div class="best-bet-reason">${reason}</div>
            </div>
        </div>
    `;
}

function formatMarketName(market) {
    // Convert player_passing_yds to "Over Passing Yds"
    const parts = market.replace('player_', '').split('_');
    return 'Over ' + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

// Load Best Props from backend API
async function loadBestProps() {
    const container = document.getElementById('bestPropsList');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
            <p>Loading best props...</p>
        </div>
    `;

    try {
        // Get today's games
        const gamesResponse = await apiService.getGames({
            season: currentSeason,
            week: currentWeek,
            upcoming: true
        });

        const games = gamesResponse.games || [];

        if (games.length === 0) {
            throw new Error('No games available');
        }

        // Get recommendations for each game (player props only)
        const allProps = [];
        for (const game of games) {
            try {
                const recs = await apiService.getRecommendations(game.game_id, {
                    limit: 10,
                    min_confidence: 0.65
                });

                allProps.push(...recs.recommendations);
            } catch (err) {
                console.warn(`Could not load props for game ${game.game_id}:`, err);
            }
        }

        if (allProps.length === 0) {
            throw new Error('No props available');
        }

        // Sort by overall_score and take top 5
        const bestProps = allProps
            .sort((a, b) => b.overall_score - a.overall_score)
            .slice(0, 5)
            .map((prop, index) => ({
                rank: index + 1,
                player: prop.player_name,
                team: prop.team,
                prop: `Over ${prop.line} ${formatMarketName(prop.market)}`,
                line: prop.line,
                odds: prop.market_odds ? formatOdds(prop.market_odds) : '-110',
                rating: mapConfidenceToRating(prop.confidence)
            }));

        // Render
        container.innerHTML = bestProps.map(prop => `
            <div class="best-prop-item">
                <div class="best-prop-rank">${prop.rank}</div>
                <div class="best-prop-info">
                    <div class="best-prop-player">${prop.player} <span class="best-prop-team">${prop.team}</span></div>
                    <div class="best-prop-line">${prop.prop}</div>
                </div>
                <div class="best-prop-odds">${prop.odds}</div>
                <div class="rating-badge ${getRatingClass(prop.rating)}">${prop.rating}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading best props from backend:', error);

        // Show error state
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <h4>Unable to load best props</h4>
                <p>Backend API is not available.</p>
            </div>
        `;
    }
}

function mapConfidenceToRating(confidence) {
    if (confidence >= 0.8) return 'excellent';
    if (confidence >= 0.7) return 'good';
    if (confidence >= 0.6) return 'moderate';
    return 'poor';
}

// Load Player Projections from backend API
async function loadProjections() {
    const container = document.getElementById('projectionsBody');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                Loading projections...
            </td>
        </tr>
    `;

    try {
        // Get today's games
        const gamesResponse = await apiService.getGames({
            season: currentSeason,
            week: currentWeek,
            upcoming: true
        });

        const games = gamesResponse.games || [];

        if (games.length === 0) {
            throw new Error('No games available');
        }

        // Get projections for first 2 games
        const allProjections = [];
        for (const game of games.slice(0, 2)) {
            try {
                const projs = await apiService.getGameProjections(game.game_id, {
                    limit: 10
                });

                allProjections.push(...projs.projections);
            } catch (err) {
                console.warn(`Could not load projections for game ${game.game_id}:`, err);
            }
        }

        if (allProjections.length === 0) {
            throw new Error('No projections available');
        }

        // Group by player and aggregate stats
        const playerMap = new Map();
        allProjections.forEach(proj => {
            if (!playerMap.has(proj.player_id)) {
                playerMap.set(proj.player_id, {
                    player: proj.player_name,
                    team: proj.team,
                    passYds: '-',
                    passTD: '-',
                    rushYds: '-',
                    recYds: '-',
                    fantasyPts: 0
                });
            }

            const player = playerMap.get(proj.player_id);

            // Map market to stat category
            if (proj.market.includes('passing_yds')) player.passYds = Math.round(proj.mu);
            if (proj.market.includes('passing_td')) player.passTD = proj.mu.toFixed(1);
            if (proj.market.includes('rushing_yds')) player.rushYds = Math.round(proj.mu);
            if (proj.market.includes('receiving_yds') || proj.market.includes('rec_yds')) player.recYds = Math.round(proj.mu);
        });

        // Convert to array and take top 6
        const projections = Array.from(playerMap.values()).slice(0, 6);

        // Render
        container.innerHTML = projections.map(proj => `
            <tr>
                <td>
                    <div class="projection-player">${proj.player}</div>
                    <div class="projection-team">${proj.team}</div>
                </td>
                <td class="projection-team">${proj.team}</td>
                <td class="projection-value ${proj.passYds > 250 ? 'projection-high' : ''}">${proj.passYds}</td>
                <td class="projection-value">${proj.passTD}</td>
                <td class="projection-value ${proj.rushYds > 40 ? 'projection-high' : ''}">${proj.rushYds}</td>
                <td class="projection-value ${proj.recYds > 80 ? 'projection-high' : ''}">${proj.recYds}</td>
                <td class="projection-value ${proj.fantasyPts > 20 ? 'projection-high' : ''}">${proj.fantasyPts}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading projections from backend:', error);

        // Show error state
        container.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <h4>Unable to load projections</h4>
                    <p>Backend API is not available.</p>
                </td>
            </tr>
        `;
    }
}
