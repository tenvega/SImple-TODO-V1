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
                            <div class="metric-value" id="avgTaskTime">0m</div>
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
            console.log('Loading analytics data for timeframe:', timeframe);
            const [taskData, timeData, aiInsights] = await Promise.all([
                this.apiService.getTaskAnalytics(timeframe).catch(err => {
                    console.error('Error fetching task analytics:', err);
                    return {
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
                    };
                }),
                this.apiService.getTimeAnalytics(timeframe).catch(err => {
                    console.error('Error fetching time analytics:', err);
                    return {
                        totalTime: 0,
                        averageTime: 0,
                        totalSessions: 0,
                        distribution: {}
                    };
                }),
                this.apiService.getAIInsights().catch(err => {
                    console.error('Error fetching AI insights:', err);
                    return {
                        summary: 'Unable to load insights',
                        insights: []
                    };
                })
            ]);

            console.log('Received task data:', taskData);
            console.log('Received time data:', timeData);
            console.log('Received AI insights:', aiInsights);

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
        console.log('Updating metrics with:', { taskData, timeData });
        // Update task metrics using the overview object
        const overview = taskData.overview || {};
        this.container.querySelector('#completedTasks').textContent = overview.completedTasks || 0;
        this.container.querySelector('#pendingTasks').textContent = overview.totalTasks - overview.completedTasks || 0;
        this.container.querySelector('#completionRate').textContent = `${overview.completionRate?.toFixed(1) || 0}%`;
        this.container.querySelector('#avgTaskTime').textContent = 
            `${Math.round((overview.avgTimePerTask || 0))}m`;
    }

    updateCharts(taskData = {}, timeData = {}) {
        try {
            console.log('Updating charts with:', { taskData, timeData });
            
            // Time distribution chart (using byTask from timeData)
            const timeByTask = timeData.byTask || {};
            const timeDistribution = Object.entries(timeByTask).reduce((acc, [_, task]) => {
                acc[task.title] = Math.round(task.totalTime / 60); // Convert seconds to minutes
                return acc;
            }, {});
            this.updateTimeDistributionChart(timeDistribution);
            
            // Completion trend chart (using tasks by priority)
            const priorityCounts = taskData.byPriority?.counts || { high: 0, medium: 0, low: 0 };
            const trend = {
                labels: ['High', 'Medium', 'Low'],
                values: [priorityCounts.high || 0, priorityCounts.medium || 0, priorityCounts.low || 0]
            };
            this.updateCompletionTrendChart(trend);
            
            // Priority distribution chart
            this.updatePriorityDistributionChart(priorityCounts);
            
            // Update comparison metrics
            if (taskData.byPriority?.completionRates) {
                const rates = taskData.byPriority.completionRates;
                this.updateComparisons({
                    taskCompletion: {
                        current: taskData.overview?.completionRate?.toFixed(1) || 0,
                        change: 0
                    },
                    focusTime: {
                        current: Math.round((timeData.overview?.totalTime || 0) / 60),
                        change: 0
                    },
                    productivity: {
                        current: Math.round((rates.high + rates.medium + rates.low) / 3),
                        change: 0
                    },
                    efficiency: {
                        current: Math.round((timeData.overview?.avgSessionTime || 0) / 60) || 0,
                        change: 0
                    }
                });
            }
        } catch (error) {
            console.error('Error updating charts:', error);
            this.showError('Error updating analytics charts');
        }
    }

    updateTimeDistributionChart(data = {}) {
        const ctx = this.container.querySelector('#timeDistributionChart').getContext('2d');
        
        if (this.charts.timeDistribution) {
            this.charts.timeDistribution.destroy();
        }

        // Sort tasks by time spent (descending) and take top 5
        const sortedEntries = Object.entries(data)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        const labels = sortedEntries.map(([name]) => name);
        const values = sortedEntries.map(([,value]) => value);
        
        this.charts.timeDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                return `${context.label}: ${value} minutes`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateCompletionTrendChart(data = { labels: [], values: [] }) {
        const ctx = this.container.querySelector('#completionTrendChart').getContext('2d');
        
        if (this.charts.completionTrend) {
            this.charts.completionTrend.destroy();
        }

        this.charts.completionTrend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Tasks by Priority',
                    data: data.values,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',  // High
                        'rgba(255, 206, 86, 0.8)',  // Medium
                        'rgba(75, 192, 192, 0.8)'   // Low
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Tasks Distribution by Priority'
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

        const priorities = ['high', 'medium', 'low'];
        const colors = {
            high: 'rgba(255, 99, 132, 0.8)',
            medium: 'rgba(255, 206, 86, 0.8)',
            low: 'rgba(75, 192, 192, 0.8)'
        };

        this.charts.priorityDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: priorities.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
                datasets: [{
                    label: 'Tasks by Priority',
                    data: priorities.map(p => data[p] || 0),
                    backgroundColor: priorities.map(p => colors[p])
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
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