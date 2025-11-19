// Mock data for NFL betting app
// This will be replaced with API calls in production

const MOCK_GAMES = [
    {
        id: 1,
        homeTeam: "Kansas City Chiefs",
        awayTeam: "Buffalo Bills",
        homeRecord: "8-2",
        awayRecord: "7-3",
        date: "2025-11-18",
        time: "20:15",
        status: "Upcoming",
        spread: { home: -2.5, away: +2.5 },
        moneyline: { home: -135, away: +115 },
        total: { over: 54.5, under: 54.5 },
        overOdds: -110,
        underOdds: -110
    },
    {
        id: 2,
        homeTeam: "San Francisco 49ers",
        awayTeam: "Seattle Seahawks",
        homeRecord: "6-4",
        awayRecord: "5-5",
        date: "2025-11-18",
        time: "16:25",
        status: "Upcoming",
        spread: { home: -6.5, away: +6.5 },
        moneyline: { home: -280, away: +220 },
        total: { over: 47.5, under: 47.5 },
        overOdds: -115,
        underOdds: -105
    },
    {
        id: 3,
        homeTeam: "Dallas Cowboys",
        awayTeam: "Philadelphia Eagles",
        homeRecord: "5-5",
        awayRecord: "9-1",
        date: "2025-11-19",
        time: "13:00",
        status: "Upcoming",
        spread: { home: +7.5, away: -7.5 },
        moneyline: { home: +260, away: -310 },
        total: { over: 51.5, under: 51.5 },
        overOdds: -110,
        underOdds: -110
    },
    {
        id: 4,
        homeTeam: "Green Bay Packers",
        awayTeam: "Chicago Bears",
        homeRecord: "6-4",
        awayRecord: "4-6",
        date: "2025-11-20",
        time: "20:15",
        status: "Upcoming",
        spread: { home: -9.5, away: +9.5 },
        moneyline: { home: -420, away: +330 },
        total: { over: 44.5, under: 44.5 },
        overOdds: -110,
        underOdds: -110
    },
    {
        id: 5,
        homeTeam: "Miami Dolphins",
        awayTeam: "New York Jets",
        homeRecord: "4-6",
        awayRecord: "3-7",
        date: "2025-11-21",
        time: "13:00",
        status: "Upcoming",
        spread: { home: -3.5, away: +3.5 },
        moneyline: { home: -165, away: +140 },
        total: { over: 45.5, under: 45.5 },
        overOdds: -110,
        underOdds: -110
    },
    {
        id: 6,
        homeTeam: "Baltimore Ravens",
        awayTeam: "Cincinnati Bengals",
        homeRecord: "7-3",
        awayRecord: "5-5",
        date: "2025-11-22",
        time: "20:15",
        status: "Upcoming",
        spread: { home: -4.5, away: +4.5 },
        moneyline: { home: -200, away: +170 },
        total: { over: 52.5, under: 52.5 },
        overOdds: -110,
        underOdds: -110
    },
    {
        id: 7,
        homeTeam: "Los Angeles Rams",
        awayTeam: "Arizona Cardinals",
        homeRecord: "5-5",
        awayRecord: "4-6",
        date: "2025-11-23",
        time: "16:05",
        status: "Upcoming",
        spread: { home: -5.5, away: +5.5 },
        moneyline: { home: -240, away: +195 },
        total: { over: 48.5, under: 48.5 },
        overOdds: -110,
        underOdds: -110
    },
    {
        id: 8,
        homeTeam: "Detroit Lions",
        awayTeam: "Minnesota Vikings",
        homeRecord: "9-1",
        awayRecord: "8-2",
        date: "2025-11-24",
        time: "12:30",
        status: "Upcoming",
        spread: { home: -2.5, away: +2.5 },
        moneyline: { home: -130, away: +110 },
        total: { over: 53.5, under: 53.5 },
        overOdds: -110,
        underOdds: -110
    }
];

const MOCK_PLAYER_PROPS = {
    1: [ // Kansas City vs Buffalo
        {
            player: "Patrick Mahomes",
            team: "KC",
            propType: "Passing Yards",
            category: "passing",
            line: 287.5,
            overOdds: -115,
            underOdds: -105,
            rating: "excellent",
            ratingText: "Excellent Value"
        },
        {
            player: "Patrick Mahomes",
            team: "KC",
            propType: "Passing TDs",
            category: "passing",
            line: 2.5,
            overOdds: +105,
            underOdds: -125,
            rating: "good",
            ratingText: "Good Value"
        },
        {
            player: "Josh Allen",
            team: "BUF",
            propType: "Passing Yards",
            category: "passing",
            line: 265.5,
            overOdds: -110,
            underOdds: -110,
            rating: "moderate",
            ratingText: "Moderate"
        },
        {
            player: "Josh Allen",
            team: "BUF",
            propType: "Rush Yards",
            category: "rushing",
            line: 42.5,
            overOdds: -120,
            underOdds: +100,
            rating: "excellent",
            ratingText: "Excellent Value"
        },
        {
            player: "Travis Kelce",
            team: "KC",
            propType: "Receptions",
            category: "receiving",
            line: 5.5,
            overOdds: -130,
            underOdds: +110,
            rating: "good",
            ratingText: "Good Value"
        },
        {
            player: "Travis Kelce",
            team: "KC",
            propType: "Receiving Yards",
            category: "receiving",
            line: 67.5,
            overOdds: -110,
            underOdds: -110,
            rating: "moderate",
            ratingText: "Moderate"
        },
        {
            player: "Stefon Diggs",
            team: "BUF",
            propType: "Receiving Yards",
            category: "receiving",
            line: 73.5,
            overOdds: +100,
            underOdds: -120,
            rating: "good",
            ratingText: "Good Value"
        },
        {
            player: "Isiah Pacheco",
            team: "KC",
            propType: "Rush Yards",
            category: "rushing",
            line: 58.5,
            overOdds: -105,
            underOdds: -115,
            rating: "poor",
            ratingText: "Poor Value"
        },
        {
            player: "Chris Jones",
            team: "KC",
            propType: "Tackles + Assists",
            category: "defensive",
            line: 4.5,
            overOdds: -110,
            underOdds: -110,
            rating: "moderate",
            ratingText: "Moderate"
        },
        {
            player: "Matt Milano",
            team: "BUF",
            propType: "Tackles + Assists",
            category: "defensive",
            line: 6.5,
            overOdds: -105,
            underOdds: -115,
            rating: "good",
            ratingText: "Good Value"
        }
    ]
};

const MOCK_TEAM_PROPS = {
    1: [
        {
            label: "Kansas City 1st Half Points",
            value: "13.5",
            odds: "O -110 / U -110",
            rating: "moderate"
        },
        {
            label: "Buffalo 1st Half Points",
            value: "12.5",
            odds: "O -110 / U -110",
            rating: "good"
        },
        {
            label: "Kansas City Total TDs",
            value: "3.5",
            odds: "O +105 / U -125",
            rating: "excellent"
        },
        {
            label: "Buffalo Total TDs",
            value: "3.5",
            odds: "O -115 / U -105",
            rating: "moderate"
        },
        {
            label: "Game Total Sacks",
            value: "5.5",
            odds: "O -105 / U -115",
            rating: "good"
        },
        {
            label: "Longest TD",
            value: "42.5",
            odds: "O -110 / U -110",
            rating: "moderate"
        }
    ]
};

// Rating calculation utilities
function getRatingClass(rating) {
    const ratingMap = {
        'excellent': 'rating-excellent',
        'good': 'rating-good',
        'moderate': 'rating-moderate',
        'poor': 'rating-poor',
        'avoid': 'rating-avoid'
    };
    return ratingMap[rating] || 'rating-moderate';
}

function formatOdds(odds) {
    if (odds > 0) {
        return `+${odds}`;
    }
    return odds.toString();
}

function getGamesByDay(dayOffset) {
    const today = new Date('2025-11-18'); // Mock current date
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + dayOffset);

    const targetDateStr = targetDate.toISOString().split('T')[0];

    return MOCK_GAMES.filter(game => game.date === targetDateStr);
}

function getGameById(gameId) {
    return MOCK_GAMES.find(game => game.id === parseInt(gameId));
}

function getPlayerProps(gameId) {
    return MOCK_PLAYER_PROPS[gameId] || [];
}

function getTeamProps(gameId) {
    return MOCK_TEAM_PROPS[gameId] || [];
}

// Categorize bet by odds into risk buckets
function categorizeBetRisk(odds) {
    if (odds <= -110 && odds >= -200) {
        return 'conservative';
    } else if ((odds > -110 && odds <= 150) || (odds < -200 && odds >= -300)) {
        return 'moderate';
    } else {
        return 'lotto';
    }
}

// Get all available market lines across all games
function getAllMarketLines() {
    const allLines = [];

    MOCK_GAMES.forEach(game => {
        const gameLabel = `${game.awayTeam} @ ${game.homeTeam}`;

        // Spread bets
        allLines.push({
            game: gameLabel,
            gameId: game.id,
            type: 'spread',
            description: `${game.homeTeam} ${game.spread.home > 0 ? '+' : ''}${game.spread.home}`,
            odds: -110,
            category: categorizeBetRisk(-110)
        });
        allLines.push({
            game: gameLabel,
            gameId: game.id,
            type: 'spread',
            description: `${game.awayTeam} ${game.spread.away > 0 ? '+' : ''}${game.spread.away}`,
            odds: -110,
            category: categorizeBetRisk(-110)
        });

        // Moneyline bets
        allLines.push({
            game: gameLabel,
            gameId: game.id,
            type: 'moneyline',
            description: `${game.homeTeam} ML`,
            odds: game.moneyline.home,
            category: categorizeBetRisk(game.moneyline.home)
        });
        allLines.push({
            game: gameLabel,
            gameId: game.id,
            type: 'moneyline',
            description: `${game.awayTeam} ML`,
            odds: game.moneyline.away,
            category: categorizeBetRisk(game.moneyline.away)
        });

        // Total bets
        allLines.push({
            game: gameLabel,
            gameId: game.id,
            type: 'total',
            description: `Over ${game.total.over}`,
            odds: game.overOdds,
            category: categorizeBetRisk(game.overOdds)
        });
        allLines.push({
            game: gameLabel,
            gameId: game.id,
            type: 'total',
            description: `Under ${game.total.under}`,
            odds: game.underOdds,
            category: categorizeBetRisk(game.underOdds)
        });

        // Add player props if available
        const props = MOCK_PLAYER_PROPS[game.id];
        if (props) {
            props.forEach(prop => {
                allLines.push({
                    game: gameLabel,
                    gameId: game.id,
                    type: 'player_prop',
                    description: `${prop.player} Over ${prop.line} ${prop.propType}`,
                    odds: prop.overOdds,
                    category: categorizeBetRisk(prop.overOdds)
                });
                allLines.push({
                    game: gameLabel,
                    gameId: game.id,
                    type: 'player_prop',
                    description: `${prop.player} Under ${prop.line} ${prop.propType}`,
                    odds: prop.underOdds,
                    category: categorizeBetRisk(prop.underOdds)
                });
            });
        }
    });

    return allLines;
}

// Get market lines filtered by category
function getMarketLinesByCategory(category) {
    const allLines = getAllMarketLines();
    return allLines.filter(line => line.category === category);
}

// Get market lines for specific games
function getMarketLinesForGames(gameIds, category = null) {
    const allLines = getAllMarketLines();
    let filtered = allLines.filter(line => gameIds.includes(line.gameId));

    if (category) {
        filtered = filtered.filter(line => line.category === category);
    }

    return filtered;
}

// Get market lines for same game parlay
function getSameGameMarketLines(gameId, category = null) {
    const allLines = getAllMarketLines();
    let filtered = allLines.filter(line => line.gameId === gameId);

    if (category) {
        filtered = filtered.filter(line => line.category === category);
    }

    return filtered;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MOCK_GAMES,
        MOCK_PLAYER_PROPS,
        MOCK_TEAM_PROPS,
        getRatingClass,
        formatOdds,
        getGamesByDay,
        getGameById,
        getPlayerProps,
        getTeamProps,
        categorizeBetRisk,
        getAllMarketLines,
        getMarketLinesByCategory,
        getMarketLinesForGames,
        getSameGameMarketLines
    };
}
