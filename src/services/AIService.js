export class AIService {
    constructor(authService) {
        this.authService = authService;
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    async generateInsights(taskData) {
        try {
            const prompt = this.constructPrompt(taskData);
            
            const insightResponse = await fetch(`${this.apiEndpoint}?key=${process.env.GOOGLE_AI_STUDIO_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            });

            if (!insightResponse.ok) {
                const errorData = await insightResponse.json();
                console.error('Gemini API error:', errorData);
                return {
                    summary: 'Unable to generate insights at this time.',
                    insights: []
                };
            }

            const data = await insightResponse.json();
            return this.parseResponse(data);
        } catch (error) {
            console.error('Error generating insights:', error);
            return {
                summary: 'Unable to generate insights at this time.',
                insights: []
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
- Completed Tasks: ${completedTasks}/${totalTasks}
- Completion Rate: ${completionRate}%
- Time Spent: ${timeSpent} hours
- Pomodoro Sessions: ${pomodoroSessions}

Task Distribution:
- By Priority: ${JSON.stringify(tasksByPriority)}
- By Tags: ${JSON.stringify(tasksByTag)}

Comparisons with Previous Period:
${Object.entries(comparisons).map(([metric, value]) => `- ${metric}: ${value}% change`).join('\n')}

Please provide:
1. A brief summary of overall productivity
2. 3-5 specific insights or recommendations based on the data
3. Focus on actionable suggestions for improvement`;
    }

    parseResponse(data) {
        try {
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
                summary,
                insights: insights.slice(0, 5) // Limit to 5 insights
            };
        } catch (error) {
            console.error('Error parsing AI response:', error);
            return {
                summary: 'Unable to process insights at this time.',
                insights: []
            };
        }
    }
} 