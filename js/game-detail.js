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

function loadGameDetails() {
    const game = getGameById(currentGameId);
    if (!game) {
        window.location.href = 'index.html';
        return;
    }

    // Load game header
    loadGameHeader(game);

    // Load betting markets
    loadGameLines(game);

    // Load player props
    allPlayerProps = getPlayerProps(currentGameId);
    loadPlayerProps(allPlayerProps);

    // Load team props
    loadTeamProps(currentGameId);
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
