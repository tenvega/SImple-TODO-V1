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
        // const tasks = await Task.find({ userId: req.userId });
        // const timeTrackings = await TimeTracking.find({ userId: req.userId });

        // const completedTasks = tasks.filter(t => t.completed);
        
        // // Calculate completion rate
        // const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

        // // Calculate average completion time
        // const avgCompletionTime = completedTasks.length > 0 
        //     ? completedTasks.reduce((sum, task) => sum + task.timeSpent, 0) / completedTasks.length 
        //     : 0;

        // // Priority distribution
        // const priorityCountsOld = {
        //     high: tasks.filter(t => t.priority === 'high').length,
        //     medium: tasks.filter(t => t.priority === 'medium').length,
        //     low: tasks.filter(t => t.priority === 'low').length
        // };

        // // Calculate total time spent
        // const totalTimeSpentOld = timeTrackings.reduce((sum, session) => sum + session.duration, 0);

        // // Calculate pomodoro statistics
        // const pomodoroSessionsOld = timeTrackings.filter(t => t.type === 'pomodoro');
        // const avgPomodoroLengthOld = pomodoroSessionsOld.length > 0
        //     ? pomodoroSessionsOld.reduce((sum, session) => sum + session.duration, 0) / pomodoroSessionsOld.length
        //     : 0;

        const taskAggregations = await Task.aggregate([
            { $match: { userId: req.userId } }, // Assuming req.userId is already ObjectId or Mongoose handles it
            {
                $group: {
                    _id: null,
                    totalTasks: { $sum: 1 },
                    completedTasks: { $sum: { $cond: ["$completed", 1, 0] } },
                    highPriorityTasks: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
                    mediumPriorityTasks: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
                    lowPriorityTasks: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
                    totalTimeSpentOnCompletedTasks: { 
                        $sum: { $cond: ["$completed", { $ifNull: ["$timeSpent", 0] }, 0] }
                    }
                }
            }
        ]);

        const taskStats = taskAggregations[0] || { 
            totalTasks: 0, completedTasks: 0, highPriorityTasks: 0, 
            mediumPriorityTasks: 0, lowPriorityTasks: 0, totalTimeSpentOnCompletedTasks: 0 
        };

        const timeAggregations = await TimeTracking.aggregate([
            { $match: { userId: req.userId } }, // Assuming req.userId is already ObjectId or Mongoose handles it
            {
                $group: {
                    _id: null,
                    totalTimeSpent: { $sum: { $ifNull: ["$duration", 0] } },
                    totalSessions: { $sum: 1 },
                    pomodoroSessions: { $sum: { $cond: [{ $eq: ["$type", "pomodoro"] }, 1, 0] } },
                    totalPomodoroDuration: { 
                        $sum: { $cond: [{ $eq: ["$type", "pomodoro"] }, { $ifNull: ["$duration", 0] }, 0] }
                    }
                }
            }
        ]);

        const timeStats = timeAggregations[0] || { 
            totalTimeSpent: 0, totalSessions: 0, pomodoroSessions: 0, totalPomodoroDuration: 0 
        };
        
        const completionRate = taskStats.totalTasks > 0 ? (taskStats.completedTasks / taskStats.totalTasks) * 100 : 0;
        const avgCompletionTime = taskStats.completedTasks > 0 ? taskStats.totalTimeSpentOnCompletedTasks / taskStats.completedTasks : 0;
        const priorityCounts = {
            high: taskStats.highPriorityTasks,
            medium: taskStats.mediumPriorityTasks,
            low: taskStats.lowPriorityTasks
        };
        const avgPomodoroLength = timeStats.pomodoroSessions > 0 ? timeStats.totalPomodoroDuration / timeStats.pomodoroSessions : 0;

        res.json({
            overview: {
                totalTasks: taskStats.totalTasks,
                completedTasks: taskStats.completedTasks,
                completionRate: completionRate.toFixed(1),
                avgCompletionTime: avgCompletionTime.toFixed(1),
                totalTimeSpent: timeStats.totalTimeSpent,
                avgPomodoroLength: avgPomodoroLength.toFixed(1)
            },
            priorities: {
                distribution: priorityCounts,
                percentages: {
                    high: taskStats.totalTasks > 0 ? ((priorityCounts.high / taskStats.totalTasks) * 100).toFixed(1) : '0.0',
                    medium: taskStats.totalTasks > 0 ? ((priorityCounts.medium / taskStats.totalTasks) * 100).toFixed(1) : '0.0',
                    low: taskStats.totalTasks > 0 ? ((priorityCounts.low / taskStats.totalTasks) * 100).toFixed(1) : '0.0'
                }
            },
            timeTracking: {
                totalSessions: timeStats.totalSessions,
                pomodoroSessions: timeStats.pomodoroSessions,
                totalTimeSpent: timeStats.totalTimeSpent,
                avgSessionLength: timeStats.totalSessions > 0 
                    ? (timeStats.totalTimeSpent / timeStats.totalSessions).toFixed(1) 
                    : '0.0'
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

        // Fetch time tracking data for the current period using aggregation
        const timeDataCurrentPeriodArr = await TimeTracking.aggregate([
            { $match: { userId: req.userId, ...dateFilter } }, // dateFilter is already defined
            { // Group by taskId first to sum duration and count sessions per task
                $group: {
                    _id: "$taskId",
                    totalTimeForTask: { $sum: { $ifNull: ["$duration", 0] } },
                    sessionsForTask: { $sum: 1 }
                }
            },
            { // Lookup task details (title, priority)
                $lookup: {
                    from: "tasks", // Ensure 'tasks' is the correct collection name
                    localField: "_id",
                    foreignField: "_id",
                    as: "taskDetails"
                }
            },
            { $unwind: { path: "$taskDetails", preserveNullAndEmptyArrays: true } }, // Preserve if task is deleted
            { // Project to shape data for each task entry
                $project: {
                    _id: 0, // Exclude this default _id from this stage
                    taskIdStr: { $toString: "$_id" }, // Convert ObjectId to string for later object key
                    title: { $ifNull: ["$taskDetails.title", "Unknown Task"] },
                    priority: "$taskDetails.priority",
                    totalTime: "$totalTimeForTask",
                    sessions: "$sessionsForTask"
                }
            },
            { // Second group stage to calculate overall totals and construct byTask array
                $group: {
                    _id: null, // Calculate overall totals
                    overallTotalTime: { $sum: "$totalTime" },
                    overallTotalSessions: { $sum: "$sessions" },
                    byTaskArr: { $push: "$$ROOT" } // Push the whole document into byTaskArr
                }
            },
            { // Convert byTaskArr to an object map
                $project: {
                    _id: 0,
                    overview: {
                        totalTime: { $ifNull: ["$overallTotalTime", 0] },
                        totalSessions: { $ifNull: ["$overallTotalSessions", 0] },
                        avgSessionTime: {
                            $cond: [
                                { $eq: [{ $ifNull: ["$overallTotalSessions", 0] }, 0] }, 
                                0, 
                                { $divide: [{ $ifNull: ["$overallTotalTime", 0] }, { $ifNull: ["$overallTotalSessions", 0] }] }
                            ]
                        }
                    },
                    byTask: { // Convert array to object
                        $arrayToObject: {
                            $map: {
                                input: "$byTaskArr",
                                as: "taskItem",
                                in: {
                                    k: "$$taskItem.title", // Use task title as key
                                    v: { // Value for the byTask object
                                        totalTime: "$$taskItem.totalTime",
                                        sessions: "$$taskItem.sessions",
                                        priority: "$$taskItem.priority",
                                        // title is the key, taskIdStr is available if needed:
                                        // taskId: "$$taskItem.taskIdStr" 
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]);

        const currentPeriodData = timeDataCurrentPeriodArr[0] || { 
            overview: { totalTime: 0, totalSessions: 0, avgSessionTime: 0 }, 
            byTask: {} 
        };
        
        // Calculate previous period for comparison
        const previousStartDate = new Date(dateFilter.startTime.$gte);
        // Need daysToSubtract to be defined, ensure it's available from earlier logic
        // If timeframe was 'custom', daysToSubtract might not be set.
        // For simplicity in this refactor, we'll assume daysToSubtract is available
        // or this part of logic needs adjustment based on how timeframe is handled for previous period.
        // The original code had 'daysToSubtract' in this scope.
        let daysToSubtractForPrev;
         if (startDate && endDate) { // Custom range
            const start = new Date(startDate);
            const end = new Date(endDate);
            daysToSubtractForPrev = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) +1;
         } else {
            switch(timeframe) { // Predefined range
                case '7days': daysToSubtractForPrev = 7; break;
                case '21days': daysToSubtractForPrev = 21; break;
                case '30days': daysToSubtractForPrev = 30; break;
                case '90days': daysToSubtractForPrev = 90; break;
                case '365days': daysToSubtractForPrev = 365; break;
                default: daysToSubtractForPrev = 7;
            }
         }
        previousStartDate.setDate(previousStartDate.getDate() - daysToSubtractForPrev);
        const previousEndDate = new Date(dateFilter.startTime.$gte);

        // Fetch total time for the previous period using aggregation
        const timeDataPreviousPeriodArr = await TimeTracking.aggregate([
            { $match: { userId: req.userId, startTime: { $gte: previousStartDate, $lt: previousEndDate } } },
            {
                $group: {
                    _id: null, // Group all to get a single sum
                    totalTime: { $sum: { $ifNull: ["$duration", 0] } }
                }
            }
        ]);
        const previousTotalTime = (timeDataPreviousPeriodArr[0] || { totalTime: 0 }).totalTime;

        // Calculate percentage change safely
        const calculatePercentageChange = (current, previous) => {
            if (!previous || previous === 0) return 0;
            const change = ((current - previous) / previous) * 100;
            // Cap the percentage change at 100% to prevent extreme values
            return Math.min(Math.max(change, -100), 100);
        };
        const percentageChange = calculatePercentageChange(currentPeriodData.overview.totalTime, previousTotalTime);

        // Calculate time distribution (top 5 tasks by time spent) from currentPeriodData.byTask
        const timeDistribution = Object.entries(currentPeriodData.byTask)
            .map(([title, data]) => ({ title, totalTime: data.totalTime })) // Create array of {title, totalTime}
            .sort((a, b) => b.totalTime - a.totalTime) // Sort descending by totalTime
            .slice(0, 5) // Take top 5
            .reduce((acc, item) => {
                acc[item.title] = item.totalTime; // Convert back to object { title: totalTime }
                return acc;
            }, {});

        res.json({
            overview: currentPeriodData.overview,
            previous: {
                totalTime: previousTotalTime,
                percentageChange: percentageChange
            },
            byTask: currentPeriodData.byTask,
            timeDistribution: timeDistribution
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