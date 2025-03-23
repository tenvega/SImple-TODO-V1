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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'API request failed');
            }

            return await response.json();
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
        return this.request(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteTask(taskId) {
        return this.request(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
    }

    // Time tracking endpoints
    async startPomodoro(taskId = null) {
        return this.request('/tracking/start', {
            method: 'POST',
            body: JSON.stringify({ taskId })
        });
    }

    async endPomodoro(trackingId) {
        return this.request(`/tracking/${trackingId}/end`, {
            method: 'PUT'
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

    async getAIInsights(taskData) {
        try {
            const response = await this.request('/insights');
            return {
                summary: response.summary || 'Analysis complete.',
                insights: response.insights || ['No specific insights available']
            };
        } catch (error) {
            console.error('AI insights error:', error);
            return {
                summary: 'Unable to generate insights at this time.',
                insights: ['Service temporarily unavailable']
            };
        }
    }
}
