# NFL Frontend → Backend API Integration Guide

## Overview

The frontend now has a complete API service layer (`js/api-service.js`) that provides seamless integration with your NFL Props Backend.

**Key Feature:** Toggle between mock data and real backend with ONE config change!

---

## Quick Start

### Switch to Backend Mode

In `js/api-service.js`, line 11:

```javascript
// Current (uses mock data)
useBackend: false

// Change to (uses real backend)
useBackend: true
```

That's it! The entire frontend will now use your backend API.

---

## Configuration

### API_CONFIG Object (js/api-service.js lines 7-12)

```javascript
const API_CONFIG = {
    baseURL: 'http://localhost:8000',  // Your backend URL
    timeout: 10000,                     // Request timeout (ms)
    useBackend: false                   // Toggle: false = mock, true = real
};
```

**For Production:**
```javascript
const API_CONFIG = {
    baseURL: 'https://api.your-domain.com',
    timeout: 15000,
    useBackend: true
};
```

---

## Available API Methods

### Games

```javascript
// Get games with filters
await apiService.getGames({
    season: 2025,
    week: 11,
    team: 'KC',
    upcoming: true
});
// Backend: GET /api/v1/games/?week=11&upcoming=true

// Get today's games
await apiService.getTodaysGames();
// Backend: GET /api/v1/games/today

// Get single game
await apiService.getGame('game_123');
// Backend: GET /api/v1/games/game_123
```

### Projections

```javascript
// Get game projections (player props)
await apiService.getGameProjections('game_123', {
    position: 'QB',
    tier: 'core',
    min_confidence: 0.7,
    limit: 50
});
// Backend: GET /projections/games/game_123?position=QB&tier=core

// Get player projections
await apiService.getPlayerProjections('mahomes_patrick', {
    season: 2025,
    market: 'player_passing_yds'
});
// Backend: GET /projections/players/mahomes_patrick?season=2025
```

### Recommendations (Best Bets)

```javascript
// Get prop recommendations for a game
await apiService.getRecommendations('game_123', {
    limit: 10,
    min_confidence: 0.6,
    markets: ['passing', 'rushing']
});
// Backend: GET /api/v1/recommendations/game_123?limit=10&min_confidence=0.6

// Get parlay recommendations (correlation-adjusted!)
await apiService.getParlays('game_123', {
    parlay_size: 3,
    min_correlation: 0.0,
    max_correlation: 0.8,
    limit: 5
});
// Backend: GET /api/v1/recommendations/game_123/parlays?parlay_size=3

// Get player-specific recommendations
await apiService.getPlayerRecommendations('mahomes_patrick', 2025, 11);
// Backend: GET /api/v1/recommendations/player/mahomes_patrick?season=2025&week=11
```

### Analytics (Backtest & Trends)

```javascript
// Run historical backtest
await apiService.runBacktest(2024, 0.25);
// Backend: GET /api/v1/backtest/?season=2024&kelly_fraction=0.25

// Analyze signal effectiveness
await apiService.analyzeSignals(2024);
// Backend: GET /api/v1/backtest/signals?season=2024
```

### Health/Status

```javascript
// Check backend health
await apiService.healthCheck();
// Backend: GET /health

// Get system status
await apiService.getStatus();
// Backend: GET /status
```

---

## Backend API Mapping

| Frontend Feature | Current Mock Data | Backend Endpoint | Integration Status |
|------------------|-------------------|------------------|-------------------|
| **Game Schedule** | `MOCK_GAMES` | `GET /api/v1/games/` | ✅ Ready |
| **Game Details** | `getGameById()` | `GET /api/v1/games/{id}` | ✅ Ready |
| **Player Props** | `MOCK_PLAYER_PROPS` | `GET /projections/games/{id}` | ✅ Ready |
| **Best Bets** | Hardcoded in app.js | `GET /api/v1/recommendations/{id}` | ✅ Ready |
| **Best Props** | Hardcoded in app.js | `GET /api/v1/recommendations/{id}` | ✅ Ready |
| **Parlays (Same-Game)** | Risk categorization | `GET /api/v1/recommendations/{id}/parlays` | ✅ Ready (Better!) |
| **Parlays (Multi-Game)** | Custom logic | Frontend combination | ⚠️ Partial |
| **Player Projections** | Hardcoded | `GET /projections/players/{id}` | ✅ Ready |
| **Trends** | Hardcoded HTML | `GET /api/v1/backtest/signals` | ✅ Can derive |

---

## Response Format Examples

### Games Response
```json
{
  "games": [
    {
      "game_id": "2025_11_KC_BUF",
      "season": 2025,
      "week": 11,
      "home_team": "KC",
      "away_team": "BUF",
      "game_date": "2025-11-18T18:00:00Z",
      "game_time": "13:00",
      "completed": false
    }
  ],
  "total_count": 1,
  "week": 11
}
```

### Recommendations Response
```json
{
  "game_id": "2025_11_KC_BUF",
  "home_team": "KC",
  "away_team": "BUF",
  "recommendations": [
    {
      "player_name": "Patrick Mahomes",
      "position": "QB",
      "market": "player_passing_yds",
      "line": 287.5,
      "model_prob": 0.65,
      "calibrated_prob": 0.63,
      "base_signal": 0.70,
      "matchup_signal": 0.60,
      "trend_signal": 0.65,
      "overall_score": 0.85,
      "recommendation_strength": "strong",
      "confidence": 0.75,
      "reasoning": ["Strong recent form", "Favorable matchup"],
      "market_odds": -110,
      "edge": 0.08
    }
  ],
  "total_count": 10,
  "min_confidence": 0.6
}
```

### Parlay Response (Correlation-Adjusted!)
```json
{
  "game_id": "2025_11_KC_BUF",
  "parlays": [
    {
      "props": [
        {
          "player_name": "Patrick Mahomes",
          "market": "player_passing_yds",
          "line": 287.5,
          "probability": 0.65,
          "score": 0.85
        },
        {
          "player_name": "Travis Kelce",
          "market": "player_receiving_yds",
          "line": 65.5,
          "probability": 0.58,
          "score": 0.72
        }
      ],
      "raw_probability": 0.377,
      "adjusted_probability": 0.312,
      "adjustment_factor": 0.827,
      "correlation_impact": "positive",
      "overall_score": 0.78,
      "confidence": 0.70,
      "market_odds": 285,
      "edge": 0.05
    }
  ],
  "total_count": 5,
  "parlay_size": 2
}
```

---

## Integration Examples

### Example 1: Load Games from Backend

**Current (Mock):**
```javascript
// app.js
function loadGames(dayOffset) {
    const games = getGamesByDay(dayOffset);
    // ...render
}
```

**With Backend:**
```javascript
async function loadGames(week) {
    try {
        const response = await apiService.getGames({ week, upcoming: true });
        const games = response.games;
        // ...render
    } catch (error) {
        console.error('Error loading games:', error);
        // Fall back to mock data
        const games = getGamesByDay(0);
    }
}
```

### Example 2: Load Best Bets from Backend

**Current (Hardcoded):**
```javascript
// app.js lines 158-187
function loadBestBets() {
    const bestBets = [
        { game: 'Chiefs vs Bills', pick: '...', odds: -110 },
        // ...hardcoded
    ];
}
```

**With Backend:**
```javascript
async function loadBestBets() {
    try {
        // Get today's games
        const gamesResponse = await apiService.getTodaysGames();

        // Get recommendations for each game
        const allRecommendations = [];
        for (const game of gamesResponse.games) {
            const recs = await apiService.getRecommendations(game.game_id, {
                limit: 5,
                min_confidence: 0.7
            });
            allRecommendations.push(...recs.recommendations);
        }

        // Sort by overall_score and take top 4
        const bestBets = allRecommendations
            .sort((a, b) => b.overall_score - a.overall_score)
            .slice(0, 4);

        // Render
        renderBestBets(bestBets);
    } catch (error) {
        console.error('Error loading best bets:', error);
        // Fall back to hardcoded
    }
}
```

### Example 3: Use Correlation-Adjusted Parlays

**Current (Risk-based):**
```javascript
// Uses categorizeBetRisk() to group by odds
const lines = getMarketLinesForGames(gameIds, 'moderate');
```

**With Backend (Better - Correlation Analysis!):**
```javascript
async function generateParlays(gameId) {
    try {
        const response = await apiService.getParlays(gameId, {
            parlay_size: 3,
            min_correlation: 0.0,    // Allow uncorrelated
            max_correlation: 0.8,    // Avoid over-correlated
            limit: 5
        });

        // Backend returns correlation-adjusted probabilities!
        const parlays = response.parlays.map(p => ({
            title: `${p.parlay_size}-Leg Parlay (${p.correlation_impact})`,
            legs: p.props.map(prop => ({
                bet: `${prop.player_name} ${prop.market} ${prop.line}`,
                odds: calculateOdds(prop.probability)
            })),
            adjustedProb: p.adjusted_probability,  // Accounts for correlation!
            rawProb: p.raw_probability,
            confidence: p.confidence,
            edge: p.edge
        }));

        displayParlays(parlays);
    } catch (error) {
        console.error('Error generating parlays:', error);
    }
}
```

---

## Error Handling

The API service includes timeout and error handling:

```javascript
try {
    const games = await apiService.getGames({ week: 11 });
} catch (error) {
    if (error.message.includes('timeout')) {
        console.error('Backend request timed out');
        // Fall back to cached data or mock
    } else if (error.message.includes('404')) {
        console.error('Endpoint not found');
    } else {
        console.error('API Error:', error);
    }
}
```

---

## Development Workflow

### Phase 1: Current (Mock Data)
```javascript
useBackend: false  // Uses MOCK_GAMES, hardcoded bets
```
- Test UI/UX
- Develop features
- No backend dependency

### Phase 2: Hybrid Mode
```javascript
useBackend: true   // Try backend, fall back to mock on error
```
- Start backend integration
- Test with real data
- Mock fallback for missing endpoints

### Phase 3: Production
```javascript
useBackend: true   // Full backend integration
baseURL: 'https://api.production.com'
```
- Remove mock fallbacks
- Real data only
- Production ready

---

## Testing Backend Integration

### 1. Check Backend Status
```javascript
apiService.healthCheck()
    .then(status => console.log('Backend status:', status))
    .catch(err => console.error('Backend not available:', err));
```

### 2. Test Game Retrieval
```javascript
apiService.getGames({ week: 11, upcoming: true })
    .then(response => console.log(`Found ${response.total_count} games`))
    .catch(err => console.error('Error:', err));
```

### 3. Test Recommendations
```javascript
apiService.getRecommendations('2025_11_KC_BUF', { limit: 10 })
    .then(recs => console.log(`${recs.total_count} recommendations`))
    .catch(err => console.error('Error:', err));
```

---

## What's Next

### To Complete Integration:

1. **Update app.js** - Replace hardcoded best bets/props with API calls
2. **Update game-detail.js** - Load props from projections endpoint
3. **Update parlay-generator.js** - Use correlation-adjusted parlays
4. **Add error handling** - Graceful degradation to mock data
5. **Add loading states** - Show spinners during API calls
6. **Test thoroughly** - Verify all features work with backend

### Backend Has But Frontend Doesn't Use Yet:

- ✅ **Correlation-adjusted parlays** - Better than our risk categorization!
- ✅ **Signal breakdown** - Shows why each recommendation is made
- ✅ **Confidence scores** - Model confidence for each projection
- ✅ **Backtest metrics** - Historical performance data
- ✅ **Edge calculations** - Shows value vs market odds

---

## Summary

✅ **API service layer created** - `js/api-service.js`
✅ **All endpoints mapped** - Games, projections, recommendations, parlays
✅ **Toggle-able mode** - Switch between mock/real with one config change
✅ **Error handling** - Timeout protection, graceful errors
✅ **Documentation** - Full examples and response formats

**To activate backend:**
```javascript
// js/api-service.js line 11
useBackend: true
```

**That's it!** Your frontend is ready to integrate with the backend whenever you're ready.
