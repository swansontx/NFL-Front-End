// Props Builder - Cross-game prop selection and parlay building

let currentWeek = 12;
let currentSeason = 2024;
let allGames = [];
let selectedGameIds = new Set();
let allProps = [];
let parlaySlip = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadGames();
    await loadTrendingProps();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('selectAllGames')?.addEventListener('click', selectAllGames);
    document.getElementById('clearAllGames')?.addEventListener('click', clearAllGames);
    document.getElementById('clearSlip')?.addEventListener('click', clearParlaySlip);
}

// Load games for selection
async function loadGames() {
    const container = document.getElementById('gamesSelection');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const response = await apiService.getGames({
            season: currentSeason,
            week: currentWeek,
            upcoming: true
        });

        allGames = response.games || [];

        if (allGames.length === 0) {
            container.innerHTML = `<p class="empty-message">No games this week</p>`;
            return;
        }

        container.innerHTML = allGames.map(game => `
            <div class="game-select-card" data-game-id="${game.game_id}">
                <input type="checkbox" id="game-${game.game_id}" class="game-checkbox">
                <label for="game-${game.game_id}" class="game-select-label">
                    <span class="game-teams">${game.away_team} @ ${game.home_team}</span>
                    <span class="game-time">${formatTime(game.game_time)}</span>
                </label>
            </div>
        `).join('');

        // Add change listeners
        container.querySelectorAll('.game-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleGameSelection);
        });

        // Select all by default
        selectAllGames();

    } catch (error) {
        console.error('Error loading games:', error);
        container.innerHTML = `<p class="error-message">Unable to load games</p>`;
    }
}

function handleGameSelection(e) {
    const gameId = e.target.id.replace('game-', '');
    if (e.target.checked) {
        selectedGameIds.add(gameId);
    } else {
        selectedGameIds.delete(gameId);
    }
    loadPropsForSelectedGames();
}

function selectAllGames() {
    document.querySelectorAll('.game-checkbox').forEach(cb => {
        cb.checked = true;
        const gameId = cb.id.replace('game-', '');
        selectedGameIds.add(gameId);
    });
    loadPropsForSelectedGames();
}

function clearAllGames() {
    document.querySelectorAll('.game-checkbox').forEach(cb => {
        cb.checked = false;
    });
    selectedGameIds.clear();
    loadPropsForSelectedGames();
}

// Load best props across selected games
async function loadPropsForSelectedGames() {
    const container = document.getElementById('propsList');
    const countDisplay = document.getElementById('propsCount');

    if (!container) return;

    if (selectedGameIds.size === 0) {
        container.innerHTML = `<p class="empty-message">Select games to see props</p>`;
        if (countDisplay) countDisplay.textContent = '0 props';
        return;
    }

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        // Use the value endpoint to get best props across week
        const bestPropsResponse = await apiService.getBestProps({
            week: currentWeek,
            limit: 50
        });

        let propsToFilter = bestPropsResponse.props || [];

        // If we have props, filter to selected games
        if (propsToFilter.length > 0 && selectedGameIds.size < allGames.length) {
            propsToFilter = propsToFilter.filter(prop => {
                // Check if prop's game is in selected games
                return selectedGameIds.has(prop.game_id);
            });
        }

        // Add matchup info
        propsToFilter.forEach(prop => {
            const game = allGames.find(g => g.game_id === prop.game_id);
            if (game) {
                prop.matchup = `${game.away_team} @ ${game.home_team}`;
            }
        });

        allProps = propsToFilter;

        if (allProps.length === 0) {
            container.innerHTML = `<p class="empty-message">No props available for selected games</p>`;
            if (countDisplay) countDisplay.textContent = '0 props';
            return;
        }

        // Sort by edge/confidence and take top 12
        const topProps = allProps
            .sort((a, b) => (b.edge || b.confidence || 0) - (a.edge || a.confidence || 0))
            .slice(0, 12);

        if (countDisplay) countDisplay.textContent = `${topProps.length} props`;

        container.innerHTML = topProps.map((prop, index) => {
            const isInSlip = parlaySlip.some(p =>
                p.player_id === prop.player_id && p.market === prop.market
            );

            const line = prop.line || prop.mu;
            const lineDisplay = line !== undefined ? (typeof line === 'number' ? line.toFixed(1) : line) : 'N/A';
            const odds = prop.odds || prop.market_odds || -110;
            const edgeDisplay = prop.edge ? `+${Math.round(prop.edge * 100)}%` : (prop.confidence ? `${Math.round(prop.confidence * 100)}%` : '');

            return `
                <div class="prop-builder-card ${isInSlip ? 'in-slip' : ''}"
                     data-prop-index="${index}"
                     onclick="togglePropInSlip(${index})">
                    <div class="prop-builder-rank">#${index + 1}</div>
                    <div class="prop-builder-info">
                        <div class="prop-builder-player">${prop.player_name}</div>
                        <div class="prop-builder-meta">
                            <span>${prop.team} • ${prop.position}</span>
                            <span class="prop-matchup">${prop.matchup || ''}</span>
                        </div>
                    </div>
                    <div class="prop-builder-details">
                        <div class="prop-builder-market">${formatMarketName(prop.market)}</div>
                        <div class="prop-builder-line">${lineDisplay}</div>
                    </div>
                    <div class="prop-builder-odds">
                        <span class="odds-value">${formatOdds(odds)}</span>
                    </div>
                    ${edgeDisplay ? `
                        <div class="prop-builder-confidence confidence-${getConfidenceLevel(prop.edge || prop.confidence)}">
                            ${edgeDisplay}
                        </div>
                    ` : ''}
                    <div class="prop-add-indicator">
                        ${isInSlip ? '✓' : '+'}
                    </div>
                </div>
            `;
        }).join('');

        // Store for reference
        window.topPropsRef = topProps;

    } catch (error) {
        console.error('Error loading props:', error);
        container.innerHTML = `<p class="error-message">Unable to load props</p>`;
    }
}

// Load trending props with line movement
async function loadTrendingProps() {
    const container = document.getElementById('trendingPropsList');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

    try {
        const response = await apiService.getPropsTrending({
            week: currentWeek,
            limit: 8
        });

        const trendingProps = response.trending_props || [];

        if (trendingProps.length === 0) {
            container.innerHTML = `<p class="empty-message">No trending props this week</p>`;
            return;
        }

        container.innerHTML = trendingProps.map(prop => {
            const movement = prop.line_movement || prop.movement || 0;
            const movementClass = movement > 0 ? 'movement-up' : (movement < 0 ? 'movement-down' : '');
            const movementDisplay = movement > 0 ? `+${movement.toFixed(1)}` : movement.toFixed(1);
            const line = prop.current_line || prop.line || prop.mu;
            const lineDisplay = line !== undefined ? (typeof line === 'number' ? line.toFixed(1) : line) : 'N/A';

            return `
                <div class="trending-prop-card ${movementClass}">
                    <div class="trending-prop-info">
                        <div class="trending-player">${prop.player_name}</div>
                        <div class="trending-meta">
                            <span>${prop.team} • ${prop.position}</span>
                        </div>
                    </div>
                    <div class="trending-details">
                        <div class="trending-market">${formatMarketName(prop.market)}</div>
                        <div class="trending-line">${lineDisplay}</div>
                    </div>
                    <div class="trending-movement">
                        <span class="movement-arrow">${movement > 0 ? '↑' : (movement < 0 ? '↓' : '→')}</span>
                        <span class="movement-value">${movementDisplay}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading trending props:', error);
        container.innerHTML = `<p class="empty-message">Unable to load trending props</p>`;
    }
}

// Toggle prop in parlay slip
function togglePropInSlip(propIndex) {
    const prop = window.topPropsRef?.[propIndex];
    if (!prop) return;

    const existingIndex = parlaySlip.findIndex(p =>
        p.player_id === prop.player_id && p.market === prop.market
    );

    if (existingIndex >= 0) {
        // Remove from slip
        parlaySlip.splice(existingIndex, 1);
    } else {
        // Add to slip (max 10 legs)
        if (parlaySlip.length >= 10) {
            alert('Maximum 10 legs in a parlay');
            return;
        }
        parlaySlip.push({
            ...prop,
            odds: -110 // Default odds
        });
    }

    updateParlaySlipUI();
    // Re-render props list to update checkmarks
    loadPropsForSelectedGames();
}

// Update parlay slip UI
function updateParlaySlipUI() {
    const legsContainer = document.getElementById('parlayLegs');
    const summary = document.getElementById('parlaySummary');

    if (!legsContainer) return;

    if (parlaySlip.length === 0) {
        legsContainer.innerHTML = `<p class="empty-slip">Click props to add to parlay</p>`;
        if (summary) summary.style.display = 'none';
        return;
    }

    legsContainer.innerHTML = parlaySlip.map((prop, index) => `
        <div class="parlay-leg">
            <div class="leg-info">
                <div class="leg-player">${prop.player_name}</div>
                <div class="leg-details">
                    ${formatMarketName(prop.market)} ${prop.mu ? prop.mu.toFixed(1) : ''}
                </div>
            </div>
            <div class="leg-odds">${formatOdds(prop.odds)}</div>
            <button class="leg-remove" onclick="removeLeg(${index})">×</button>
        </div>
    `).join('');

    // Update summary
    if (summary) {
        summary.style.display = 'block';

        document.getElementById('legCount').textContent = parlaySlip.length;

        const combinedOdds = calculateParlayOdds(parlaySlip);
        document.getElementById('combinedOdds').textContent = formatOdds(combinedOdds);

        const payout = calculatePayout(10, combinedOdds);
        document.getElementById('estimatedPayout').textContent = `$${payout.toFixed(2)}`;
    }
}

// Remove leg from parlay
function removeLeg(index) {
    parlaySlip.splice(index, 1);
    updateParlaySlipUI();
    loadPropsForSelectedGames();
}

// Clear entire parlay slip
function clearParlaySlip() {
    parlaySlip = [];
    updateParlaySlipUI();
    loadPropsForSelectedGames();
}

// Calculate parlay odds from individual legs
function calculateParlayOdds(legs) {
    if (legs.length === 0) return 0;

    // Convert each leg to decimal odds, multiply, convert back
    let decimalProduct = 1;

    legs.forEach(leg => {
        const decimal = americanToDecimal(leg.odds);
        decimalProduct *= decimal;
    });

    return decimalToAmerican(decimalProduct);
}

// Convert American odds to decimal
function americanToDecimal(american) {
    if (american > 0) {
        return (american / 100) + 1;
    } else {
        return (100 / Math.abs(american)) + 1;
    }
}

// Convert decimal odds to American
function decimalToAmerican(decimal) {
    if (decimal >= 2) {
        return Math.round((decimal - 1) * 100);
    } else {
        return Math.round(-100 / (decimal - 1));
    }
}

// Calculate payout
function calculatePayout(stake, americanOdds) {
    if (americanOdds > 0) {
        return stake + (stake * americanOdds / 100);
    } else {
        return stake + (stake * 100 / Math.abs(americanOdds));
    }
}

// Helper functions
function formatTime(time) {
    if (!time) return 'TBD';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minutes} ${ampm}`;
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

// Make functions globally available
window.togglePropInSlip = togglePropInSlip;
window.removeLeg = removeLeg;
