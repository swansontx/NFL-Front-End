// Parlay Generator functionality

let selectedGames = [];
let numLegs = 3;
let selectedCategory = 'moderate';
let sameGameParlay = false;

document.addEventListener('DOMContentLoaded', function() {
    loadAvailableGames();
    setupEventListeners();
});

function setupEventListeners() {
    // Number of legs controls
    const decreaseBtn = document.getElementById('decreaseLegs');
    const increaseBtn = document.getElementById('increaseLegs');
    const numLegsInput = document.getElementById('numLegs');

    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            if (numLegs > 2) {
                numLegs--;
                numLegsInput.value = numLegs;
            }
        });
    }

    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            if (numLegs < 12) {
                numLegs++;
                numLegsInput.value = numLegs;
            }
        });
    }

    if (numLegsInput) {
        numLegsInput.addEventListener('change', function() {
            const value = parseInt(this.value);
            if (value >= 2 && value <= 12) {
                numLegs = value;
            } else {
                this.value = numLegs;
            }
        });
    }

    // Category selection
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedCategory = this.getAttribute('data-category');
        });
    });

    // Same game parlay checkbox
    const sameGameCheckbox = document.getElementById('sameGameParlay');
    if (sameGameCheckbox) {
        sameGameCheckbox.addEventListener('change', function() {
            sameGameParlay = this.checked;
            if (sameGameParlay) {
                // When same game is selected, limit to one game selection
                updateGameSelector();
            }
        });
    }

    // Generate button
    const generateBtn = document.getElementById('generateParlay');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateParlays);
    }
}

async function loadAvailableGames() {
    const gameSelector = document.getElementById('gameSelector');
    if (!gameSelector) return;

    // Show loading
    gameSelector.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--text-secondary);">Loading games...</p>';

    try {
        // Try to load from backend
        const response = await apiService.getGames({
            season: 2025,
            week: 11,
            upcoming: true
        });

        const allGames = response.games || [];

        if (allGames.length === 0) {
            throw new Error('No games available');
        }

        // Render game checkboxes
        gameSelector.innerHTML = allGames.map(game => `
            <label class="game-checkbox">
                <input type="checkbox" value="${game.game_id}" class="game-checkbox-input">
                <span class="game-checkbox-label">
                    ${game.away_team} @ ${game.home_team}<br>
                    <small style="color: var(--text-secondary);">${formatBackendGameDateTime(game.game_date, game.game_time)}</small>
                </span>
            </label>
        `).join('');

        // Add event listeners to checkboxes
        const checkboxes = gameSelector.querySelectorAll('.game-checkbox-input');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateSelectedGames();
            });
        });

    } catch (error) {
        console.error('Error loading games from backend:', error);

        // Show error state
        gameSelector.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <h4>Unable to load games</h4>
                <p>Backend API is not available. Please ensure the backend is running at http://localhost:8000</p>
            </div>
        `;
    }
}

function updateSelectedGames() {
    const checkboxes = document.querySelectorAll('.game-checkbox-input:checked');
    selectedGames = Array.from(checkboxes).map(cb => cb.value);
}

function updateGameSelector() {
    // This would update the game selector based on same game parlay setting
    console.log('Same game parlay:', sameGameParlay);
}

// Generate parlays using backend's correlation-adjusted logic
async function generateParlays() {
    if (selectedGames.length === 0) {
        showEmptyState('Please select at least one game to generate parlays');
        return;
    }

    if (sameGameParlay && selectedGames.length > 1) {
        showEmptyState('Please select only one game for same game parlays');
        return;
    }

    // Show loading state
    const parlayCards = document.getElementById('parlayCards');
    const resultsCount = document.getElementById('resultsCount');

    if (parlayCards) {
        parlayCards.innerHTML = '<div class="empty-state"><p>Generating parlays with correlation analysis...</p></div>';
    }
    if (resultsCount) {
        resultsCount.textContent = 'Loading...';
    }

    try {
        let parlays;

        if (sameGameParlay) {
            // Use backend's correlation-adjusted same-game parlays
            parlays = await generateSameGameParlaysFromBackend();
        } else {
            // Generate multi-game parlays
            parlays = await generateMultiGameParlaysFromBackend();
        }

        if (parlays.length === 0) {
            showEmptyState('No parlays could be generated with current settings. Try different games or category.');
            return;
        }

        displayParlays(parlays);

    } catch (error) {
        console.error('Error generating parlays from backend:', error);

        // Show error state
        showEmptyState('Unable to generate parlays. Backend API is not available. Please ensure the backend is running at http://localhost:8000');
    }
}

// Generate same-game parlays using backend correlation analysis
async function generateSameGameParlaysFromBackend() {
    const gameId = selectedGames[0];

    // Map category to correlation constraints
    let minCorr = 0.0;
    let maxCorr = 0.8;

    if (selectedCategory === 'conservative') {
        minCorr = -0.2;  // Allow slightly negative correlation for hedging
        maxCorr = 0.5;   // Avoid highly correlated props
    } else if (selectedCategory === 'lotto') {
        minCorr = 0.3;   // Want positive correlation for big wins
        maxCorr = 1.0;   // Allow highly correlated props
    }

    const response = await apiService.getParlays(gameId, {
        parlay_size: numLegs,
        min_correlation: minCorr,
        max_correlation: maxCorr,
        limit: 5
    });

    // Convert backend parlays to frontend format
    return response.parlays.map((parlay, index) => {
        const categoryName = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);

        return {
            id: index + 1,
            title: `${categoryName} ${numLegs}-Leg Same Game Parlay (${parlay.correlation_impact})`,
            legs: parlay.props.map(prop => ({
                game: `${prop.player_name}`,
                bet: `${prop.market} ${prop.line}`,
                odds: probabilityToAmericanOdds(prop.probability)
            })),
            odds: probabilityToAmericanOdds(parlay.adjusted_probability),
            confidence: mapScoreToConfidence(parlay.overall_score),
            potentialPayout: calculatePayout(100, probabilityToAmericanOdds(parlay.adjusted_probability)),
            correlationAdjusted: true,
            adjustmentFactor: parlay.adjustment_factor,
            edge: parlay.edge || 0
        };
    });
}

// Generate multi-game parlays
async function generateMultiGameParlaysFromBackend() {
    // Get recommendations from all selected games
    const allRecommendations = [];

    for (const gameId of selectedGames) {
        try {
            const recs = await apiService.getRecommendations(gameId, {
                limit: 10,
                min_confidence: 0.6
            });

            recs.recommendations.forEach(rec => {
                rec.game_context = `${rec.team}`;
                rec.game_id = gameId;
            });

            allRecommendations.push(...recs.recommendations);
        } catch (err) {
            console.warn(`Could not load recommendations for game ${gameId}:`, err);
        }
    }

    if (allRecommendations.length < numLegs) {
        return [];
    }

    // Filter by category confidence
    let filteredRecs = allRecommendations;
    if (selectedCategory === 'conservative') {
        filteredRecs = allRecommendations.filter(r => r.confidence >= 0.7);
    } else if (selectedCategory === 'moderate') {
        filteredRecs = allRecommendations.filter(r => r.confidence >= 0.6 && r.confidence < 0.8);
    } else {
        filteredRecs = allRecommendations.filter(r => r.confidence < 0.7 && r.overall_score > 0.5);
    }

    if (filteredRecs.length < numLegs) {
        filteredRecs = allRecommendations; // Fallback to all recs
    }

    // Sort by overall_score
    filteredRecs.sort((a, b) => b.overall_score - a.overall_score);

    // Generate 5 parlay variations
    const parlays = [];
    for (let i = 0; i < 5; i++) {
        const parlay = buildMultiGameParlay(filteredRecs, i);
        if (parlay) parlays.push(parlay);
    }

    return parlays;
}

function buildMultiGameParlay(recommendations, seed) {
    // Shuffle for variation
    const shuffled = [...recommendations].sort(() => 0.5 - Math.random() * (seed + 1));

    const legs = [];
    const usedGames = new Set();

    // One bet per game for multi-game parlays
    for (const rec of shuffled) {
        if (legs.length >= numLegs) break;
        if (usedGames.has(rec.game_id)) continue;

        legs.push({
            game: rec.game_context,
            bet: `${rec.player_name} ${formatMarketName(rec.market)} ${rec.line}`,
            odds: rec.market_odds || -110
        });

        usedGames.add(rec.game_id);
    }

    if (legs.length < numLegs) return null;

    // Calculate parlay odds
    const parlayOdds = calculateParlayOdds(legs.map(l => l.odds));

    // Determine confidence
    const avgConfidence = legs.reduce((sum, leg) => {
        const rec = recommendations.find(r => leg.bet.includes(r.player_name));
        return sum + (rec ? rec.confidence : 0.6);
    }, 0) / legs.length;

    const categoryName = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);

    return {
        id: seed + 1,
        title: `${categoryName} ${numLegs}-Leg Multi-Game Parlay`,
        legs: legs,
        odds: parlayOdds,
        confidence: mapConfidenceToRating(avgConfidence),
        potentialPayout: calculatePayout(100, parlayOdds)
    };
}

function formatMarketName(market) {
    // Convert player_passing_yds to "Over Passing Yds"
    const parts = market.replace('player_', '').split('_');
    return 'Over ' + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function mapScoreToConfidence(score) {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.6) return 'moderate';
    return 'poor';
}

function mapConfidenceToRating(confidence) {
    if (confidence >= 0.8) return 'excellent';
    if (confidence >= 0.7) return 'good';
    if (confidence >= 0.6) return 'moderate';
    return 'poor';
}

// Convert probability to American odds
function probabilityToAmericanOdds(probability) {
    if (probability >= 0.5) {
        return Math.round(-100 * probability / (1 - probability));
    } else {
        return Math.round(100 * (1 - probability) / probability);
    }
}

// Fallback: Create parlays from market lines (original logic)
function createParlaysFromMarketLines() {
    const parlays = [];
    const numParlays = 5;

    // Get available market lines based on settings
    let availableLines;
    if (sameGameParlay) {
        availableLines = getSameGameMarketLines(selectedGames[0], selectedCategory);
    } else {
        availableLines = getMarketLinesForGames(selectedGames, selectedCategory);
    }

    // Check if we have enough lines
    if (availableLines.length < numLegs) {
        return [];
    }

    // Generate multiple parlay variations
    for (let i = 0; i < numParlays; i++) {
        const parlay = buildParlay(availableLines, i);
        if (parlay) {
            parlays.push(parlay);
        }
    }

    return parlays;
}

function buildParlay(availableLines, seed) {
    // Shuffle lines to create variation
    const shuffled = [...availableLines].sort(() => 0.5 - Math.random() * (seed + 1));

    const legs = [];
    const usedGames = new Set();

    // For multi-game parlays, use one bet per game
    // For same-game parlays, can use multiple bets from same game
    for (const line of shuffled) {
        if (legs.length >= numLegs) break;

        // For multi-game parlays, don't use same game twice
        if (!sameGameParlay && usedGames.has(line.gameId)) {
            continue;
        }

        legs.push({
            game: line.game,
            bet: line.description,
            odds: line.odds,
            type: line.type
        });

        usedGames.add(line.gameId);
    }

    // Make sure we have enough legs
    if (legs.length < numLegs) {
        return null;
    }

    // Calculate parlay odds
    const parlayOdds = calculateParlayOdds(legs.map(l => l.odds));

    // Determine confidence based on category
    let confidence;
    switch(selectedCategory) {
        case 'conservative':
            confidence = ['excellent', 'good'][Math.floor(Math.random() * 2)];
            break;
        case 'lotto':
            confidence = ['moderate', 'good'][Math.floor(Math.random() * 2)];
            break;
        default:
            confidence = ['good', 'moderate'][Math.floor(Math.random() * 2)];
    }

    const parlayType = sameGameParlay ? 'Same Game' : 'Multi-Game';
    const categoryName = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);

    return {
        id: seed + 1,
        title: `${categoryName} ${numLegs}-Leg ${parlayType} Parlay`,
        legs: legs,
        odds: parlayOdds,
        confidence: confidence,
        potentialPayout: calculatePayout(100, parlayOdds)
    };
}

function calculateParlayOdds(oddsArray) {
    // Convert American odds to decimal and multiply
    let decimalOdds = 1;

    oddsArray.forEach(odds => {
        const decimal = americanToDecimal(odds);
        decimalOdds *= decimal;
    });

    // Convert back to American odds
    return decimalToAmerican(decimalOdds);
}

function americanToDecimal(americanOdds) {
    if (americanOdds > 0) {
        return (americanOdds / 100) + 1;
    } else {
        return (100 / Math.abs(americanOdds)) + 1;
    }
}

function decimalToAmerican(decimalOdds) {
    if (decimalOdds >= 2) {
        return Math.round((decimalOdds - 1) * 100);
    } else {
        return Math.round(-100 / (decimalOdds - 1));
    }
}

function calculatePayout(stake, odds) {
    if (odds > 0) {
        return stake + (stake * odds / 100);
    } else {
        return stake + (stake * 100 / Math.abs(odds));
    }
}

function displayParlays(parlays) {
    const parlayCards = document.getElementById('parlayCards');
    const resultsCount = document.getElementById('resultsCount');

    if (!parlayCards) return;

    resultsCount.textContent = `${parlays.length} parlay${parlays.length !== 1 ? 's' : ''} generated`;

    parlayCards.innerHTML = parlays.map(parlay => {
        const correlationBadge = parlay.correlationAdjusted
            ? `<span class="correlation-badge" title="Correlation adjustment: ${(parlay.adjustmentFactor * 100).toFixed(0)}%">
                📊 Correlation Adjusted
               </span>`
            : '';

        return `
        <div class="parlay-card">
            <div class="parlay-header">
                <div class="parlay-title">${parlay.title}</div>
                <div class="parlay-odds">${formatOdds(parlay.odds)}</div>
            </div>
            ${correlationBadge}
            <div class="parlay-legs">
                ${parlay.legs.map(leg => `
                    <div class="parlay-leg">
                        <div class="leg-details">
                            <div class="leg-game">${leg.game}</div>
                            <div class="leg-bet">${leg.bet}</div>
                        </div>
                        <div class="leg-odds">${formatOdds(leg.odds)}</div>
                    </div>
                `).join('')}
            </div>

            <div class="parlay-footer">
                <div class="confidence-score">
                    <span class="confidence-label">Confidence:</span>
                    <span class="rating-badge ${getRatingClass(parlay.confidence)}">
                        ${parlay.confidence.charAt(0).toUpperCase() + parlay.confidence.slice(1)}
                    </span>
                </div>
                <div class="potential-payout">
                    <div class="payout-label">Potential Win ($100)</div>
                    <div class="payout-value">$${parlay.potentialPayout.toFixed(2)}</div>
                </div>
            </div>
        </div>
    `}).join('');
}

function showEmptyState(message) {
    const parlayCards = document.getElementById('parlayCards');
    if (!parlayCards) return;

    parlayCards.innerHTML = `
        <div class="empty-state">
            <p>${message}</p>
        </div>
    `;
}

function formatBackendGameDateTime(dateStr, timeStr) {
    const gameDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateDisplay;
    if (gameDate.toDateString() === today.toDateString()) {
        dateDisplay = 'Today';
    } else if (gameDate.toDateString() === tomorrow.toDateString()) {
        dateDisplay = 'Tomorrow';
    } else {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        dateDisplay = gameDate.toLocaleDateString('en-US', options);
    }

    if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const timeDisplay = `${displayHour}:${minutes} ${ampm}`;
        return `${dateDisplay} ${timeDisplay}`;
    }

    return dateDisplay;
}

function formatGameDateTime(date, time) {
    const gameDate = new Date(date);
    const today = new Date('2025-11-18');
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateStr;
    if (gameDate.toDateString() === today.toDateString()) {
        dateStr = 'Today';
    } else if (gameDate.toDateString() === tomorrow.toDateString()) {
        dateStr = 'Tomorrow';
    } else {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        dateStr = gameDate.toLocaleDateString('en-US', options);
    }

    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const timeStr = `${displayHour}:${minutes} ${ampm}`;

    return `${dateStr} ${timeStr}`;
}
