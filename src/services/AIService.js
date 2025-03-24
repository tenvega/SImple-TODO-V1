export class AIService {
    constructor(authService) {
        this.authService = authService;
        this.baseUrl = 'http://localhost:3001/api';
    }

    async generateInsights(taskData) {
        try {
            console.log('Sending analytics request with data:', taskData); // Debug log

            const response = await fetch(`${this.baseUrl}/insights`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authService.getToken()}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Analytics endpoint not found');
                }
                const errorData = await response.json().catch(() => ({}));
                console.error('AI insights error:', errorData);
                throw new Error(errorData.message || 'Failed to generate insights');
            }

            const data = await response.json();
            return {
                summary: data.summary || 'Analysis complete.',
                insights: data.insights || ['No specific insights available']
            };
        } catch (error) {
            console.error('Error generating insights:', error);
            return {
                summary: 'Unable to generate insights at this time.',
                insights: [
                    'Service temporarily unavailable',
                    'Please try again later'
                ]
            };
        }
    }

    parseResponse(data) {
        try {
            // Add more detailed logging
            console.log('Parsing response:', data);

            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response format');
            }

            const text = data.candidates[0].content.parts[0].text;
            const sections = text.split('\n\n');
            
            // Extract summary (first paragraph) and insights (bullet points)
            const summary = sections[0].trim();
            const insights = sections
                .slice(1)
                .join('\n')
                .split('\n')
                .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
                .map(line => line.replace(/^[-•]\s*/, '').trim());

            return {
                summary: summary || 'Analysis complete.',
                insights: insights.length ? insights : ['No specific insights available']
            };
        } catch (error) {
            console.error('Error parsing AI response:', error);
            return {
                summary: 'Error processing insights.',
                insights: ['Unable to analyze the data']
            };
        }
    }

    constructPrompt(taskData) {
        const {
            completedTasks,
            totalTasks,
            completionRate,
            timeSpent,
            pomodoroSessions,
            tasksByPriority,
            tasksByTag,
            comparisons
        } = taskData;

        return `Analyze the following task management data and provide productivity insights:

Task Overview:
- Completed Tasks: ${completedTasks || 0}/${totalTasks || 0}
- Completion Rate: ${completionRate || 0}%
- Time Spent: ${timeSpent || 0} hours
- Pomodoro Sessions: ${pomodoroSessions || 0}

Task Distribution:
- By Priority: ${JSON.stringify(tasksByPriority || {})}
- By Tags: ${JSON.stringify(tasksByTag || {})}

Comparisons with Previous Period:
${Object.entries(comparisons || {}).map(([metric, value]) => `- ${metric}: ${value}% change`).join('\n')}

Please provide:
1. A brief summary of overall productivity
2. 3-5 specific insights or recommendations based on the data
3. Focus on actionable suggestions for improvement`;
    }
} 