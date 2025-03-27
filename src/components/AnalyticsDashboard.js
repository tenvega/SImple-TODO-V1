// src/components/AnalyticsDashboard.js
export class AnalyticsDashboard {
    constructor(apiService) {
        this.apiService = apiService;
        this.container = this.createDashboardElement();
        this.charts = {};
        this.selectedTimeframe = '7days';
        this.customDateRange = null;
        this.cachedData = new Map();
        this.dataQualityIndicator = null; 
        // Add debug mode for testing 
        this.debugMode = false; 
        // Wait for next frame to ensure DOM is ready
        requestAnimationFrame(() => {
            this.initialize();
        });
    }

    // Add the validation method here
  /**
   * Validates analytics calculations and logs issues to console
   * @param {Object} data - The analytics data to validate
   */
  validateAnalytics(data) {
    if (!data || !data.taskData || !data.timeData) {
      console.warn('Analytics validation: Insufficient data for validation');
      return;
    }
    
    const { taskData, timeData } = data;
    const issues = [];
    
    // 1. Validate completion rate calculation
    const totalTasks = taskData.overview?.totalTasks || 0;
    const completedTasks = taskData.overview?.completedTasks || 0;
    const reportedCompletionRate = taskData.overview?.completionRate || 0;
    
    if (totalTasks > 0) {
      const calculatedRate = (completedTasks / totalTasks) * 100;
      if (Math.abs(calculatedRate - reportedCompletionRate) > 0.5) {
        issues.push({
          type: 'completion_rate_mismatch',
          message: `Completion rate discrepancy detected: reported ${reportedCompletionRate.toFixed(1)}%, calculated ${calculatedRate.toFixed(1)}%`,
          severity: 'warning'
        });
      }
    }
    
    // 2. Validate task counts consistency
    const priorityCounts = taskData.byPriority?.counts || { high: 0, medium: 0, low: 0 };
    const totalByPriority = (priorityCounts.high || 0) + (priorityCounts.medium || 0) + (priorityCounts.low || 0);
    
    if (totalTasks > 0 && totalByPriority > 0 && Math.abs(totalTasks - totalByPriority) > 0) {
      issues.push({
        type: 'task_count_mismatch',
        message: `Task count mismatch: total ${totalTasks}, by priority ${totalByPriority}`,
        severity: 'warning'
      });
    }
    
    // 3. Validate time tracking data
    const reportedTotalTime = timeData.overview?.totalTime || 0;
    let totalTaskTime = 0;
    
    if (timeData.byTask) {
      Object.values(timeData.byTask).forEach(task => {
        totalTaskTime += task.totalTime || 0;
      });
      
      const timeDifference = Math.abs(reportedTotalTime - totalTaskTime);
      if (reportedTotalTime > 0 && totalTaskTime > 0 && timeDifference > reportedTotalTime * 0.05) {
        issues.push({
          type: 'time_tracking_discrepancy',
          message: `Time tracking discrepancy: reported ${reportedTotalTime}m, calculated ${totalTaskTime}m (${Math.round(timeDifference)}m difference)`,
          severity: 'warning'
        });
      }
    }
    
    // 4. Validate productivity score calculation
    const completionRates = taskData.byPriority?.completionRates || { high: 0, medium: 0, low: 0 };
    const calculatedProductivity = Math.round(
      (completionRates.high + completionRates.medium + completionRates.low) / 3
    );
    const reportedProductivity = taskData.overview?.productivity || 0;
    
    if (Math.abs(calculatedProductivity - reportedProductivity) > 2) {
      issues.push({
        type: 'productivity_calculation_error',
        message: `Productivity score discrepancy: reported ${reportedProductivity}, calculated ${calculatedProductivity}`,
        severity: 'warning'
      });
    }
    
    // Log all detected issues
    if (issues.length > 0) {
      console.warn('Analytics validation issues detected:', issues);
      issues.forEach(issue => {
        console.warn(`[${issue.severity.toUpperCase()}] ${issue.message}`);
      });
    } else {
      console.log('Analytics validation: All calculations appear correct');
    }
    
    return issues;
  }
  
  // Then, in your updateDashboard method, add the validation call:
  // (This assumes you have an updateDashboard method already in your class)
  updateDashboard(data = {}) {
    try {
      console.log('Updating dashboard with data:', data);
      
      // Add this single line to validate analytics
      this.validateAnalytics(data);
      
      const { taskData = {}, timeData = {}, aiInsights = {} } = data;
      
      // Rest of your existing updateDashboard code...
      this.updateMetrics(taskData, timeData);
      this.updateCharts(taskData, timeData);
      this.updateAIInsights(aiInsights);
      this.updateComparisons(taskData.comparisons);
      
      this.hideLoading();
    } catch (error) {
      console.error('Error updating dashboard:', error);
      this.showError('Failed to update analytics dashboard');
      this.hideLoading();
    }
  }


    createDashboardElement() {
        const container = document.createElement('div');
        container.className = 'analytics-dashboard';
        
        container.innerHTML = `
             <div class="analytics-header">
                <h2>Analytics Dashboard</h2>
                <select id="timeframeSelect" class="timeframe-select">
                    <option value="7days">Last 7 Days</option>
                    <option value="21days">Last 3 Weeks</option>
                    <option value="30days">Last Month</option>
                    <option value="90days">Last 3 Months</option>
                    <option value="365days">Last Year</option>
                    <option value="custom">Custom Range</option>
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
                   <div class="chart-container" id="timeDistributionContainer">
                    <canvas id="timeDistributionChart"></canvas>
                    </div>
                     </div>
                
                <div class="analytics-card">
                    <h3>Task Completion Trend</h3>
                    <div class="chart-container" id="completionTrendContainer">
                        <canvas id="completionTrendChart"></canvas>
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Priority Distribution</h3>
                    <div class="chart-container" id="priorityDistributionContainer">
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

    isDashboardReady() {
        const requiredElements = [
            // Chart containers
            '#timeDistributionContainer',
            '#completionTrendContainer',
            '#priorityDistributionContainer',
            // Chart canvases
            '#timeDistributionChart',
            '#completionTrendChart',
            '#priorityDistributionChart',
            // Other elements
            '#aiSummary',
            '#aiInsightsList',
            '#completedTasks',
            '#pendingTasks',
            '#completionRate',
            '#avgTaskTime'
        ];

        const allElementsExist = requiredElements.every(selector => {
            const element = this.container.querySelector(selector);
            if (!element) {
                console.warn(`Required element not found: ${selector}`);
                return false;
            }
            return true;
        });

        return allElementsExist;
    }


    async initialize() {
        // Wait for the dashboard to be ready
        const checkDashboard = () => {
            if (this.isDashboardReady()) {
                console.log('Dashboard is ready, initializing...');
                this.addEventListeners();
                this.loadData(this.selectedTimeframe);
            } else {
                console.log('Dashboard not ready, retrying...');
                // Try again in the next frame
                requestAnimationFrame(checkDashboard);
            }
        };

        checkDashboard();
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
            
            // Update selected timeframe
            this.selectedTimeframe = timeframe;
            
            // Check cache first
            const cacheKey = this.customDateRange ? 
                `custom_${this.customDateRange.start}_${this.customDateRange.end}` : 
                timeframe;
            
            if (this.cachedData && this.cachedData.has(cacheKey)) {
                const cachedData = this.cachedData.get(cacheKey);
                this.updateDashboard(cachedData);
                return;
            }

            // Show loading state
            this.showLoading();

            let params = {};
            if (this.customDateRange) {
                params = {
                    startDate: this.customDateRange.start,
                    endDate: this.customDateRange.end
                };
            } else {
                params = { timeframe };
            }

            const [taskData, timeData, aiInsights] = await Promise.all([
                this.apiService.getTaskAnalytics(params),
                this.apiService.getTimeAnalytics(params),
                this.apiService.getAIInsights(params)
            ]);

            const data = { taskData, timeData, aiInsights };
            
            // Ensure cachedData is initialized before setting
            if (!this.cachedData) {
                this.cachedData = new Map();
            }
            this.cachedData.set(cacheKey, data);
            this.updateDashboard(data);

        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showError('Failed to load analytics data');
        }
    }

    updateMetrics(taskData, timeData) {
        console.log('Updating metrics with:', { taskData, timeData });
        // Update task metrics using the overview object
        const overview = taskData.overview || {};
        
        const elements = {
            completedTasks: this.container.querySelector('#completedTasks'),
            pendingTasks: this.container.querySelector('#pendingTasks'),
            completionRate: this.container.querySelector('#completionRate'),
            avgTaskTime: this.container.querySelector('#avgTaskTime')
        };

        // Check if elements exist before updating
        if (elements.completedTasks) {
            elements.completedTasks.textContent = overview.completedTasks || 0;
        }
        if (elements.pendingTasks) {
            elements.pendingTasks.textContent = overview.totalTasks - overview.completedTasks || 0;
        }
        if (elements.completionRate) {
            elements.completionRate.textContent = `${overview.completionRate?.toFixed(1) || 0}%`;
        }
        if (elements.avgTaskTime) {
            elements.avgTaskTime.textContent = `${Math.round((overview.avgTimePerTask || 0))}m`;
        }
    }

    updateCharts(taskData = {}, timeData = {}) {
        try {
            console.log('Updating charts with:', { taskData, timeData });
            
            // Ensure chart canvases exist
            const charts = [
                'timeDistributionChart',
                'completionTrendChart',
                'priorityDistributionChart'
            ];

            const allChartsExist = charts.every(chartId => this.ensureChartCanvas(chartId));
            if (!allChartsExist) {
                console.warn('Failed to ensure all chart canvases exist');
                return;
            }

            // Time distribution chart
            const timeByTask = timeData.byTask || {};
            const timeDistribution = Object.entries(timeByTask).reduce((acc, [_, task]) => {
                acc[task.title] = Math.round(task.totalTime / 60);
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
            const completionRates = taskData.byPriority?.completionRates || { high: 0, medium: 0, low: 0 };
            const previousData = taskData.previous || {};
            
            this.updateComparisons({
                taskCompletion: {
                    current: taskData.overview?.completionRate?.toFixed(1) || 0,
                    change: ((taskData.overview?.completionRate || 0) - (previousData.completionRate || 0)).toFixed(1)
                },
                focusTime: {
                    current: Math.round((timeData.overview?.totalTime || 0) / 60),
                    change: timeData.previous?.percentageChange?.toFixed(1) || 0
                },
                productivity: {
                    current: Math.round((completionRates.high + completionRates.medium + completionRates.low) / 3),
                    change: ((taskData.overview?.productivity || 0) - (previousData.productivity || 0)).toFixed(1)
                },
                efficiency: {
                    current: Math.round((timeData.overview?.avgSessionTime || 0) / 60),
                    change: (((timeData.overview?.avgSessionTime || 0) - (timeData.previous?.avgSessionTime || 0)) / (timeData.previous?.avgSessionTime || 1) * 100).toFixed(1)
                }
            });

            // Remove loading spinners after charts are updated
            this.hideLoading();
            
        } catch (error) {
            console.error('Error updating charts:', error);
            this.showError('Error updating analytics charts');
        }
    }

    updateTimeDistributionChart(data = {}) {
        const canvas = this.container.querySelector('#timeDistributionChart');
        if (!canvas) {
            console.warn('Time distribution chart canvas not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('Could not get 2D context for time distribution chart');
            return;
        }

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
        const canvas = this.container.querySelector('#completionTrendChart');
        if (!canvas) {
            console.warn('Completion trend chart canvas not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('Could not get 2D context for completion trend chart');
            return;
        }

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
        const canvas = this.container.querySelector('#priorityDistributionChart');
        if (!canvas) {
            console.warn('Priority distribution chart canvas not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('Could not get 2D context for priority distribution chart');
            return;
        }

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

    updateAIInsights(insights = {}) {
        const summaryElement = this.container.querySelector('#aiSummary');
        const insightsList = this.container.querySelector('#aiInsightsList');
        
        if (!summaryElement || !insightsList) {
            console.warn('AI insights elements not found');
            return;
        }
        
        summaryElement.textContent = insights.summary || 'No insights available';
        
        if (insights.insights && Array.isArray(insights.insights)) {
            insightsList.innerHTML = insights.insights
                .map(insight => `<li>${insight}</li>`)
                .join('');
        } else {
            insightsList.innerHTML = '<li>No insights available</li>';
        }
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
        console.error(message);
        if (!this.container) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'analytics-error';
        errorDiv.textContent = message;
        
        // Clear existing content and show error
        this.container.innerHTML = '';
        this.container.appendChild(errorDiv);
    }

    // Add method for custom date range
    showCustomDatePicker() {
        const customRange = document.createElement('div');
        customRange.className = 'custom-date-range';
        customRange.innerHTML = `
            <div class="date-picker-overlay">
                <div class="date-picker-container">
                    <h3>Select Date Range</h3>
                    <div class="date-inputs">
                        <div class="date-input-group">
                            <label>Start Date</label>
                            <input type="date" id="startDate">
                        </div>
                        <div class="date-input-group">
                            <label>End Date</label>
                            <input type="date" id="endDate">
                        </div>
                    </div>
                    <div class="date-picker-actions">
                        <button class="cancel-btn">Cancel</button>
                        <button class="apply-btn">Apply</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(customRange);

        // Add event listeners
        const cancelBtn = customRange.querySelector('.cancel-btn');
        const applyBtn = customRange.querySelector('.apply-btn');
        const startDate = customRange.querySelector('#startDate');
        const endDate = customRange.querySelector('#endDate');

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(customRange);
            // Reset select to previous value
            this.container.querySelector('#timeframeSelect').value = '7days';
        });

        applyBtn.addEventListener('click', () => {
            if (startDate.value && endDate.value) {
                const start = new Date(startDate.value);
                const end = new Date(endDate.value);
                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                this.loadData(`custom_${days}`);
                document.body.removeChild(customRange);
            }
        });
    }

    // Update the timeframe select when custom dates are chosen
    updateTimeframeLabel() {
        const select = this.container.querySelector('#timeframeSelect');
        if (this.customDateRange) {
            const { start, end } = this.customDateRange;
            const startDate = new Date(start).toLocaleDateString();
            const endDate = new Date(end).toLocaleDateString();
            select.innerHTML = `
                <option value="custom" selected>${startDate} - ${endDate}</option>
                <option value="7days">Last 7 Days</option>
                <option value="21days">Last 3 Weeks</option>
                <option value="30days">Last Month</option>
                <option value="90days">Last 3 Months</option>
                <option value="365days">Last Year</option>
                <option value="custom">Custom Range</option>
            `;
        }
    }

    showLoading() {
        // Add loading indicators to charts while preserving canvases
        const chartContainers = this.container.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            // Remove any existing loading spinners first
            const existingSpinner = container.querySelector('.loading-spinner');
            if (existingSpinner) {
                existingSpinner.remove();
            }

            // Create loading overlay
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
            
            // Position the overlay absolutely over the chart
            loadingOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.8);
                z-index: 10;
            `;
            
            // Ensure container has relative positioning for absolute overlay
            container.style.position = 'relative';
            container.appendChild(loadingOverlay);
        });
    }

    hideLoading() {
        // Remove all loading overlays
        const loadingOverlays = this.container.querySelectorAll('.loading-overlay');
        loadingOverlays.forEach(overlay => overlay.remove());
    }

    ensureChartCanvas(chartId) {
        // Remove 'Chart' from the container ID to match the HTML structure
        const containerId = chartId.replace('Chart', '');
        const container = this.container.querySelector(`#${containerId}Container`);
        if (!container) {
            console.warn(`Chart container ${containerId}Container not found`);
            return null;
        }

        let canvas = container.querySelector(`#${chartId}`);
        if (!canvas) {
            // Recreate the canvas if it's missing
            canvas = document.createElement('canvas');
            canvas.id = chartId;
            canvas.width = 400;
            canvas.height = 400;
            
            // Clear container and add new canvas
            container.innerHTML = '';
            container.appendChild(canvas);
        }

        return canvas;
    }

    updateDashboard(data = {}) {
        try {
            console.log('Updating dashboard with data:', data);
            const { taskData = {}, timeData = {}, aiInsights = {} } = data;
            
            // Update all components
            this.updateMetrics(taskData, timeData);
            this.updateCharts(taskData, timeData);
            this.updateAIInsights(aiInsights);
            this.updateComparisons(taskData.comparisons);
            
            // Ensure loading spinners are removed
            this.hideLoading();
        } catch (error) {
            console.error('Error updating dashboard:', error);
            this.showError('Failed to update analytics dashboard');
            // Also hide loading state on error
            this.hideLoading();
        }
    }
}