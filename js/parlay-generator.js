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

function loadAvailableGames() {
    const gameSelector = document.getElementById('gameSelector');
    if (!gameSelector) return;

    // Get all games from the next 7 days
    const allGames = [];
    for (let i = 0; i < 7; i++) {
        const dayGames = getGamesByDay(i);
        allGames.push(...dayGames);
    }

    gameSelector.innerHTML = allGames.map(game => `
        <label class="game-checkbox">
            <input type="checkbox" value="${game.id}" class="game-checkbox-input">
            <span class="game-checkbox-label">
                ${game.awayTeam} @ ${game.homeTeam}<br>
                <small style="color: var(--text-secondary);">${formatGameDateTime(game.date, game.time)}</small>
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
}

function updateSelectedGames() {
    const checkboxes = document.querySelectorAll('.game-checkbox-input:checked');
    selectedGames = Array.from(checkboxes).map(cb => parseInt(cb.value));
}

function updateGameSelector() {
    // This would update the game selector based on same game parlay setting
    // For now, just log
    console.log('Same game parlay:', sameGameParlay);
}

function generateParlays() {
    if (selectedGames.length === 0) {
        showEmptyState('Please select at least one game to generate parlays');
        return;
    }

    if (sameGameParlay && selectedGames.length > 1) {
        showEmptyState('Please select only one game for same game parlays');
        return;
    }

    // Generate parlays based on actual market lines
    const parlays = createParlaysFromMarketLines();
    displayParlays(parlays);
}

function createParlaysFromMarketLines() {
    const parlays = [];
    const numParlays = 5; // Generate 5 different parlay options

    // Get available market lines based on settings
    let availableLines;
    if (sameGameParlay) {
        availableLines = getSameGameMarketLines(selectedGames[0], selectedCategory);
    } else {
        availableLines = getMarketLinesForGames(selectedGames, selectedCategory);
    }

    // Check if we have enough lines to create parlays
    if (availableLines.length < numLegs) {
        showEmptyState(`Not enough ${selectedCategory} bets available for ${numLegs}-leg parlay. Try selecting more games or a different category.`);
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
    // Shuffle lines to create variation (using seed for different combinations)
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

    parlayCards.innerHTML = parlays.map(parlay => `
        <div class="parlay-card">
            <div class="parlay-header">
                <div class="parlay-title">${parlay.title}</div>
                <div class="parlay-odds">${formatOdds(parlay.odds)}</div>
            </div>

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
    `).join('');
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
