/**
 * NFL Backend API Service
 *
 * Handles all communication with the NFL Props Backend API.
 * Supports both mock data (for development) and real backend integration.
 *
 * To switch between mock and real data, toggle USE_BACKEND constant.
 */

// Configuration
const API_CONFIG = {
    baseURL: 'http://localhost:8000',
    timeout: 10000, // 10 seconds
    useBackend: true // Set to true to use real backend, false for mock data
};

/**
 * API Service Class
 * Provides methods for all frontend data needs
 */
class NFLAPIService {
    constructor(config = API_CONFIG) {
        this.baseURL = config.baseURL;
        this.timeout = config.timeout;
        this.useBackend = config.useBackend;
    }

    /**
     * Generic fetch wrapper with timeout and error handling
     */
    async _fetch(endpoint, options = {}) {
        if (!this.useBackend) {
            throw new Error('Backend mode disabled. Using mock data.');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const url = `${this.baseURL}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('API request timeout');
            }
            throw error;
        }
    }

    /**
     * Health Check
     * GET /health
     */
    async healthCheck() {
        if (!this.useBackend) return { status: 'mock' };
        return await this._fetch('/health');
    }

    /**
     * Get System Status
     * GET /status
     */
    async getStatus() {
        if (!this.useBackend) return { mode: 'mock', backend: false };
        return await this._fetch('/status');
    }

    // ==================== GAMES ====================

    /**
     * Get list of games with optional filters
     * GET /api/v1/games/
     *
     * @param {Object} filters - Optional filters
     * @param {number} filters.season - Season year
     * @param {number} filters.week - Week number (1-18)
     * @param {string} filters.team - Team abbreviation
     * @param {string} filters.date - Date (YYYY-MM-DD)
     * @param {boolean} filters.upcoming - Only upcoming games
     */
    async getGames(filters = {}) {
        if (!this.useBackend) {
            // Use mock data
            const games = getGamesByFilters(filters);
            return {
                games: games,
                total_count: games.length,
                season: filters.season || null,
                week: filters.week || null,
                team: filters.team || null,
                date: filters.date || null
            };
        }

        const params = new URLSearchParams();
        if (filters.season) params.append('season', filters.season);
        if (filters.week) params.append('week', filters.week);
        if (filters.team) params.append('team', filters.team);
        if (filters.date) params.append('date', filters.date);
        if (filters.upcoming !== undefined) params.append('upcoming', filters.upcoming);

        const query = params.toString() ? `?${params.toString()}` : '';
        return await this._fetch(`/api/v1/games/${query}`);
    }

    /**
     * Get today's games
     * GET /api/v1/games/today
     */
    async getTodaysGames() {
        if (!this.useBackend) {
            return this.getGames({ date: getCurrentDate() });
        }
        return await this._fetch('/api/v1/games/today');
    }

    /**
     * Get single game by ID
     * GET /api/v1/games/{game_id}
     */
    async getGame(gameId) {
        if (!this.useBackend) {
            const game = getGameById(gameId);
            if (!game) throw new Error(`Game ${gameId} not found`);
            return this._convertGameToBackendFormat(game);
        }
        return await this._fetch(`/api/v1/games/${gameId}`);
    }

    // ==================== PROPS & PROJECTIONS ====================

    /**
     * Get prop sheet for a specific game (all betting props)
     * GET /api/v1/games/{game_id}/prop-sheet
     *
     * @param {string} gameId - Game identifier
     */
    async getGamePropSheet(gameId) {
        if (!this.useBackend) {
            return {
                game_id: gameId,
                props: []
            };
        }

        return await this._fetch(`/api/v1/games/${gameId}/prop-sheet`);
    }

    /**
     * Get projections for a specific game
     * GET /api/v1/games/{game_id}/projections
     *
     * @param {string} gameId - Game identifier
     * @param {Object} filters - Optional filters
     * @param {string} filters.market - Market type (e.g., player_rec_yds)
     * @param {string} filters.tier - Tier (core/mid/lotto)
     * @param {string} filters.position - Position (QB/RB/WR/TE)
     * @param {number} filters.min_confidence - Minimum confidence (0.0-1.0)
     * @param {number} filters.limit - Max results (default 100)
     */
    async getGameProjections(gameId, filters = {}) {
        if (!this.useBackend) {
            const props = getPlayerProps(gameId);
            return {
                game_id: gameId,
                home_team: 'KC',
                away_team: 'BUF',
                game_date: new Date().toISOString(),
                total_projections: props ? props.length : 0,
                projections: props ? this._convertPropsToProjections(props) : []
            };
        }

        const params = new URLSearchParams();
        if (filters.market) params.append('market', filters.market);
        if (filters.tier) params.append('tier', filters.tier);
        if (filters.position) params.append('position', filters.position);
        if (filters.min_confidence !== undefined) params.append('min_confidence', filters.min_confidence);
        if (filters.limit) params.append('limit', filters.limit);

        const query = params.toString() ? `?${params.toString()}` : '';
        return await this._fetch(`/api/v1/games/${gameId}/projections${query}`);
    }

    /**
     * Get projections for a specific player
     * GET /projections/players/{player_id}
     *
     * @param {string} playerId - Player identifier
     * @param {Object} filters - Optional filters
     * @param {number} filters.season - Season year
     * @param {string} filters.market - Market type
     * @param {number} filters.limit - Max results (default 20)
     */
    async getPlayerProjections(playerId, filters = {}) {
        if (!this.useBackend) {
            // Mock data - return empty for now
            return {
                player_id: playerId,
                player_name: 'Mock Player',
                team: 'KC',
                position: 'QB',
                season: 2025,
                total_projections: 0,
                projections: []
            };
        }

        const params = new URLSearchParams();
        if (filters.season) params.append('season', filters.season);
        if (filters.market) params.append('market', filters.market);
        if (filters.limit) params.append('limit', filters.limit);

        const query = params.toString() ? `?${params.toString()}` : '';
        return await this._fetch(`/api/v1/players/${playerId}/projections${query}`);
    }

    /**
     * Analyze prop value (edge analysis)
     * GET /api/v1/props/value
     *
     * @param {Object} options - Prop details
     * @param {string} options.player_id - Player identifier
     * @param {string} options.market - Market type (passing_yds, rushing_yds, etc.)
     * @param {number} options.line - Sportsbook line
     * @param {number} options.odds - Sportsbook odds (e.g., -110)
     */
    async getPropValue(options) {
        if (!this.useBackend) {
            return {
                player_id: options.player_id,
                market: options.market,
                line: options.line,
                odds: options.odds,
                model_probability: 0.55,
                implied_probability: 0.52,
                edge: 0.03,
                kelly_bet: 0.06,
                recommendation: 'slight_edge'
            };
        }

        const params = new URLSearchParams();
        if (options.player_id) params.append('player_id', options.player_id);
        if (options.market) params.append('market', options.market);
        if (options.line !== undefined) params.append('line', options.line);
        if (options.odds !== undefined) params.append('odds', options.odds);

        const query = params.toString() ? `?${params.toString()}` : '';
        return await this._fetch(`/api/v1/props/value${query}`);
    }

    /**
     * Compare multiple props side-by-side
     * POST /api/v1/props/compare
     *
     * @param {Array} props - Array of prop objects to compare
     * Each prop should have: { player_id, market, line, odds }
     */
    async getPropsCompare(props) {
        if (!this.useBackend) {
            return {
                props: props.map(p => ({
                    ...p,
                    model_probability: 0.55,
                    edge: 0.03,
                    rank: 1
                })),
                best_value: props[0]
            };
        }

        return await this._fetch('/api/v1/props/compare', {
            method: 'POST',
            body: JSON.stringify({ props })
        });
    }

    /**
     * Get trending props (line movement tracking)
     * GET /api/v1/props/trending
     *
     * @param {Object} options - Query parameters
     * @param {number} options.week - Week number
     * @param {number} options.limit - Max results (default 20)
     */
    async getPropsTrending(options = {}) {
        if (!this.useBackend) {
            return {
                week: options.week,
                trending_props: [],
                total_count: 0
            };
        }

        const params = new URLSearchParams();
        if (options.week) params.append('week', options.week);
        if (options.limit) params.append('limit', options.limit);

        const query = params.toString() ? `?${params.toString()}` : '';
        return await this._fetch(`/api/v1/props/trending${query}`);
    }

    /**
     * Get current odds from DraftKings
     * GET /api/v1/odds/current
     *
     * @param {Object} options - Query parameters
     * @param {number} options.week - Week number
     * @param {string} options.market - Market type (optional)
     */
    async getCurrentOdds(options = {}) {
        if (!this.useBackend) {
            return {
                week: options.week,
                odds: [],
                last_updated: new Date().toISOString()
            };
        }

        const params = new URLSearchParams();
        if (options.week) params.append('week', options.week);
        if (options.market) params.append('market', options.market);

        const query = params.toString() ? `?${params.toString()}` : '';
        return await this._fetch(`/api/v1/odds/current${query}`);
    }

    /**
     * Get NFL standings
     * GET /api/v1/standings
     *
     * @param {Object} options - Query parameters
     * @param {number} options.season - Season year (default current)
     * @param {number} options.week - Week number (optional)
     */
    async getStandings(options = {}) {
        if (!this.useBackend) {
            return {
                season: options.season || 2024,
                week: options.week,
                divisions: []
            };
        }

        const params = new URLSearchParams();
        if (options.season) params.append('season', options.season);
        if (options.week) params.append('week', options.week);

        const query = params.toString() ? `?${params.toString()}` : '';
        return await this._fetch(`/api/v1/standings${query}`);
    }

    // ==================== RECOMMENDATIONS ====================

    /**
     * Get prop recommendations for a game (Best Bets)
     * GET /api/v1/recommendations/{game_id}
     *
     * @param {string} gameId - Game identifier
     * @param {Object} options - Optional parameters
     * @param {number} options.limit - Max recommendations (default 10)
     * @param {number} options.min_confidence - Min confidence threshold (default 0.6)
     * @param {string[]} options.markets - Specific markets to analyze
     */
    async getRecommendations(gameId, options = {}) {
        if (!this.useBackend) {
            // Use hardcoded best bets from app.js style
            return {
                game_id: gameId,
                home_team: 'KC',
                away_team: 'BUF',
                recommendations: this._getMockRecommendations(),
                total_count: 4,
                generated_at: new Date().toISOString(),
                markets_analyzed: ['passing', 'rushing', 'receiving'],
                min_confidence: options.min_confidence || 0.6
            };
        }

        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit);
        if (options.min_confidence !== undefined) params.append('min_confidence', options.min_confidence);
        if (options.markets && options.markets.length) {
            params.append('markets', options.markets.join(','));
        }

        const query = params.toString() ? `?${params.toString()}` : '';
        return await this._fetch(`/api/v1/recommendations/${gameId}${query}`);
    }

    /**
     * Get parlay recommendations for a game
     * GET /api/v1/recommendations/{game_id}/parlays
     *
     * @param {string} gameId - Game identifier
     * @param {Object} options - Parlay parameters
     * @param {number} options.parlay_size - Number of props (2-6, default 3)
     * @param {number} options.min_correlation - Min correlation (default 0.0)
     * @param {number} options.max_correlation - Max correlation (default 0.8)
     * @param {number} options.limit - Max parlays (default 5)
     */
    async getParlays(gameId, options = {}) {
        if (!this.useBackend) {
            // Use existing parlay generator logic
            return {
                game_id: gameId,
                parlays: [],
                total_count: 0,
                parlay_size: options.parlay_size || 3,
                min_correlation: options.min_correlation || 0.0,
                max_correlation: options.max_correlation || 0.8,
                generated_at: new Date().toISOString()
            };
        }

        const params = new URLSearchParams();
        if (options.parlay_size) params.append('parlay_size', options.parlay_size);
        if (options.min_correlation !== undefined) params.append('min_correlation', options.min_correlation);
        if (options.max_correlation !== undefined) params.append('max_correlation', options.max_correlation);
        if (options.limit) params.append('limit', options.limit);

        const query = params.toString() ? `?${params.toString()}` : '';
        return await this._fetch(`/api/v1/recommendations/${gameId}/parlays${query}`);
    }

    /**
     * Get multi-game parlay recommendations
     * This requires calling parlays for multiple games and combining
     *
     * @param {string[]} gameIds - Array of game IDs
     * @param {Object} options - Parlay options
     */
    async getMultiGameParlays(gameIds, options = {}) {
        if (!this.useBackend) {
            // Use existing multi-game parlay logic from parlay-generator.js
            const selectedCategory = options.category || 'moderate';
            const numLegs = options.numLegs || 3;
            const availableLines = getMarketLinesForGames(gameIds, selectedCategory);

            return {
                game_ids: gameIds,
                parlays: [], // Would use existing parlay generation logic
                total_count: 0,
                generated_at: new Date().toISOString()
            };
        }

        // For multi-game parlays, we need to fetch recommendations from each game
        // and combine them on the frontend (backend doesn't have multi-game endpoint yet)
        const allRecommendations = await Promise.all(
            gameIds.map(gameId => this.getRecommendations(gameId, { limit: 20 }))
        );

        // Combine and return (frontend will handle combination logic)
        return {
            game_ids: gameIds,
            all_recommendations: allRecommendations,
            generated_at: new Date().toISOString()
        };
    }

    /**
     * Get recommendations for a specific player
     * GET /api/v1/recommendations/player/{player_id}
     *
     * @param {string} playerId - Player identifier
     * @param {number} season - Season year (required)
     * @param {number} week - Optional week filter
     */
    async getPlayerRecommendations(playerId, season, week = null) {
        if (!this.useBackend) {
            return [];
        }

        const params = new URLSearchParams({ season: season.toString() });
        if (week) params.append('week', week);

        return await this._fetch(`/api/v1/recommendations/player/${playerId}?${params.toString()}`);
    }

    // ==================== NEWS & INJURIES ====================

    /**
     * Get news and injury updates
     * GET /api/v1/news
     *
     * @param {Object} options - Query parameters
     * @param {number} options.limit - Max items (default 20)
     * @param {string} options.category - Filter by category (injury|news|analysis)
     * @param {string} options.team - Filter by team abbreviation
     */
    async getNews(options = {}) {
        if (!this.useBackend) {
            return [];
        }

        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit);
        if (options.category) params.append('category', options.category);
        if (options.team) params.append('team', options.team);

        const query = params.toString() ? `?${params.toString()}` : '';
        return await this._fetch(`/api/v1/news${query}`);
    }

    /**
     * Get injury report for a specific game
     * GET /api/v1/games/{game_id}/injuries
     *
     * @param {string} gameId - Game identifier
     */
    async getGameInjuries(gameId) {
        if (!this.useBackend) {
            return {
                game_id: gameId,
                away_team: '',
                home_team: '',
                away_injuries: [],
                home_injuries: [],
                last_updated: new Date().toISOString()
            };
        }

        return await this._fetch(`/api/v1/games/${gameId}/injuries`);
    }

    /**
     * Get weather data for a specific game
     * GET /api/v1/games/{game_id}/weather
     *
     * @param {string} gameId - Game identifier
     */
    async getGameWeather(gameId) {
        if (!this.useBackend) {
            return {
                temperature: 65,
                temp_unit: 'F',
                condition: 'Clear',
                wind_speed: 5,
                wind_unit: 'mph',
                humidity: 50,
                precipitation_chance: 0,
                is_dome: false
            };
        }

        return await this._fetch(`/api/v1/games/${gameId}/weather`);
    }

    /**
     * Get game insights and matchup analysis
     * GET /api/v1/games/{game_id}/insights
     *
     * @param {string} gameId - Game identifier
     */
    async getGameInsights(gameId) {
        if (!this.useBackend) {
            return [];
        }

        return await this._fetch(`/api/v1/games/${gameId}/insights`);
    }

    /**
     * Get game narratives
     * GET /api/v1/games/{game_id}/narrative
     *
     * @param {string} gameId - Game identifier
     */
    async getGameNarrative(gameId) {
        if (!this.useBackend) {
            return [];
        }

        return await this._fetch(`/api/v1/games/${gameId}/narrative`);
    }

    /**
     * Get related content (articles, videos)
     * GET /api/v1/games/{game_id}/content
     *
     * @param {string} gameId - Game identifier
     * @param {Object} options - Query parameters
     * @param {string} options.content_type - Filter by type (article|video|podcast)
     * @param {number} options.limit - Max items (default 10)
     */
    async getGameContent(gameId, options = {}) {
        if (!this.useBackend) {
            return [];
        }

        const params = new URLSearchParams();
        if (options.content_type) params.append('content_type', options.content_type);
        if (options.limit) params.append('limit', options.limit);

        const query = params.toString() ? `?${params.toString()}` : '';
        return await this._fetch(`/api/v1/games/${gameId}/content${query}`);
    }

    // ==================== TEAMS ====================

    /**
     * Get all NFL teams
     * GET /api/v1/teams
     */
    async getTeams() {
        if (!this.useBackend) {
            return [];
        }

        return await this._fetch('/api/v1/teams');
    }

    /**
     * Get team details
     * GET /api/v1/teams/{team_id}
     *
     * @param {string} teamId - Team identifier (e.g., "KC", "BUF")
     */
    async getTeamDetails(teamId) {
        if (!this.useBackend) {
            return {
                team_id: teamId,
                team_name: '',
                conference: '',
                division: '',
                wins: 0,
                losses: 0,
                ties: 0
            };
        }

        return await this._fetch(`/api/v1/teams/${teamId}`);
    }

    /**
     * Get team statistics
     * GET /api/v1/teams/{team_id}/stats
     *
     * @param {string} teamId - Team identifier
     * @param {number} season - Season year (default current season)
     */
    async getTeamStats(teamId, season = 2024) {
        if (!this.useBackend) {
            return {
                team_id: teamId,
                season: season,
                offensive_stats: {},
                defensive_stats: {},
                rankings: {}
            };
        }

        const params = new URLSearchParams({ season: season.toString() });
        return await this._fetch(`/api/v1/teams/${teamId}/stats?${params.toString()}`);
    }

    /**
     * Get team schedule
     * GET /api/v1/teams/{team_id}/schedule
     *
     * @param {string} teamId - Team identifier
     * @param {number} season - Season year (default current season)
     */
    async getTeamSchedule(teamId, season = 2024) {
        if (!this.useBackend) {
            return {
                team_id: teamId,
                season: season,
                games: []
            };
        }

        const params = new URLSearchParams({ season: season.toString() });
        return await this._fetch(`/api/v1/teams/${teamId}/schedule?${params.toString()}`);
    }

    /**
     * Get team news
     * GET /api/v1/teams/{team_id}/news
     *
     * @param {string} teamId - Team identifier
     * @param {number} limit - Max number of news items (default 20)
     */
    async getTeamNews(teamId, limit = 20) {
        if (!this.useBackend) {
            return [];
        }

        const params = new URLSearchParams({ limit: limit.toString() });
        return await this._fetch(`/api/v1/teams/${teamId}/news?${params.toString()}`);
    }

    // ==================== PLAYERS ====================

    /**
     * Search/filter players
     * GET /api/v1/players
     *
     * @param {Object} options - Query parameters
     * @param {string} options.team - Filter by team
     * @param {string} options.position - Filter by position
     * @param {string} options.search - Search by name
     * @param {number} options.limit - Max results
     */
    async getPlayers(options = {}) {
        if (!this.useBackend) {
            return [];
        }

        const params = new URLSearchParams();
        if (options.team) params.append('team', options.team);
        if (options.position) params.append('position', options.position);
        if (options.search) params.append('search', options.search);
        if (options.limit) params.append('limit', options.limit);

        const query = params.toString() ? `?${params.toString()}` : '';
        return await this._fetch(`/api/v1/players${query}`);
    }

    /**
     * Get player details
     * GET /api/v1/players/{player_id}
     *
     * @param {string} playerId - Player identifier
     */
    async getPlayerDetails(playerId) {
        if (!this.useBackend) {
            return {
                player_id: playerId,
                player_name: '',
                team: '',
                position: '',
                jersey_number: null
            };
        }

        return await this._fetch(`/api/v1/players/${playerId}`);
    }

    /**
     * Get player statistics
     * GET /api/v1/players/{player_id}/stats
     *
     * @param {string} playerId - Player identifier
     * @param {number} season - Season year (default current season)
     */
    async getPlayerStats(playerId, season = 2024) {
        if (!this.useBackend) {
            return {
                player_id: playerId,
                season: season,
                stats: {}
            };
        }

        const params = new URLSearchParams({ season: season.toString() });
        return await this._fetch(`/api/v1/players/${playerId}/stats?${params.toString()}`);
    }

    /**
     * Get player game logs
     * GET /api/v1/players/{player_id}/gamelogs
     *
     * @param {string} playerId - Player identifier
     * @param {number} season - Season year (default current season)
     * @param {number} limit - Max games to return
     */
    async getPlayerGameLog(playerId, season = 2024, limit = null) {
        if (!this.useBackend) {
            return {
                player_id: playerId,
                season: season,
                games: []
            };
        }

        const params = new URLSearchParams({ season: season.toString() });
        if (limit) params.append('limit', limit);

        return await this._fetch(`/api/v1/players/${playerId}/gamelogs?${params.toString()}`);
    }

    /**
     * Get player-specific insights and analysis
     * GET /api/v1/players/{player_id}/insights
     *
     * @param {string} playerId - Player identifier
     */
    async getPlayerInsights(playerId) {
        if (!this.useBackend) {
            return {
                player_id: playerId,
                insights: []
            };
        }

        return await this._fetch(`/api/v1/players/${playerId}/insights`);
    }

    // ==================== BOX SCORES ====================

    /**
     * Get detailed box score for a game
     * GET /api/v1/games/{game_id}/boxscore
     *
     * @param {string} gameId - Game identifier
     */
    async getBoxScore(gameId) {
        if (!this.useBackend) {
            return {
                game_id: gameId,
                away_team: '',
                home_team: '',
                away_score: 0,
                home_score: 0,
                quarter_scores: [],
                team_stats: {},
                top_performers: []
            };
        }

        return await this._fetch(`/api/v1/games/${gameId}/boxscore`);
    }

    // ==================== BACKTEST (Analytics/Trends) ====================

    /**
     * Run historical backtest
     * GET /api/v1/backtest/
     *
     * @param {number} season - Season to backtest
     * @param {number} kelly_fraction - Kelly fraction for betting (0.1-1.0, default 0.25)
     */
    async runBacktest(season, kelly_fraction = 0.25) {
        if (!this.useBackend) {
            return {
                start_date: new Date(season, 8, 1).toISOString(),
                end_date: new Date(season + 1, 1, 1).toISOString(),
                total_games: 272,
                total_projections: 2500,
                markets_tested: ['passing', 'rushing', 'receiving'],
                metrics: {
                    brier_score: 0.15,
                    log_loss: 0.45,
                    roc_auc: 0.72,
                    total_bets: 250,
                    winning_bets: 142,
                    win_rate: 0.568,
                    roi_percent: 12.5,
                    sharpe_ratio: 1.8,
                    max_drawdown_percent: -8.2,
                    initial_bankroll: 1000,
                    final_bankroll: 1125,
                    total_profit: 125
                },
                kelly_fraction: kelly_fraction,
                generated_at: new Date().toISOString()
            };
        }

        const params = new URLSearchParams({ season: season.toString() });
        if (kelly_fraction) params.append('kelly_fraction', kelly_fraction);

        return await this._fetch(`/api/v1/backtest/?${params.toString()}`);
    }

    /**
     * Analyze signal effectiveness
     * GET /api/v1/backtest/signals
     *
     * @param {number} season - Season to analyze
     */
    async analyzeSignals(season) {
        if (!this.useBackend) {
            return {
                signal_contributions: [
                    { signal_name: 'base', standalone_auc: 0.68, standalone_brier: 0.18, correlation: 1.0, optimal_weight: 0.35, mean_value: 0.5, std_value: 0.15 },
                    { signal_name: 'matchup', standalone_auc: 0.64, standalone_brier: 0.21, correlation: 0.45, optimal_weight: 0.25, mean_value: 0.48, std_value: 0.18 },
                    { signal_name: 'trend', standalone_auc: 0.61, standalone_brier: 0.23, correlation: 0.38, optimal_weight: 0.20, mean_value: 0.52, std_value: 0.16 },
                    { signal_name: 'news', standalone_auc: 0.58, standalone_brier: 0.25, correlation: 0.22, optimal_weight: 0.15, mean_value: 0.45, std_value: 0.22 },
                    { signal_name: 'roster', standalone_auc: 0.56, standalone_brier: 0.26, correlation: 0.28, optimal_weight: 0.05, mean_value: 0.43, std_value: 0.19 }
                ],
                combined_auc: 0.72,
                combined_brier: 0.15,
                best_signal_name: 'base',
                best_signal_auc: 0.68,
                optimal_weights: { base: 0.35, matchup: 0.25, trend: 0.20, news: 0.15, roster: 0.05 },
                n_samples: 2500
            };
        }

        return await this._fetch(`/api/v1/backtest/signals?season=${season}`);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Convert mock game format to backend format
     */
    _convertGameToBackendFormat(game) {
        return {
            game_id: game.id,
            season: 2025,
            week: 11,
            game_type: 'REG',
            home_team: game.homeTeam,
            away_team: game.awayTeam,
            game_date: game.date,
            game_time: game.time,
            stadium: null,
            home_score: null,
            away_score: null,
            completed: false,
            weather: null
        };
    }

    /**
     * Convert mock props to projection format
     */
    _convertPropsToProjections(props) {
        return props.map(prop => ({
            player_id: prop.player.toLowerCase().replace(' ', '_'),
            player_name: prop.player,
            team: prop.team,
            position: this._getPositionFromCategory(prop.category),
            market: `player_${prop.category}_${prop.propType.toLowerCase().replace(' ', '_')}`,
            mu: prop.line,
            sigma: null,
            prob_over_line: null,
            confidence: this._ratingToConfidence(prop.rating),
            usage_norm: null,
            tier: this._ratingToTier(prop.rating),
            score: null,
            model_version: 'v1'
        }));
    }

    /**
     * Get mock recommendations
     */
    _getMockRecommendations() {
        return [
            {
                player_id: 'mahomes_patrick',
                player_name: 'Patrick Mahomes',
                position: 'QB',
                team: 'KC',
                game_id: '1',
                market: 'player_passing_yds',
                line: 287.5,
                model_prob: 0.65,
                calibrated_prob: 0.63,
                base_signal: 0.70,
                matchup_signal: 0.60,
                trend_signal: 0.65,
                news_signal: 0.50,
                roster_signal: 0.55,
                overall_score: 0.85,
                recommendation_strength: 'strong',
                confidence: 0.75,
                reasoning: ['Strong recent form', 'Favorable matchup'],
                flags: [],
                market_line: 287.5,
                market_odds: -110,
                edge: 0.08
            }
        ];
    }

    _getPositionFromCategory(category) {
        const map = {
            'passing': 'QB',
            'rushing': 'RB',
            'receiving': 'WR',
            'defensive': 'LB'
        };
        return map[category] || 'FLEX';
    }

    _ratingToConfidence(rating) {
        const map = {
            'excellent': 0.9,
            'good': 0.75,
            'moderate': 0.6,
            'poor': 0.4
        };
        return map[rating] || 0.5;
    }

    _ratingToTier(rating) {
        const map = {
            'excellent': 'core',
            'good': 'core',
            'moderate': 'mid',
            'poor': 'lotto'
        };
        return map[rating] || 'mid';
    }
}

// Helper function to get current date in YYYY-MM-DD format
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// Helper function to filter games (uses existing mock data functions)
function getGamesByFilters(filters) {
    let games = MOCK_GAMES;

    if (filters.week) {
        // Filter by week (would need week data in mock)
        games = games;
    }

    if (filters.team) {
        games = games.filter(g =>
            g.homeTeam === filters.team || g.awayTeam === filters.team
        );
    }

    if (filters.date) {
        games = games.filter(g => g.date === filters.date);
    }

    if (filters.upcoming) {
        games = games.filter(g => g.status === 'Upcoming');
    }

    return games;
}

// Create singleton instance
const apiService = new NFLAPIService(API_CONFIG);

// Export for use in other files
if (typeof window !== 'undefined') {
    window.apiService = apiService;
    window.API_CONFIG = API_CONFIG;
}
