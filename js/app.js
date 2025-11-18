// Main app.js for home page functionality

let currentDay = 0;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDayTabs();
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
