import express from 'express';
import fetch from 'node-fetch';
import { authenticate } from '../middleware/auth.js';
import { Task, TimeTracking } from '../models/index.js';

const router = express.Router();

// Analytics insights endpoint
router.post('/insights', authenticate, async (req, res) => {
    try {
        // Get all tasks for the user
        const tasks = await Task.find({ userId: req.userId });
        const timeTrackings = await TimeTracking.find({ userId: req.userId });

        const taskData = {
            tasks: tasks.map(task => ({
                id: task._id,
                title: task.title,
                completed: task.completed,
                priority: task.priority,
                tags: task.tags,
                timeSpent: task.timeSpent,
                pomodoroCount: task.pomodoroCount,
                createdDate: task.createdDate,
                completedDate: task.completedDate,
                dueDate: task.dueDate
            })),
            timeTrackings: timeTrackings.map(tt => ({
                duration: tt.duration,
                type: tt.type,
                startTime: tt.startTime,
                endTime: tt.endTime
            }))
        };

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
                    'x-goog-api-key': apiKey
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
                    },
                    safetySettings: []
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.text().catch(() => '');
            console.error('AI API error:', errorData);
            throw new Error(`AI API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        const insights = parseAIResponse(data);
        
        res.json(insights);
    } catch (error) {
        console.error('AI Insights error:', error);
        res.status(500).json({ 
            message: 'Error generating insights',
            error: error.message 
        });
    }
});

// Analytics overview endpoint
router.get('/overview', authenticate, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.userId });
        const timeTrackings = await TimeTracking.find({ userId: req.userId });

        const completedTasks = tasks.filter(t => t.completed);
        
        // Calculate completion rate
        const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

        // Calculate average completion time
        const avgCompletionTime = completedTasks.length > 0 
            ? completedTasks.reduce((sum, task) => sum + task.timeSpent, 0) / completedTasks.length 
            : 0;

        // Priority distribution
        const priorityCounts = {
            high: tasks.filter(t => t.priority === 'high').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            low: tasks.filter(t => t.priority === 'low').length
        };

        // Calculate total time spent
        const totalTimeSpent = timeTrackings.reduce((sum, session) => sum + session.duration, 0);

        // Calculate pomodoro statistics
        const pomodoroSessions = timeTrackings.filter(t => t.type === 'pomodoro');
        const avgPomodoroLength = pomodoroSessions.length > 0
            ? pomodoroSessions.reduce((sum, session) => sum + session.duration, 0) / pomodoroSessions.length
            : 0;

        res.json({
            overview: {
                totalTasks: tasks.length,
                completedTasks: completedTasks.length,
                completionRate: completionRate.toFixed(1),
                avgCompletionTime: avgCompletionTime.toFixed(1),
                totalTimeSpent: totalTimeSpent,
                avgPomodoroLength: avgPomodoroLength.toFixed(1)
            },
            priorities: {
                distribution: priorityCounts,
                percentages: {
                    high: tasks.length > 0 ? ((priorityCounts.high / tasks.length) * 100).toFixed(1) : 0,
                    medium: tasks.length > 0 ? ((priorityCounts.medium / tasks.length) * 100).toFixed(1) : 0,
                    low: tasks.length > 0 ? ((priorityCounts.low / tasks.length) * 100).toFixed(1) : 0
                }
            },
            timeTracking: {
                totalSessions: timeTrackings.length,
                pomodoroSessions: pomodoroSessions.length,
                totalTimeSpent: totalTimeSpent,
                avgSessionLength: timeTrackings.length > 0
                    ? (totalTimeSpent / timeTrackings.length).toFixed(1)
                    : 0
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Error fetching analytics' });
    }
});

// Analytics time analytics endpoint
router.get('/analytics/time', authenticate, async (req, res) => {
    try {
        const { timeframe, startDate, endDate } = req.query;
        
        // Calculate date range
        const now = new Date();
        let dateFilter = {};
        
        if (startDate && endDate) {
            dateFilter = {
                startTime: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        } else {
            let daysToSubtract;
            switch(timeframe) {
                case '7days': daysToSubtract = 7; break;
                case '21days': daysToSubtract = 21; break;
                case '30days': daysToSubtract = 30; break;
                case '90days': daysToSubtract = 90; break;
                case '365days': daysToSubtract = 365; break;
                default: daysToSubtract = 7;
            }
            
            const startDate = new Date(now);
            startDate.setDate(now.getDate() - daysToSubtract);
            dateFilter = {
                startTime: { $gte: startDate }
            };
        }

        // Fetch time tracking data
        const timeTrackings = await TimeTracking.find({
            userId: req.userId,
            ...dateFilter
        }).populate('taskId', 'title priority');

        // Group by task
        const timeByTask = timeTrackings.reduce((acc, session) => {
            if (!session.taskId) return acc;
            
            const taskKey = session.taskId.title;
            if (!acc[taskKey]) {
                acc[taskKey] = {
                    totalTime: 0,
                    sessions: 0,
                    priority: session.taskId.priority
                };
            }
            
            acc[taskKey].totalTime += session.duration || 0;
            acc[taskKey].sessions += 1;
            return acc;
        }, {});

        // Calculate time distribution
        const timeDistribution = Object.entries(timeByTask)
            .sort(([, a], [, b]) => b.totalTime - a.totalTime)
            .reduce((acc, [task, data]) => {
                acc[task] = data.totalTime;
                return acc;
            }, {});

        res.json({
            overview: {
                totalTime: timeTrackings.reduce((sum, session) => sum + (session.duration || 0), 0),
                totalSessions: timeTrackings.length,
                avgSessionTime: timeTrackings.length > 0 ? 
                    timeTrackings.reduce((sum, session) => sum + (session.duration || 0), 0) / timeTrackings.length : 0
            },
            byTask: timeByTask,
            timeDistribution
        });

    } catch (error) {
        console.error('Time analytics error:', error);
        res.status(500).json({ message: 'Error fetching time analytics' });
    }
});

// Helper function to construct the prompt for the AI
function constructPrompt(taskData) {
    return `Analyze the following task data and provide insights about productivity and task management patterns:
    
Task Data:
${JSON.stringify(taskData, null, 2)}

Please provide insights about:
1. Task completion patterns
2. Time management effectiveness
3. Priority distribution
4. Areas for improvement
5. Recommendations for better productivity

Format the response as a JSON object with the following structure:
{
    "summary": "Brief overview of the analysis",
    "patterns": ["List of identified patterns"],
    "recommendations": ["List of specific recommendations"],
    "metrics": {
        "completionRate": "Percentage of completed tasks",
        "avgCompletionTime": "Average time to complete tasks",
        "priorityDistribution": {
            "high": "Percentage of high priority tasks",
            "medium": "Percentage of medium priority tasks",
            "low": "Percentage of low priority tasks"
        }
    }
}`;
}

// Helper function to parse the AI response
function parseAIResponse(data) {
    try {
        const text = data.candidates[0].content.parts[0].text;
        // Try to parse the response as JSON
        try {
            return JSON.parse(text);
        } catch (e) {
            // If parsing fails, return a formatted object with the raw text
            return {
                summary: text,
                patterns: [],
                recommendations: [],
                metrics: {
                    completionRate: "N/A",
                    avgCompletionTime: "N/A",
                    priorityDistribution: {
                        high: "N/A",
                        medium: "N/A",
                        low: "N/A"
                    }
                }
            };
        }
    } catch (error) {
        console.error('Error parsing AI response:', error);
        throw new Error('Failed to parse AI response');
    }
}

export default router; 