// Main app.js for home page functionality

let currentDay = 0;

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
    // This would update the week display and reload games
    console.log(`Navigate week: ${direction}`);
    // In production, this would call API with new week offset
}

function loadGames(dayOffset) {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) return;

    const games = getGamesByDay(dayOffset);

    if (games.length === 0) {
        gamesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-secondary);">
                <h3>No games scheduled for this day</h3>
                <p>Check another day for upcoming games</p>
            </div>
        `;
        return;
    }

    gamesGrid.innerHTML = games.map(game => createGameCard(game)).join('');

    // Add click handlers to game cards
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', function() {
            const gameId = this.getAttribute('data-game-id');
            window.location.href = `game-detail.html?id=${gameId}`;
        });
    });
}

function createGameCard(game) {
    const homeSpread = game.spread.home > 0 ? `+${game.spread.home}` : game.spread.home;
    const awaySpread = game.spread.away > 0 ? `+${game.spread.away}` : game.spread.away;

    return `
        <div class="game-card" data-game-id="${game.id}">
            <div class="game-time">
                <span>${formatTime(game.time)}</span>
                <span class="game-status">${game.status}</span>
            </div>

            <div class="teams">
                <div class="team">
                    <div>
                        <span class="team-name">${game.awayTeam}</span>
                        <span class="team-record">${game.awayRecord}</span>
                    </div>
                </div>
                <div class="team">
                    <div>
                        <span class="team-name">${game.homeTeam}</span>
                        <span class="team-record">${game.homeRecord}</span>
                    </div>
                </div>
            </div>

            <div class="betting-lines">
                <div class="line-item">
                    <div class="line-label">Spread</div>
                    <div class="line-value">${homeSpread}</div>
                </div>
                <div class="line-item">
                    <div class="line-label">Total</div>
                    <div class="line-value">${game.total.over}</div>
                </div>
                <div class="line-item">
                    <div class="line-label">Moneyline</div>
                    <div class="line-value ${game.moneyline.home > 0 ? 'positive' : 'negative'}">
                        ${formatOdds(game.moneyline.home)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm} ET`;
}

// Load Best Bets section
function loadBestBets() {
    const container = document.getElementById('bestBetsGrid');
    if (!container) return;

    const bestBets = [
        {
            game: 'Kansas City @ Buffalo',
            pick: 'Over 54.5',
            odds: '-110',
            confidence: 'High',
            reason: '8-2 record on overs in matchups this season'
        },
        {
            game: 'Philadelphia @ Dallas',
            pick: 'Eagles -7.5',
            odds: '-110',
            confidence: 'High',
            reason: 'Eagles 8-2 ATS in last 10 games'
        },
        {
            game: 'Green Bay vs Chicago',
            pick: 'Packers ML',
            odds: '-420',
            confidence: 'Medium',
            reason: 'Packers dominant at home this season'
        },
        {
            game: 'Baltimore vs Cincinnati',
            pick: 'Under 52.5',
            odds: '-110',
            confidence: 'Medium',
            reason: 'Strong defensive matchup, weather concerns'
        }
    ];

    container.innerHTML = bestBets.map(bet => `
        <div class="best-bet-card">
            <div class="best-bet-header">
                <div class="best-bet-matchup">
                    <div class="best-bet-game">${bet.game}</div>
                    <div class="best-bet-pick">${bet.pick}</div>
                </div>
                <div class="best-bet-confidence">${bet.confidence}</div>
            </div>
            <div class="best-bet-details">
                <div class="best-bet-odds">${bet.odds}</div>
                <div class="best-bet-reason">${bet.reason}</div>
            </div>
        </div>
    `).join('');
}

// Load Best Props section
function loadBestProps() {
    const container = document.getElementById('bestPropsList');
    if (!container) return;

    const bestProps = [
        {
            rank: 1,
            player: 'Patrick Mahomes',
            team: 'KC',
            prop: 'Over 287.5 Passing Yards',
            line: '287.5',
            odds: '-115',
            rating: 'excellent'
        },
        {
            rank: 2,
            player: 'Josh Allen',
            team: 'BUF',
            prop: 'Over 42.5 Rushing Yards',
            line: '42.5',
            odds: '-120',
            rating: 'excellent'
        },
        {
            rank: 3,
            player: 'Travis Kelce',
            team: 'KC',
            prop: 'Over 5.5 Receptions',
            line: '5.5',
            odds: '-130',
            rating: 'good'
        },
        {
            rank: 4,
            player: 'Stefon Diggs',
            team: 'BUF',
            prop: 'Over 73.5 Receiving Yards',
            line: '73.5',
            odds: '+100',
            rating: 'good'
        },
        {
            rank: 5,
            player: 'Jalen Hurts',
            team: 'PHI',
            prop: 'Over 1.5 Passing TDs',
            line: '1.5',
            odds: '-145',
            rating: 'good'
        }
    ];

    container.innerHTML = bestProps.map(prop => `
        <div class="best-prop-item">
            <div class="best-prop-rank">${prop.rank}</div>
            <div class="best-prop-player">
                <div class="best-prop-name">${prop.player}</div>
                <div class="best-prop-desc">${prop.prop}</div>
            </div>
            <div class="best-prop-line">
                <div class="best-prop-type">Line</div>
                <div class="best-prop-value">${prop.line}</div>
            </div>
            <div class="rating-badge ${getRatingClass(prop.rating)}">${prop.rating}</div>
        </div>
    `).join('');
}

// Load Player Projections section
function loadProjections() {
    const container = document.getElementById('projectionsBody');
    if (!container) return;

    const projections = [
        {
            player: 'Patrick Mahomes',
            team: 'KC',
            passYds: 298,
            passTD: 2.5,
            rushYds: 12,
            recYds: '-',
            fantasyPts: 24.3
        },
        {
            player: 'Josh Allen',
            team: 'BUF',
            passYds: 276,
            passTD: 2.3,
            rushYds: 48,
            recYds: '-',
            fantasyPts: 25.1
        },
        {
            player: 'Travis Kelce',
            team: 'KC',
            passYds: '-',
            passTD: '-',
            rushYds: 2,
            recYds: 72,
            fantasyPts: 13.2
        },
        {
            player: 'Stefon Diggs',
            team: 'BUF',
            passYds: '-',
            passTD: '-',
            rushYds: 1,
            recYds: 84,
            fantasyPts: 14.9
        },
        {
            player: 'Jalen Hurts',
            team: 'PHI',
            passYds: 245,
            passTD: 2.1,
            rushYds: 52,
            recYds: '-',
            fantasyPts: 23.7
        },
        {
            player: 'A.J. Brown',
            team: 'PHI',
            passYds: '-',
            passTD: '-',
            rushYds: 0,
            recYds: 91,
            fantasyPts: 15.6
        }
    ];

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
}
