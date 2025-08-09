"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Clock, Target, BarChart3, PieChart, CheckSquare, Play } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface AnalyticsData {
    summary: {
        totalTasks: number;
        completedTasks: number;
        pendingTasks: number;
        completionRate: number;
        totalTimeSpent: number;
        totalPomodoros: number;
        avgSessionLength: number;
        totalSessions: number;
    };
    charts: {
        priorityDistribution: Array<{ priority: string; count: number }>;
        completionTrend: Array<{ date: string; completed: number }>;
        tagDistribution: Array<{ tag: string; count: number }>;
        dailyProductivity: Array<{ date: string; created: number; completed: number; completionRate: number }>;
    };
    dateRange: {
        startDate: string;
        endDate: string;
    };
}

interface AnalyticsDashboardProps {
    userId: string;
}

const COLORS = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#f97316'
};

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        days: 30,
        label: 'Last 30 days'
    });

    const fetchAnalytics = async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const endDate = new Date();
            const startDate = new Date(Date.now() - dateRange.days * 24 * 60 * 60 * 1000);

            const params = new URLSearchParams({
                userId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });

            const response = await fetch(`/api/analytics?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch analytics');
            }

            const data = await response.json();
            setAnalytics(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [userId, dateRange.days]);

    const formatTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="pb-2">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                                <div className="h-3 bg-muted rounded w-full"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Unable to load analytics</p>
                            <p className="text-sm">{error}</p>
                            <Button onClick={fetchAnalytics} className="mt-4">
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!analytics) return null;

    const dateRangeOptions = [
        { days: 7, label: 'Last 7 days' },
        { days: 30, label: 'Last 30 days' },
        { days: 90, label: 'Last 3 months' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                    <p className="text-muted-foreground">
                        Insights for {dateRange.label.toLowerCase()}
                    </p>
                </div>

                {/* Date Range Selector */}
                <div className="flex gap-2">
                    {dateRangeOptions.map((option) => (
                        <Button
                            key={option.days}
                            variant={dateRange.days === option.days ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDateRange(option)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.summary.totalTasks}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.summary.completedTasks} completed, {analytics.summary.pendingTasks} pending
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.summary.completionRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.summary.completedTasks} of {analytics.summary.totalTasks} tasks
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Time Focused</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatTime(analytics.summary.totalTimeSpent)}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.summary.totalPomodoros} Pomodoro sessions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
                        <Play className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatTime(Math.round(analytics.summary.avgSessionLength))}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.summary.totalSessions} total sessions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Productivity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Daily Productivity
                        </CardTitle>
                        <CardDescription>Tasks created vs completed over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.charts.dailyProductivity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickFormatter={formatDate} />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(label) => formatDate(label)}
                                    formatter={(value, name) => [value, name === 'created' ? 'Created' : 'Completed']}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="created"
                                    stroke={COLORS.secondary}
                                    strokeWidth={2}
                                    name="Created"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="completed"
                                    stroke={COLORS.primary}
                                    strokeWidth={2}
                                    name="Completed"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Priority Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Priority Distribution
                        </CardTitle>
                        <CardDescription>Tasks breakdown by priority level</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <RechartsPieChart>
                                <Pie
                                    dataKey="count"
                                    data={analytics.charts.priorityDistribution}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    innerRadius={40}
                                    label={({ priority, count, percent }) =>
                                        `${((percent || 0) * 100).toFixed(0)}%`
                                    }
                                    labelLine={false}
                                >
                                    {analytics.charts.priorityDistribution.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[entry.priority as keyof typeof COLORS] || COLORS.primary}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name, props) => {
                                        const priority = props.payload?.priority || name;
                                        const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);
                                        return [`${value} tasks`, `${priorityLabel} Priority`];
                                    }}
                                    labelFormatter={() => null}
                                />
                            </RechartsPieChart>
                        </ResponsiveContainer>

                        {/* Custom Legend */}
                        <div className="flex justify-center gap-6 mt-4">
                            {analytics.charts.priorityDistribution.map((item) => (
                                <div key={item.priority} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLORS[item.priority as keyof typeof COLORS] || COLORS.primary }}
                                    />
                                    <span className="text-sm font-medium">
                                        {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        ({item.count} tasks)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Tag Distribution */}
                {analytics.charts.tagDistribution.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Popular Tags
                            </CardTitle>
                            <CardDescription>Most frequently used tags</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.charts.tagDistribution.slice(0, 6)}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="tag" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill={COLORS.accent} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Completion Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Completion Trend
                        </CardTitle>
                        <CardDescription>Tasks completed each day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.charts.completionTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickFormatter={formatDate} />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(label) => formatDate(label)}
                                    formatter={(value) => [value, 'Completed']}
                                />
                                <Bar dataKey="completed" fill={COLORS.primary} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}