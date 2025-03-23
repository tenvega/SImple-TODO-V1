import express from 'express';
import fetch from 'node-fetch';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Analytics insights endpoint
router.post('/insights', authenticate, async (req, res) => {
    try {
        const { taskData } = req.body;
        const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
        
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', 
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: constructPrompt(taskData)
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Gemini API error:', error);
            throw new Error('Failed to generate insights');
        }

        const data = await response.json();
        const parsedResponse = parseAIResponse(data);
        
        res.json(parsedResponse);
    } catch (error) {
        console.error('AI insights error:', error);
        res.status(500).json({
            summary: 'Unable to generate insights at this time.',
            insights: ['Service temporarily unavailable']
        });
    }
});

function constructPrompt(taskData) {
    const {
        completedTasks = 0,
        totalTasks = 0,
        completionRate = 0,
        timeSpent = 0,
        pomodoroSessions = 0,
        tasksByPriority = {},
        tasksByTag = {},
        comparisons = {}
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

function parseAIResponse(data) {
    try {
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response format');
        }

        const text = data.candidates[0].content.parts[0].text;
        const sections = text.split('\n\n');
        
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

export default router; 
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (timeframe === 'week' ? 7 : 30));

        // Get tasks within timeframe
        const tasks = await Task.find({
            userId,
            createdDate: { $gte: startDate, $lte: endDate }
        });

        // Calculate completion statistics
        const completedTasks = tasks.filter(t => t.completed);
        const completedOnTime = completedTasks.filter(t => !t.completedLate);
        const completedLate = completedTasks.filter(t => t.completedLate);
        
        // Calculate Pomodoro vs non-Pomodoro stats
        const pomodoroTasks = completedTasks.filter(t => t.pomodoroCount > 0);
        const nonPomodoroTasks = completedTasks.filter(t => t.pomodoroCount === 0);

        res.json({
            overview: {
                total: tasks.length,
                completed: completedTasks.length,
                completedOnTime: completedOnTime.length,
                completedLate: completedLate.length,
                pomodoroCompletion: {
                    withPomodoro: pomodoroTasks.length,
                    withoutPomodoro: nonPomodoroTasks.length,
                    pomodoroEfficiency: pomodoroTasks.length / completedTasks.length
                }
            },
            // ... existing analytics data ...
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Error fetching analytics' });
    }
}); 