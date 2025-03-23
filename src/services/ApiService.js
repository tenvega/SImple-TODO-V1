// src/services/ApiService.js
import { AIService } from './AIService.js';

export class ApiService {
    constructor(authService) {
        this.authService = authService;
        this.baseUrl = 'http://localhost:3000/api'; // Change to your deployed API URL in production
        this.aiService = new AIService(authService);
    }

    async request(endpoint, options = {}) {
        try {
            const token = this.authService.getToken();
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...options.headers
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Resource not found: ${endpoint}`);
                }
                const error = await response.json();
                throw new Error(error.message || 'API request failed');
            }

            return response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Task endpoints
    async getTasks() {
        return this.request('/tasks');
    }

    async createTask(taskData) {
        return this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    async updateTask(taskId, updates) {
        if (!taskId) {
            throw new Error('Task ID is required');
        }
        return this.request(`/tasks/${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    }

    async deleteTask(taskId) {
        return this.request(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
    }

    // Time tracking endpoints
    async startTimeTracking(taskId) {
        return this.request('/tracking/start', {
            method: 'POST',
            body: JSON.stringify({ taskId })
        });
    }

    async stopTimeTracking(trackingId) {
        return this.request(`/tracking/${trackingId}/stop`, {
            method: 'POST'
        });
    }

    // Analytics endpoints
    async getTaskAnalytics(timeframe = 'week') {
        return this.request(`/analytics/tasks?timeframe=${timeframe}`);
    }

    async getTimeAnalytics(timeframe = 'week') {
        return this.request(`/analytics/time?timeframe=${timeframe}`);
    }

    async getComparisonAnalytics(timeframe = 'week') {
        return this.request(`/analytics/comparison?timeframe=${timeframe}`);
    }

    async getAIInsights() {
        try {
            // Get analytics data
            const [tasks, time, comparison] = await Promise.all([
                this.getTaskAnalytics(),
                this.getTimeAnalytics(),
                this.getComparisonAnalytics()
            ]);

            // Prepare data for AI analysis
            const analysisData = {
                completedTasks: tasks.overview.completedTasks,
                totalTasks: tasks.overview.totalTasks,
                completionRate: tasks.overview.completionRate,
                timeSpent: Math.round(time.overview.totalTime / 3600 * 10) / 10, // Convert seconds to hours
                pomodoroSessions: time.overview.totalSessions,
                tasksByPriority: tasks.byPriority,
                tasksByTag: tasks.byTag,
                comparisons: comparison.changes
            };

            // Generate insights using Gemini API
            return this.aiService.generateInsights(analysisData);
        } catch (error) {
            console.error('Error getting AI insights:', error);
            return {
                summary: 'Unable to generate insights at this time.',
                insights: []
            };
        }
    }
}
