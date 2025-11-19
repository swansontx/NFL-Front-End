// Props Tools Page Functionality

document.addEventListener('DOMContentLoaded', () => {
    setupValueAnalyzer();
    setupPropsComparison();
});

// ==================== VALUE ANALYZER ====================

function setupValueAnalyzer() {
    const form = document.getElementById('valueAnalyzerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const playerId = document.getElementById('playerId').value.trim();
        const market = document.getElementById('market').value;
        const line = parseFloat(document.getElementById('line').value);
        const odds = parseInt(document.getElementById('odds').value);

        const resultsContainer = document.getElementById('valueResults');
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

        try {
            const result = await apiService.getPropValue({
                player_id: playerId,
                market,
                line,
                odds
            });

            displayValueResults(result);

        } catch (error) {
            console.error('Error analyzing prop value:', error);
            resultsContainer.innerHTML = `
                <div class="error-state">
                    <span class="error-icon">⚠️</span>
                    <h4>Unable to analyze prop</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    });
}

function displayValueResults(result) {
    const resultsContainer = document.getElementById('valueResults');

    const edge = result.edge || 0;
    const edgePercent = (edge * 100).toFixed(2);
    const isPositiveEdge = edge > 0;
    const edgeStrength = getEdgeStrength(edge);

    const modelProb = (result.model_probability * 100).toFixed(1);
    const impliedProb = (result.implied_probability * 100).toFixed(1);
    const kellyBet = (result.kelly_bet * 100).toFixed(2);

    resultsContainer.innerHTML = `
        <div class="value-results">
            <div class="results-header">
                <h3>Analysis Results</h3>
                <span class="edge-badge edge-${edgeStrength}">
                    ${isPositiveEdge ? '+' : ''}${edgePercent}% Edge
                </span>
            </div>

            <div class="results-grid">
                <div class="result-card">
                    <div class="result-label">Model Probability</div>
                    <div class="result-value">${modelProb}%</div>
                    <div class="result-desc">Our model's win probability</div>
                </div>

                <div class="result-card">
                    <div class="result-label">Implied Probability</div>
                    <div class="result-value">${impliedProb}%</div>
                    <div class="result-desc">Market's win probability</div>
                </div>

                <div class="result-card">
                    <div class="result-label">Edge</div>
                    <div class="result-value ${isPositiveEdge ? 'positive' : 'negative'}">
                        ${isPositiveEdge ? '+' : ''}${edgePercent}%
                    </div>
                    <div class="result-desc">${isPositiveEdge ? 'Positive value' : 'No value'}</div>
                </div>

                <div class="result-card">
                    <div class="result-label">Kelly Bet Size</div>
                    <div class="result-value">${kellyBet}%</div>
                    <div class="result-desc">% of bankroll to bet</div>
                </div>
            </div>

            <div class="recommendation-box recommendation-${edgeStrength}">
                <h4>Recommendation: ${getRecommendationText(edgeStrength)}</h4>
                <p>${getRecommendationDetails(edge, kellyBet)}</p>
            </div>

            <div class="prop-summary">
                <h4>Prop Details</h4>
                <table class="summary-table">
                    <tr>
                        <td>Player</td>
                        <td><strong>${result.player_id || 'Unknown'}</strong></td>
                    </tr>
                    <tr>
                        <td>Market</td>
                        <td>${formatMarketName(result.market)}</td>
                    </tr>
                    <tr>
                        <td>Line</td>
                        <td>${result.line}</td>
                    </tr>
                    <tr>
                        <td>Odds</td>
                        <td>${result.odds}</td>
                    </tr>
                </table>
            </div>
        </div>
    `;
}

function getEdgeStrength(edge) {
    if (edge < 0) return 'negative';
    if (edge < 0.03) return 'weak';
    if (edge < 0.05) return 'moderate';
    if (edge < 0.10) return 'strong';
    return 'excellent';
}

function getRecommendationText(strength) {
    const recommendations = {
        'negative': '⛔ Pass',
        'weak': '⚠️ Slight Edge',
        'moderate': '✅ Good Bet',
        'strong': '💪 Strong Bet',
        'excellent': '🔥 Excellent Value'
    };
    return recommendations[strength] || 'Unknown';
}

function getRecommendationDetails(edge, kellyBet) {
    if (edge < 0) {
        return 'No positive edge detected. The market\'s price is better than our model\'s assessment. Consider passing on this bet.';
    } else if (edge < 0.03) {
        return `Small edge of ${(edge * 100).toFixed(2)}%. Consider if other factors support this bet.`;
    } else if (edge < 0.05) {
        return `Decent edge of ${(edge * 100).toFixed(2)}%. Suggested bet size: ${kellyBet}% of bankroll (or 0.25-0.5x this for conservative approach).`;
    } else if (edge < 0.10) {
        return `Strong edge of ${(edge * 100).toFixed(2)}%! This represents solid value. Kelly suggests ${kellyBet}% of bankroll.`;
    } else {
        return `Exceptional edge of ${(edge * 100).toFixed(2)}%! This is rare value. Kelly suggests ${kellyBet}%, but consider betting 0.5x Kelly for safety.`;
    }
}

// ==================== PROPS COMPARISON ====================

let comparePropsCount = 2;

function setupPropsComparison() {
    const addBtn = document.getElementById('addCompareBtn');
    const compareBtn = document.getElementById('compareBtn');

    if (addBtn) {
        addBtn.addEventListener('click', addComparisonProp);
    }

    if (compareBtn) {
        compareBtn.addEventListener('click', compareProps);
    }
}

function addComparisonProp() {
    const container = document.getElementById('comparePropsContainer');
    comparePropsCount++;

    const propInput = document.createElement('div');
    propInput.className = 'compare-prop-input';
    propInput.setAttribute('data-index', comparePropsCount - 1);
    propInput.innerHTML = `
        <div class="compare-header">
            <h4>Prop #${comparePropsCount}</h4>
            <button class="remove-prop-btn" onclick="removeComparisonProp(${comparePropsCount - 1})">✕</button>
        </div>
        <div class="form-grid">
            <input type="text" class="compare-player" placeholder="Player ID" required>
            <select class="compare-market" required>
                <option value="">Market...</option>
                <option value="passing_yds">Passing Yards</option>
                <option value="rushing_yds">Rushing Yards</option>
                <option value="receiving_yds">Receiving Yards</option>
            </select>
            <input type="number" class="compare-line" placeholder="Line" step="0.5" required>
            <input type="number" class="compare-odds" placeholder="Odds" required>
        </div>
    `;

    container.appendChild(propInput);
}

function removeComparisonProp(index) {
    const propInput = document.querySelector(`.compare-prop-input[data-index="${index}"]`);
    if (propInput && comparePropsCount > 2) {
        propInput.remove();
        comparePropsCount--;
    }
}

async function compareProps() {
    const propInputs = document.querySelectorAll('.compare-prop-input');
    const props = [];

    // Collect all prop data
    for (const input of propInputs) {
        const player = input.querySelector('.compare-player').value.trim();
        const market = input.querySelector('.compare-market').value;
        const line = parseFloat(input.querySelector('.compare-line').value);
        const odds = parseInt(input.querySelector('.compare-odds').value);

        if (!player || !market || isNaN(line) || isNaN(odds)) {
            alert('Please fill in all fields for each prop');
            return;
        }

        props.push({ player_id: player, market, line, odds });
    }

    const resultsContainer = document.getElementById('compareResults');
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
        const result = await apiService.getPropsCompare(props);
        displayComparisonResults(result);

    } catch (error) {
        console.error('Error comparing props:', error);
        resultsContainer.innerHTML = `
            <div class="error-state">
                <span class="error-icon">⚠️</span>
                <h4>Unable to compare props</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function displayComparisonResults(result) {
    const resultsContainer = document.getElementById('compareResults');
    const sortedProps = result.props.sort((a, b) => (b.edge || 0) - (a.edge || 0));
    const bestProp = result.best_value || sortedProps[0];

    resultsContainer.innerHTML = `
        <div class="comparison-results">
            <div class="results-header">
                <h3>Comparison Results</h3>
                <p>Props ranked by edge (best to worst)</p>
            </div>

            <div class="comparison-table-container">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Market</th>
                            <th>Line</th>
                            <th>Odds</th>
                            <th>Model Prob</th>
                            <th>Edge</th>
                            <th>Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedProps.map((prop, index) => {
                            const edge = (prop.edge || 0) * 100;
                            const isBest = prop.player_id === bestProp.player_id &&
                                          prop.market === bestProp.market;

                            return `
                                <tr class="${isBest ? 'best-prop-row' : ''}">
                                    <td class="rank-cell">${index + 1}</td>
                                    <td>${prop.player_id || 'Unknown'}</td>
                                    <td>${formatMarketName(prop.market)}</td>
                                    <td>${prop.line}</td>
                                    <td>${prop.odds}</td>
                                    <td>${((prop.model_probability || 0) * 100).toFixed(1)}%</td>
                                    <td class="${edge >= 0 ? 'positive' : 'negative'}">
                                        ${edge >= 0 ? '+' : ''}${edge.toFixed(2)}%
                                    </td>
                                    <td>
                                        ${isBest ? '🏆 ' : ''}
                                        ${getEdgeRatingEmoji(prop.edge || 0)}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="best-value-highlight">
                <h4>🏆 Best Value</h4>
                <p>
                    <strong>${bestProp.player_id || 'Unknown'}</strong> -
                    ${formatMarketName(bestProp.market)} ${bestProp.line}
                </p>
                <p class="edge-highlight">
                    Edge: <span class="positive">+${((bestProp.edge || 0) * 100).toFixed(2)}%</span>
                </p>
            </div>
        </div>
    `;
}

function getEdgeRatingEmoji(edge) {
    if (edge < 0) return '❌';
    if (edge < 0.03) return '⚠️';
    if (edge < 0.05) return '✅';
    if (edge < 0.10) return '💪';
    return '🔥';
}

// ==================== HELPER FUNCTIONS ====================

function formatMarketName(market) {
    if (!market) return 'Unknown';
    return market
        .replace('player_', '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}
