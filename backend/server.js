// server.js - Main Express application

import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import OpenAI from 'openai';
// import analyticsRoutes from './routes/analytics.js';
import { User, Task, TimeTracking } from './models/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');
console.log('Loading .env file from:', envPath);

// First, try to load the .env file
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
}

// Debug environment variables
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('API_URL:', process.env.API_URL);

const app = express();

// Middleware
app.use(helmet());

// CORS configuration with fallback
const corsOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:5500', 'http://127.0.0.1:5501'];
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(express.json());

// Database connection with debug options
console.log('Attempting to connect to MongoDB with URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB successfully');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        console.error('Connection string used:', process.env.MONGODB_URI);
        process.exit(1);
    });

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Handle application shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// USER ROUTES

// Register user
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    
    // Add validation
    if (!email || !name || !password) {
      return res.status(400).json({ 
        message: 'All fields are required' 
      });
    }

    // Log the request body for debugging
    console.log('Registration attempt:', { email, name, password: '***' });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists' 
      });
    }
    
    // Create new user
    const user = new User({ 
      email, 
      name, 
      password // Password will be hashed by the pre-save middleware
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Send response
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    // Log the full error for debugging
    console.error('Registration error:', error);
    
    // Send appropriate error response
    res.status(500).json({ 
      message: error.message || 'Server error during registration',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Login user
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
app.get('/api/users/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// TASK ROUTES

// Get all tasks for current user
app.get('/api/tasks', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Create a new task
app.post('/api/tasks', authenticate, async (req, res) => {
  try {
    const { title, description, dueDate, priority, tags } = req.body;
    
    // Validate input
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const task = new Task({
      userId: req.userId,
      title,
      description,
      dueDate,
      priority,
      tags
    });
    
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Update a task
app.put('/api/tasks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Find task and verify ownership
    const task = await Task.findOne({ _id: id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Update fields
    Object.keys(updates).forEach(update => {
      task[update] = updates[update];
    });
    
    // If task is being marked as completed, add completedDate
    if (updates.completed && !task.completedDate) {
      task.completedDate = new Date();
    }
    
    // If task is being marked as incomplete, remove completedDate
    if (updates.completed === false) {
      task.completedDate = null;
    }
    
    await task.save();
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find task and verify ownership
    const task = await Task.findOne({ _id: id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    await task.remove();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// TIME TRACKING ROUTES

// Start a pomodoro session
app.post('/api/tracking/start', authenticate, async (req, res) => {
  try {
    const { taskId } = req.body;
    
    // Verify task exists and belongs to user
    if (taskId) {
      const task = await Task.findOne({ _id: taskId, userId: req.userId });
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
    }
    
    const timeTracking = new TimeTracking({
      userId: req.userId,
      taskId: taskId || null,
      startTime: new Date(),
      type: 'pomodoro'
    });
    
    await timeTracking.save();
    res.status(201).json(timeTracking);
  } catch (error) {
    console.error('Start tracking error:', error);
    res.status(500).json({ message: 'Error starting time tracking' });
  }
});

// End a pomodoro session
app.put('/api/tracking/:id/end', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find tracking session and verify ownership
    const timeTracking = await TimeTracking.findOne({ _id: id, userId: req.userId });
    if (!timeTracking) {
      return res.status(404).json({ message: 'Tracking session not found' });
    }
    
    // Set end time
    const endTime = new Date();
    timeTracking.endTime = endTime;
    
    // Calculate duration in seconds
    const duration = Math.floor((endTime - timeTracking.startTime) / 1000);
    timeTracking.duration = duration;
    
    await timeTracking.save();
    
    // If task is associated, update task's timeSpent
    if (timeTracking.taskId) {
      const task = await Task.findById(timeTracking.taskId);
      if (task) {
        task.timeSpent = (task.timeSpent || 0) + Math.floor(duration / 60);
        task.pomodoroCount = (task.pomodoroCount || 0) + 1;
        await task.save();
      }
    }
    
    res.json(timeTracking);
  } catch (error) {
    console.error('End tracking error:', error);
    res.status(500).json({ message: 'Error ending time tracking' });
  }
});

// ANALYTICS ROUTES

// Get task analytics
app.get('/api/analytics/tasks', authenticate, async (req, res) => {
  try {
    const { timeframe } = req.query; // 'day', 'week', 'month', 'all'
    
    // Create date filters based on timeframe
    const now = new Date();
    let dateFilter = {};
    
    if (timeframe === 'day') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter = { createdDate: { $gte: startOfDay } };
    } else if (timeframe === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { createdDate: { $gte: startOfWeek } };
    } else if (timeframe === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdDate: { $gte: startOfMonth } };
    }
    
    // Fetch tasks with filters
    const tasks = await Task.find({
      userId: req.userId,
      ...dateFilter
    });
    
    // Calculate basic analytics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Time spent analytics
    const totalTimeSpent = tasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
    const avgTimePerTask = totalTasks > 0 ? totalTimeSpent / totalTasks : 0;
    
    // Tag analysis
    const tagCounts = {};
    tasks.forEach(task => {
      if (task.tags && task.tags.length) {
        task.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Priority analysis
    const priorityCounts = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };
    
    // Completion by priority
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium');
    const lowPriorityTasks = tasks.filter(t => t.priority === 'low');
    
    const highPriorityCompletion = highPriorityTasks.length > 0 
      ? (highPriorityTasks.filter(t => t.completed).length / highPriorityTasks.length) * 100 
      : 0;
      
    const mediumPriorityCompletion = mediumPriorityTasks.length > 0 
      ? (mediumPriorityTasks.filter(t => t.completed).length / mediumPriorityTasks.length) * 100 
      : 0;
      
    const lowPriorityCompletion = lowPriorityTasks.length > 0 
      ? (lowPriorityTasks.filter(t => t.completed).length / lowPriorityTasks.length) * 100 
      : 0;
    
    res.json({
      overview: {
        totalTasks,
        completedTasks,
        completionRate,
        totalTimeSpent,
        avgTimePerTask
      },
      byTag: tagCounts,
      byPriority: {
        counts: priorityCounts,
        completionRates: {
          high: highPriorityCompletion,
          medium: mediumPriorityCompletion,
          low: lowPriorityCompletion
        }
      }
    });
  } catch (error) {
    console.error('Task analytics error:', error);
    res.status(500).json({ message: 'Error generating analytics' });
  }
});

// Get time tracking analytics
app.get('/api/analytics/time', authenticate, async (req, res) => {
  try {
    const { timeframe } = req.query; // 'day', 'week', 'month', 'all'
    
    // Create date filters based on timeframe
    const now = new Date();
    let dateFilter = {};
    
    if (timeframe === 'day') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter = { startTime: { $gte: startOfDay } };
    } else if (timeframe === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { startTime: { $gte: startOfWeek } };
    } else if (timeframe === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { startTime: { $gte: startOfMonth } };
    }
    
    // Fetch time tracking data
    const timeTrackings = await TimeTracking.find({
      userId: req.userId,
      endTime: { $ne: null }, // Only include completed sessions
      ...dateFilter
    }).populate('taskId', 'title priority');
    
    // Calculate time analytics
    const totalTime = timeTrackings.reduce((sum, session) => sum + (session.duration || 0), 0);
    const totalSessions = timeTrackings.length;
    const avgSessionTime = totalSessions > 0 ? totalTime / totalSessions : 0;
    
    // Group by day
    const timeByDay = {};
    timeTrackings.forEach(session => {
      const day = session.startTime.toISOString().split('T')[0];
      timeByDay[day] = (timeByDay[day] || 0) + (session.duration || 0);
    });
    
    // Group by task
    const timeByTask = {};
    timeTrackings.forEach(session => {
      if (session.taskId) {
        const taskId = session.taskId._id.toString();
        const taskTitle = session.taskId.title;
        
        if (!timeByTask[taskId]) {
          timeByTask[taskId] = {
            title: taskTitle,
            priority: session.taskId.priority,
            totalTime: 0,
            sessions: 0
          };
        }
        
        timeByTask[taskId].totalTime += (session.duration || 0);
        timeByTask[taskId].sessions += 1;
      }
    });
    
    res.json({
      overview: {
        totalTime,
        totalSessions,
        avgSessionTime
      },
      byDay: timeByDay,
      byTask: timeByTask
    });
  } catch (error) {
    console.error('Time analytics error:', error);
    res.status(500).json({ message: 'Error generating time analytics' });
  }
});

// Get comparison analytics
app.get('/api/analytics/comparison', authenticate, async (req, res) => {
  try {
    const { timeframe } = req.query; // 'day', 'week', 'month'
    
    // Calculate current and previous period dates
    const now = new Date();
    let currentStartDate, currentEndDate, previousStartDate, previousEndDate;
    
    if (timeframe === 'day') {
      // Current day
      currentStartDate = new Date(now);
      currentStartDate.setHours(0, 0, 0, 0);
      currentEndDate = new Date(now);
      currentEndDate.setHours(23, 59, 59, 999);
      
      // Previous day
      previousStartDate = new Date(currentStartDate);
      previousStartDate.setDate(previousStartDate.getDate() - 1);
      previousEndDate = new Date(currentEndDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);
    } else if (timeframe === 'week') {
      // Current week
      const dayOfWeek = now.getDay();
      currentStartDate = new Date(now);
      currentStartDate.setDate(currentStartDate.getDate() - dayOfWeek);
      currentStartDate.setHours(0, 0, 0, 0);
      currentEndDate = new Date(currentStartDate);
      currentEndDate.setDate(currentEndDate.getDate() + 6);
      currentEndDate.setHours(23, 59, 59, 999);
      
      // Previous week
      previousStartDate = new Date(currentStartDate);
      previousStartDate.setDate(previousStartDate.getDate() - 7);
      previousEndDate = new Date(currentEndDate);
      previousEndDate.setDate(previousEndDate.getDate() - 7);
    } else if (timeframe === 'month') {
      // Current month
      currentStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Previous month
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else {
      return res.status(400).json({ message: 'Invalid timeframe parameter' });
    }
    
    // Function to get analytics for a specific period
    async function getAnalyticsForPeriod(startDate, endDate) {
      // Get tasks created or updated in this period
      const tasks = await Task.find({
        userId: req.userId,
        $or: [
          { createdDate: { $gte: startDate, $lte: endDate } },
          { completedDate: { $gte: startDate, $lte: endDate } }
        ]
      });
      
      // Get tracking sessions in this period
      const timeTrackings = await TimeTracking.find({
        userId: req.userId,
        startTime: { $gte: startDate, $lte: endDate },
        endTime: { $ne: null }
      });
      
      // Calculate metrics
      const tasksCreated = tasks.filter(t => 
        new Date(t.createdDate) >= startDate && 
        new Date(t.createdDate) <= endDate
      ).length;
      
      const tasksCompleted = tasks.filter(t => 
        t.completed && 
        t.completedDate && 
        new Date(t.completedDate) >= startDate && 
        new Date(t.completedDate) <= endDate
      ).length;
      
      const totalTime = timeTrackings.reduce((sum, session) => sum + (session.duration || 0), 0);
      const totalSessions = timeTrackings.length;
      
      return {
        tasksCreated,
        tasksCompleted,
        totalTime,
        totalSessions
      };
    }
    
    // Get analytics for current and previous periods
    const currentPeriod = await getAnalyticsForPeriod(currentStartDate, currentEndDate);
    const previousPeriod = await getAnalyticsForPeriod(previousStartDate, previousEndDate);
    
    // Calculate changes
    const tasksCreatedChange = previousPeriod.tasksCreated > 0
      ? ((currentPeriod.tasksCreated - previousPeriod.tasksCreated) / previousPeriod.tasksCreated) * 100
      : currentPeriod.tasksCreated > 0 ? 100 : 0;
      
    const tasksCompletedChange = previousPeriod.tasksCompleted > 0
      ? ((currentPeriod.tasksCompleted - previousPeriod.tasksCompleted) / previousPeriod.tasksCompleted) * 100
      : currentPeriod.tasksCompleted > 0 ? 100 : 0;
      
    const totalTimeChange = previousPeriod.totalTime > 0
      ? ((currentPeriod.totalTime - previousPeriod.totalTime) / previousPeriod.totalTime) * 100
      : currentPeriod.totalTime > 0 ? 100 : 0;
      
    const totalSessionsChange = previousPeriod.totalSessions > 0
      ? ((currentPeriod.totalSessions - previousPeriod.totalSessions) / previousPeriod.totalSessions) * 100
      : currentPeriod.totalSessions > 0 ? 100 : 0;
    
    res.json({
      current: currentPeriod,
      previous: previousPeriod,
      changes: {
        tasksCreated: tasksCreatedChange,
        tasksCompleted: tasksCompletedChange,
        totalTime: totalTimeChange,
        totalSessions: totalSessionsChange
      },
      dateRanges: {
        current: {
          start: currentStartDate,
          end: currentEndDate
        },
        previous: {
          start: previousStartDate,
          end: previousEndDate
        }
      }
    });
  } catch (error) {
    console.error('Comparison analytics error:', error);
    res.status(500).json({ message: 'Error generating comparison analytics' });
  }
});

// GEMINI AI INSIGHTS ROUTE

// Get AI insights based on analytics
app.get('/api/insights', authenticate, async (req, res) => {
  try {
    // Get analytics data
    const tasks = await Task.find({ userId: req.userId });
    const timeTrackings = await TimeTracking.find({ 
      userId: req.userId,
      endTime: { $ne: null }
    });
    
    // Calculate metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const totalTime = timeTrackings.reduce((sum, session) => sum + (session.duration || 0), 0);
    const totalTimeHours = Math.floor(totalTime / 3600);
    const totalTimeMinutes = Math.floor((totalTime % 3600) / 60);
    
    // Create prompt for OpenAI
    const prompt = `
      User Productivity Analytics:
      - Total tasks: ${totalTasks}
      - Completed tasks: ${completedTasks} (${completionRate.toFixed(1)}% completion rate)
      - Total time spent: ${totalTimeHours}h ${totalTimeMinutes}m
      - Total pomodoro sessions: ${timeTrackings.length}
      
      Task breakdown by priority:
      - High priority: ${tasks.filter(t => t.priority === 'high').length} tasks
      - Medium priority: ${tasks.filter(t => t.priority === 'medium').length} tasks
      - Low priority: ${tasks.filter(t => t.priority === 'low').length} tasks
      
      Based on this data, please provide:
      1. A short summary (2-3 sentences) of the user's productivity
      2. Three specific, actionable insights to help improve productivity
      3. Keep the tone supportive and encouraging
    `;
    
    // Use OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a productivity expert AI assistant. Analyze the user's task and time tracking data to provide helpful insights. Be specific, actionable, and encouraging." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;
    
    // Parse response
    let summary = '';
    let insights = [];
    
    // Split response into paragraphs
    const paragraphs = response.split('\n\n').filter(p => p.trim());
    
    if (paragraphs.length > 0) {
      summary = paragraphs[0].trim();
      
      // Look for numbered insights
      insights = response.match(/\d[\.\)]\s+.+/g) || [];
      
      // If no numbered insights found, use remaining paragraphs
      if (insights.length === 0 && paragraphs.length > 1) {
        insights = paragraphs.slice(1).map(p => p.trim());
      }
      
      // Clean up the insights
      insights = insights.map(insight => {
        return insight.replace(/^\d[\.\)]\s+/, '').trim();
      });
    }
    
    // Fallback if parsing fails
    if (!summary) {
      summary = "Based on your task data, you're making steady progress on your productivity goals.";
    }
    
    if (insights.length === 0) {
      insights = [
        "Consider focusing on high-priority tasks first thing in your day",
        "Short, frequent breaks can help maintain productivity",
        "Try grouping similar tasks together to reduce context switching"
      ];
    }
    
    res.json({ summary, insights });
    
  } catch (error) {
    console.error('AI insights error:', error);
    // Provide fallback insights if API fails
    res.json({
      summary: "Based on your task data, you're making steady progress on your productivity goals.",
      insights: [
        "Consider focusing on high-priority tasks first thing in your day",
        "Short, frequent breaks can help maintain productivity",
        "Try grouping similar tasks together to reduce context switching"
      ]
    });
  }
});

// Mount the analytics routes
// app.use('/api/analytics', analyticsRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
export { User, Task, TimeTracking };
