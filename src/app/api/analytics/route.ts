import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import TimeTracking from '@/models/TimeTracking';
import mongoose from 'mongoose';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
    userId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const query = analyticsQuerySchema.parse({
            userId: searchParams.get('userId'),
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
        });

        // Set default date range (last 30 days)
        const endDate = query.endDate ? new Date(query.endDate) : new Date();
        const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const dateFilter = {
            $gte: startDate,
            $lte: endDate,
        };

        // Task completion statistics
        const userIdObj = new mongoose.Types.ObjectId(query.userId);

        const totalTasks = await Task.countDocuments({
            userId: userIdObj,
            createdDate: dateFilter
        });

        const completedTasks = await Task.countDocuments({
            userId: userIdObj,
            completed: true,
            createdDate: dateFilter
        });

        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Priority distribution
        const priorityStats = await Task.aggregate([
            {
                $match: {
                    userId: userIdObj,
                    createdDate: dateFilter
                }
            },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Task completion over time (daily)
        const completionTrend = await Task.aggregate([
            {
                $match: {
                    userId: userIdObj,
                    completed: true,
                    completedDate: dateFilter
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$completedDate' },
                        month: { $month: '$completedDate' },
                        day: { $dayOfMonth: '$completedDate' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        // Tag distribution
        const tagStats = await Task.aggregate([
            {
                $match: {
                    userId: userIdObj,
                    createdDate: dateFilter
                }
            },
            { $unwind: '$tags' },
            {
                $group: {
                    _id: '$tags',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Time tracking statistics
        const timeTrackingStats = await TimeTracking.aggregate([
            {
                $match: {
                    userId: userIdObj,
                    startTime: dateFilter
                }
            },
            {
                $group: {
                    _id: null,
                    totalTimeSpent: { $sum: '$duration' },
                    totalSessions: { $sum: 1 },
                    avgSessionLength: { $avg: '$duration' }
                }
            }
        ]);

        // Pomodoro statistics
        const pomodoroStats = await Task.aggregate([
            {
                $match: {
                    userId: userIdObj,
                    createdDate: dateFilter
                }
            },
            {
                $group: {
                    _id: null,
                    totalPomodoros: { $sum: '$pomodoroCount' },
                    totalTimeSpent: { $sum: '$timeSpent' }
                }
            }
        ]);

        // Daily productivity (tasks completed per day)
        const dailyProductivity = await Task.aggregate([
            {
                $match: {
                    userId: userIdObj,
                    createdDate: dateFilter
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdDate' },
                        month: { $month: '$createdDate' },
                        day: { $dayOfMonth: '$createdDate' }
                    },
                    created: { $sum: 1 },
                    completed: {
                        $sum: {
                            $cond: ['$completed', 1, 0]
                        }
                    }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        const analytics = {
            summary: {
                totalTasks,
                completedTasks,
                pendingTasks: totalTasks - completedTasks,
                completionRate: Math.round(completionRate),
                totalTimeSpent: pomodoroStats[0]?.totalTimeSpent || 0,
                totalPomodoros: pomodoroStats[0]?.totalPomodoros || 0,
                avgSessionLength: timeTrackingStats[0]?.avgSessionLength || 0,
                totalSessions: timeTrackingStats[0]?.totalSessions || 0
            },
            charts: {
                priorityDistribution: priorityStats.map(stat => ({
                    priority: stat._id,
                    count: stat.count
                })),
                completionTrend: completionTrend.map(trend => ({
                    date: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}-${trend._id.day.toString().padStart(2, '0')}`,
                    completed: trend.count
                })),
                tagDistribution: tagStats.map(tag => ({
                    tag: tag._id,
                    count: tag.count
                })),
                dailyProductivity: dailyProductivity.map(day => ({
                    date: `${day._id.year}-${day._id.month.toString().padStart(2, '0')}-${day._id.day.toString().padStart(2, '0')}`,
                    created: day.created,
                    completed: day.completed,
                    completionRate: day.created > 0 ? Math.round((day.completed / day.created) * 100) : 0
                }))
            },
            dateRange: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }
        };

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid query parameters', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}