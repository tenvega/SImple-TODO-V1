// src/components/AnalyticsDashboard.js
export class AnalyticsDashboard {
    constructor(apiService) {
        this.apiService = apiService;
        this.container = this.createDashboardElement();
        this.charts = {};
        this.initialize();
    }

    createDashboardElement() {
        const container = document.createElement('div');
        container.className = 'analytics-dashboard';
        
        container.innerHTML = `
            <div class="analytics-header">
                <h2>Analytics Dashboard</h2>
                <select id="timeframeSelect" class="timeframe-select">
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="year">Last Year</option>
                        </select>
            </div>
            
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h3>Task Overview</h3>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <div class="metric-value" id="completedTasks">0</div>
                            <div class="metric-label">Completed</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value" id="pendingTasks">0</div>
                            <div class="metric-label">Pending</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value" id="completionRate">0%</div>
                            <div class="metric-label">Completion Rate</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value" id="avgTaskTime">0h</div>
                            <div class="metric-label">Avg Time/Task</div>
                        </div>
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Time Distribution</h3>
                    <div class="chart-container">
                        <canvas id="timeDistributionChart"></canvas>
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Task Completion Trend</h3>
                    <div class="chart-container">
                        <canvas id="completionTrendChart"></canvas>
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Priority Distribution</h3>
                    <div class="chart-container">
                        <canvas id="priorityDistributionChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="analytics-insights-container">
                <div class="insights-card">
                    <h3>AI Insights</h3>
                    <div class="ai-summary">
                        <div class="ai-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div id="aiSummary">Loading AI insights...</div>
                    </div>
                    <ul class="ai-insights-list" id="aiInsightsList">
                        <li>Analyzing your productivity patterns...</li>
                    </ul>
                </div>
            </div>

            <div class="comparison-grid">
                    <div class="comparison-item">
                    <div class="comparison-label">Task Completion</div>
                        <div class="comparison-values">
                        <span class="current-value" id="taskCompletionComparison">-</span>
                        <span class="change-indicator">
                            <span class="change-arrow"></span>
                            <span class="change-value" id="taskCompletionChange">-</span>
                        </span>
                    </div>
                </div>
                <div class="comparison-item">
                    <div class="comparison-label">Focus Time</div>
                    <div class="comparison-values">
                        <span class="current-value" id="focusTimeComparison">-</span>
                        <span class="change-indicator">
                            <span class="change-arrow"></span>
                            <span class="change-value" id="focusTimeChange">-</span>
                        </span>
                        </div>
                    </div>
                    <div class="comparison-item">
                    <div class="comparison-label">Productivity Score</div>
                        <div class="comparison-values">
                        <span class="current-value" id="productivityComparison">-</span>
                        <span class="change-indicator">
                            <span class="change-arrow"></span>
                            <span class="change-value" id="productivityChange">-</span>
                        </span>
                        </div>
                    </div>
                    <div class="comparison-item">
                    <div class="comparison-label">Task Efficiency</div>
                        <div class="comparison-values">
                        <span class="current-value" id="efficiencyComparison">-</span>
                        <span class="change-indicator">
                            <span class="change-arrow"></span>
                            <span class="change-value" id="efficiencyChange">-</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        return container;
    }

    async initialize() {
        this.addEventListeners();
        await this.loadData('week'); // Default to weekly view
    }

    addEventListeners() {
        const timeframeSelect = this.container.querySelector('#timeframeSelect');
        timeframeSelect.addEventListener('change', (e) => {
            this.loadData(e.target.value);
        });
    }

    async loadData(timeframe) {
        try {
            const [taskData, timeData, aiInsights] = await Promise.all([
                this.apiService.getTaskAnalytics(timeframe).catch(() => ({
                    completed: 0,
                    total: 0,
                    completionRate: 0,
                    byPriority: {
                        counts: { high: 0, medium: 0, low: 0 },
                        completionRates: { high: 0, medium: 0, low: 0 }
                    },
                    byTag: {},
                    comparisons: {
                        tasksCreated: 0,
                        tasksCompleted: 0,
                        totalTime: 0,
                        totalSessions: 0
                    }
                })),
                this.apiService.getTimeAnalytics(timeframe).catch(() => ({
                    totalTime: 0,
                    averageTime: 0,
                    totalSessions: 0,
                    distribution: {}
                })),
                this.apiService.getAIInsights().catch(() => ({
                    summary: 'Unable to load insights',
                    insights: []
                }))
            ]);

            this.updateMetrics(taskData, timeData);
            this.updateCharts(taskData, timeData);
            this.updateAIInsights(aiInsights);
            this.updateComparisons(taskData.comparisons);
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showError('Failed to load analytics data');
        }
    }

    updateMetrics(taskData, timeData) {
        // Update task metrics
        this.container.querySelector('#completedTasks').textContent = taskData.completed || 0;
        this.container.querySelector('#pendingTasks').textContent = taskData.pending || 0;
        this.container.querySelector('#completionRate').textContent = `${taskData.completionRate || 0}%`;
        this.container.querySelector('#avgTaskTime').textContent = 
            `${Math.round((timeData.averageTime || 0) / 3600)}h`;
    }

    updateCharts(taskData = {}, timeData = {}) {
        try {
            this.updateTimeDistributionChart(timeData.distribution || {});
            this.updateCompletionTrendChart(taskData.trend || { labels: [], values: [] });
            this.updatePriorityDistributionChart(taskData.byPriority || {});
        } catch (error) {
            console.error('Error updating charts:', error);
            // Handle the error gracefully
            this.showError('Error updating analytics charts');
        }
    }

    updateTimeDistributionChart(data = {}) {
        const ctx = this.container.querySelector('#timeDistributionChart').getContext('2d');
        
        if (this.charts.timeDistribution) {
            this.charts.timeDistribution.destroy();
        }

        // Ensure data is an object
        const chartData = data || {};
        
        this.charts.timeDistribution = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(chartData),
            datasets: [{
                    data: Object.values(chartData),
                backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 206, 86, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    updateCompletionTrendChart(data = { labels: [], values: [] }) {
        const ctx = this.container.querySelector('#completionTrendChart').getContext('2d');
        
        if (this.charts.completionTrend) {
            this.charts.completionTrend.destroy();
        }

        this.charts.completionTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
            datasets: [{
                    label: 'Completed Tasks',
                    data: data.values || [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updatePriorityDistributionChart(data) {
        const ctx = this.container.querySelector('#priorityDistributionChart').getContext('2d');
        
        if (this.charts.priorityDistribution) {
            this.charts.priorityDistribution.destroy();
        }

        this.charts.priorityDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: 'Tasks by Priority',
                    data: Object.values(data),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateAIInsights(insights) {
        const summaryElement = this.container.querySelector('#aiSummary');
        const insightsList = this.container.querySelector('#aiInsightsList');
        
        summaryElement.textContent = insights.summary;
        
        insightsList.innerHTML = insights.insights
            .map(insight => `<li>${insight}</li>`)
            .join('');
    }

    updateComparisons(comparisons = {}) {
        // Ensure comparisons is an object
        const compData = comparisons || {};
        
        Object.entries(compData).forEach(([metric, data]) => {
            const valueElement = this.container.querySelector(`#${metric}Comparison`);
            const changeElement = this.container.querySelector(`#${metric}Change`);
            
            if (valueElement && changeElement) {
                const arrowElement = changeElement.previousElementSibling;
                
                valueElement.textContent = data?.current || '0';
                const change = data?.change || 0;
                changeElement.textContent = `${Math.abs(change)}%`;
                changeElement.className = `change-value ${change >= 0 ? 'positive' : 'negative'}`;
                if (arrowElement) {
                    arrowElement.className = `change-arrow ${change >= 0 ? 'positive' : 'negative'}`;
                }
            }
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'analytics-error';
        errorDiv.textContent = message;
        
        // Clear existing content and show error
        this.container.innerHTML = '';
        this.container.appendChild(errorDiv);
    }
}