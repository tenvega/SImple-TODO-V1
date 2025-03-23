// src/app.js - Updated Entry Point
import { StorageService } from './services/StorageService.js';
import { NotificationService } from './services/NotificationService.js';
import { TaskManager } from './services/TaskManager.js';
import { TaskList } from './components/TaskList.js';
import { TaskForm } from './components/TaskForm.js';
import { PomodoroTimer } from './components/PomodoroTimer.js';
import { AuthService } from './services/AuthService.js';
import { ApiService } from './services/ApiService.js';
import { Auth } from './components/Auth.js';
import { UserProfile } from './components/UserProfile.js';
import { AnalyticsDashboard } from './components/AnalyticsDashboard.js';
import { TaskItem } from './components/TaskItem.js';

// Initialize services
const notificationService = new NotificationService();
let storageService, taskManager, taskList, taskForm, pomodoroTimer;

// Authentication
const authService = new AuthService();
let apiService;

// App state
let isAuthenticated = false;
let currentView = 'tasks'; // 'tasks', 'analytics'

document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

function initializeApp() {
    // Check authentication status
    isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
        apiService = new ApiService(authService);
        initializeTaskApp();
    } else {
        showAuthScreen();
    }
    
    // Initialize navigation
    initializeNavigation();
}

function showAuthScreen() {
    const container = document.querySelector('.container');
    container.innerHTML = ''; // Clear container
    
    const auth = new Auth(authService, (user) => {
        isAuthenticated = true;
        apiService = new ApiService(authService);
        initializeTaskApp();
    });
    
    container.appendChild(auth.container);
}

function initializeTaskApp() {
    // Clear container
    const container = document.querySelector('.container');
    container.innerHTML = '';
    
    // Add user profile
    const userProfile = new UserProfile(authService, () => {
        isAuthenticated = false;
        showAuthScreen();
    });
    container.appendChild(userProfile.container);
    
    // Add navigation menu
    const navigation = document.createElement('div');
    navigation.className = 'app-navigation';
    navigation.innerHTML = `
        <button id="tasksView" class="nav-button active">Tasks</button>
        <button id="analyticsView" class="nav-button">Analytics</button>
    `;
    container.appendChild(navigation);
    
    // Add app container
    const appContainer = document.createElement('div');
    appContainer.className = 'app-container';
    container.appendChild(appContainer);
    
    // Set up navigation events
    document.getElementById('tasksView').addEventListener('click', () => {
        setActiveView('tasks');
    });
    
    document.getElementById('analyticsView').addEventListener('click', () => {
        setActiveView('analytics');
    });
    
    // Initialize services for task management
    if (apiService) {
        // Use API for tasks when authenticated
        storageService = {
            getTasks: async () => {
                try {
                    return await apiService.getTasks();
                } catch (error) {
                    console.error('Error fetching tasks:', error);
                    return [];
                }
            },
            saveTasks: async (tasks) => {
                // This is handled by individual API calls now
                return true;
            }
        };
    } else {
        // Fallback to local storage
        storageService = new StorageService();
    }
    
    taskManager = new TaskManager(storageService, notificationService);
    
    // Initialize the default view
    setActiveView('tasks');
}

function setActiveView(view) {
    currentView = view;
    
    // Update navigation buttons
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${view}View`).classList.add('active');
    
    // Clear app container
    const appContainer = document.querySelector('.app-container');
    appContainer.innerHTML = '';
    
    // Show selected view
    if (view === 'tasks') {
        showTasksView(appContainer);
    } else if (view === 'analytics') {
        showAnalyticsView(appContainer);
    }
}

function showTasksView(container) {
    // Create top section with Pomodoro and task input
    const topSection = document.createElement('div');
    topSection.className = 'top-section';
    
    // Create Pomodoro container
    const pomodoroContainer = document.createElement('div');
    pomodoroContainer.id = 'pomodoroContainer';
    topSection.appendChild(pomodoroContainer);
    
    // Create task input area
    const inputArea = document.createElement('div');
    inputArea.className = 'input-area';
    inputArea.innerHTML = `
        <input type="text" id="taskInput" placeholder="What needs to be done?">
        <input type="text" id="taskDescription" placeholder="Add description (optional)">
        <div class="date-inputs">
            <input type="datetime-local" id="dueDateInput">
            <span class="input-label">Due Date</span>
        </div>
        <div class="priority-select">
            <select id="priorityInput" class="priority-input">
                <option value="low">Low Priority</option>
                <option value="medium" selected>Medium Priority</option>
                <option value="high">High Priority</option>
            </select>
            <span class="input-label">Priority</span>
        </div>
        <div class="tags-input-container">
            <input type="text" id="tagsInput" placeholder="Add tags (comma separated)">
            <span class="input-label">Tags</span>
        </div>
        <button class="add-btn">Add Task</button>
    `;
    topSection.appendChild(inputArea);
    
    // Create tasks container
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    tasksContainer.innerHTML = `
        <div class="tasks-section">
            <h2>Pending Tasks</h2>
            <ul id="taskList" class="task-list"></ul>
        </div>
        
        <div class="tasks-section">
            <h2>Completed Tasks</h2>
            <ul id="completedTaskList" class="task-list"></ul>
        </div>
    `;
    
    // Add to container
    container.appendChild(topSection);
    container.appendChild(tasksContainer);
    
    // Initialize components
    taskList = new TaskList(
        taskManager.getTasks(),
        handleCompleteTask,
        handleDeleteTask,
        handleEditTask
    );
    
    taskForm = new TaskForm(handleNewTask);
    
    // Initialize Pomodoro Timer with task update callback
    pomodoroTimer = new PomodoroTimer(
        (message) => {
            notificationService.showNotification(message);
        },
        (taskId, isInPomodoro) => {
            // Update task's Pomodoro status and refresh the list
            const task = taskManager.getTaskById(taskId);
            if (task) {
                task.isInPomodoro = isInPomodoro;
                taskList.render();
            }
        },
        apiService
    );
    
    // Add timer to the container
    pomodoroContainer.appendChild(pomodoroTimer.element);
    
    // Listen for Pomodoro start events
    document.addEventListener('startPomodoro', (event) => {
        const { taskId, taskTitle } = event.detail;
        pomodoroTimer.setTask(taskId, taskTitle);
        
        // If using API service, track time
        if (apiService) {
            apiService.startPomodoro(taskId)
                .then(tracking => {
                    // Store tracking session ID for later
                    pomodoroTimer.currentTrackingId = tracking._id;
                })
                .catch(error => {
                    console.error('Error starting Pomodoro:', error);
                    notificationService.showNotification('Failed to start Pomodoro tracking', 'error');
                });
        }
    });
    
    // Listen for task list refresh events
    document.addEventListener('refreshTaskList', () => {
        taskList.updateTasks(taskManager.getTasks());
        taskList.render();
    });

    // Subscribe to task changes
    taskManager.subscribe((tasks) => {
        taskList.updateTasks(tasks);
    });

    // Initial render
    taskList.render();
}

function showAnalyticsView(container) {
    if (!apiService) {
        container.innerHTML = `
            <div class="error-message">
                <p>Analytics require authentication. Please login to view analytics.</p>
            </div>
        `;
        return;
    }

    // Create analytics dashboard
    const analyticsDashboard = new AnalyticsDashboard(apiService);
    container.appendChild(analyticsDashboard.container);
}

// Task management handlers
async function handleNewTask(taskData) {
    try {
        // If using API service
        if (apiService) {
            const task = await apiService.createTask(taskData);
            taskManager.addTask(task);
        } else {
            await taskManager.addTask(taskData);
        }
    } catch (error) {
        notificationService.showNotification(error.message, 'error');
    }
}

async function handleToggleTask(id) {
    try {
        const task = taskManager.getTaskById(id);
        if (!task) return;
        
        const newStatus = !task.completed;
        
        // If using API service
        if (apiService) {
            const updatedTask = await apiService.updateTask(id, { completed: newStatus });
            // Update local task manager with the server response
            await taskManager.updateTask(id, updatedTask);
        } else {
            await taskManager.toggleTask(id);
        }
    } catch (error) {
        notificationService.showNotification(error.message, 'error');
    }
}

async function handleDeleteTask(id) {
    try {
        // If using API service
        if (apiService) {
            await apiService.deleteTask(id);
        }
        
        await taskManager.deleteTask(id);
    } catch (error) {
        notificationService.showNotification(error.message, 'error');
    }
}

async function handleEditTask(id, updates) {
    try {
        // If using API service
        if (apiService) {
            const updatedTask = await apiService.updateTask(id, updates);
            // Update local task manager with the server response
            await taskManager.updateTask(id, updatedTask);
        } else {
            await taskManager.updateTask(id, updates);
        }
        
        // Show success notification
        notificationService.showNotification('Task updated successfully', 'success');
        
        // Refresh the task list
        document.dispatchEvent(new CustomEvent('refreshTaskList'));
    } catch (error) {
        notificationService.showNotification('Error updating task: ' + error.message, 'error');
        throw error;
    }
}

async function handleCompleteTask(taskId, completed) {
    try {
        // If using API service
        if (apiService) {
            const updatedTask = await apiService.updateTask(taskId, { completed });
            // Update local task manager with the server response
            await taskManager.updateTask(taskId, updatedTask);
        } else {
            await taskManager.toggleTask(taskId);
        }
        
        // Refresh the task list to show the changes
        taskList.updateTasks(taskManager.getTasks());
        taskList.render();
    } catch (error) {
        notificationService.showNotification('Error updating task completion status', 'error');
        throw error;
    }
}

// Navigation functionality
function initializeNavigation() {
    // Add navigation styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .app-navigation {
            display: flex;
            margin-bottom: 1.5rem;
            padding: 0.5rem 0;
            gap: 0.5rem;
        }
        
        .nav-button {
            background: #f5f5f5;
            border: none;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            cursor: pointer;
            color: var(--foreground);
            transition: all 0.2s ease;
            border-radius: 4px;
        }
        
        .nav-button:hover {
            background: #ebebeb;
        }
        
        .nav-button.active {
            background: #e5e5e5;
            color: var(--foreground);
        }

        /* Night mode specific styles */
        .night-mode .nav-button {
            background-color: #404040;
            color: var(--foreground);
        }

        .night-mode .nav-button:hover {
            background-color: #454545;
        }

        .night-mode .nav-button.active {
            background-color: #505050;
        }

        /* Dashboard specific styles */
        .analytics-dashboard {
            padding: 1.5rem;
        }
        
        .analytics-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .analytics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .analytics-card {
            background-color: var(--card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem;
            height: 100%;
        }
        
        .analytics-card h3 {
            margin-top: 0;
            margin-bottom: 1rem;
            font-size: 1rem;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }
        
        .metric-item {
            text-align: center;
            padding: 1rem;
            background-color: color-mix(in srgb, var(--accent) 50%, var(--card));
            border-radius: var(--radius);
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .metric-label {
            font-size: 0.875rem;
            color: var(--muted-foreground);
        }
        
        .chart-container {
            height: 300px;
            position: relative;
        }
        
        .analytics-insights-container {
            margin-bottom: 1.5rem;
        }
        
        .insights-card {
            background-color: var(--card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem;
        }
        
        .insights-card h3 {
            margin-top: 0;
            margin-bottom: 1rem;
            font-size: 1rem;
        }
        
        .ai-summary {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            align-items: flex-start;
        }
        
        .ai-icon {
            flex-shrink: 0;
            color: var(--success);
        }
        
        .ai-insights-list {
            padding-left: 2.5rem;
            margin: 0;
        }
        
        .ai-insights-list li {
            margin-bottom: 0.5rem;
        }
        
        .comparison-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
        }
        
        .comparison-item {
            background-color: var(--card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1rem;
        }
        
        .comparison-label {
            font-size: 0.875rem;
            color: var(--muted-foreground);
            margin-bottom: 0.5rem;
        }
        
        .comparison-values {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
        }
        
        .current-value {
            font-size: 1.25rem;
            font-weight: bold;
        }
        
        .change-indicator {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.875rem;
        }
        
        .change-arrow.positive {
            color: var(--success);
        }
        
        .change-arrow.negative {
            color: var(--destructive);
        }
        
        .change-value.positive {
            color: var(--success);
        }
        
        .change-value.negative {
            color: var(--destructive);
        }
        
        /* Responsive adjustments */
        @media screen and (max-width: 768px) {
            .analytics-grid {
                grid-template-columns: 1fr;
            }
            
            .comparison-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .chart-container {
                height: 250px;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}

async function createTaskItem(task) {
    return new TaskItem(
        task,
        handleCompleteTask,
        handleDeleteTask,
        handleEditTask
    );
}
