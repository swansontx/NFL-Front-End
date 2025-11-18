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

    // Generate mock parlays based on settings
    const parlays = createMockParlays();
    displayParlays(parlays);
}

function createMockParlays() {
    // This is where backend logic would generate optimal parlays
    // For now, create mock data based on selected parameters

    const parlays = [];
    const numParlays = Math.min(5, selectedGames.length * 2); // Generate up to 5 parlays

    for (let i = 0; i < numParlays; i++) {
        const parlay = generateSingleParlay(i);
        parlays.push(parlay);
    }

    return parlays;
}

function generateSingleParlay(index) {
    // Get odds ranges based on category
    let oddsRange;
    switch(selectedCategory) {
        case 'conservative':
            oddsRange = { min: -200, max: -110 };
            break;
        case 'lotto':
            oddsRange = { min: 150, max: 500 };
            break;
        default: // moderate
            oddsRange = { min: -110, max: 150 };
    }

    // Generate random legs
    const legs = [];
    const actualNumLegs = sameGameParlay ? numLegs : Math.min(numLegs, selectedGames.length);

    for (let i = 0; i < actualNumLegs; i++) {
        const gameId = sameGameParlay ? selectedGames[0] : selectedGames[i % selectedGames.length];
        const game = getGameById(gameId);

        const betTypes = ['spread', 'total', 'moneyline', 'player_prop'];
        const betType = betTypes[Math.floor(Math.random() * betTypes.length)];

        let leg;
        switch(betType) {
            case 'spread':
                leg = {
                    game: `${game.awayTeam} @ ${game.homeTeam}`,
                    bet: `${game.homeTeam} ${game.spread.home > 0 ? '+' : ''}${game.spread.home}`,
                    odds: -110
                };
                break;
            case 'total':
                leg = {
                    game: `${game.awayTeam} @ ${game.homeTeam}`,
                    bet: `Over ${game.total.over}`,
                    odds: game.overOdds
                };
                break;
            case 'moneyline':
                leg = {
                    game: `${game.awayTeam} @ ${game.homeTeam}`,
                    bet: `${game.homeTeam} ML`,
                    odds: game.moneyline.home
                };
                break;
            case 'player_prop':
                const props = getPlayerProps(gameId);
                if (props.length > 0) {
                    const prop = props[Math.floor(Math.random() * props.length)];
                    leg = {
                        game: `${game.awayTeam} @ ${game.homeTeam}`,
                        bet: `${prop.player} Over ${prop.line} ${prop.propType}`,
                        odds: prop.overOdds
                    };
                } else {
                    leg = {
                        game: `${game.awayTeam} @ ${game.homeTeam}`,
                        bet: `${game.homeTeam} ${game.spread.home > 0 ? '+' : ''}${game.spread.home}`,
                        odds: -110
                    };
                }
                break;
        }

        legs.push(leg);
    }

    // Calculate parlay odds
    const parlayOdds = calculateParlayOdds(legs.map(l => l.odds));

    // Calculate confidence based on category and odds
    let confidence = 'moderate';
    if (selectedCategory === 'conservative') {
        confidence = ['excellent', 'good'][Math.floor(Math.random() * 2)];
    } else if (selectedCategory === 'lotto') {
        confidence = ['moderate', 'good'][Math.floor(Math.random() * 2)];
    }

    return {
        id: index + 1,
        title: `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} ${actualNumLegs}-Leg Parlay`,
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
