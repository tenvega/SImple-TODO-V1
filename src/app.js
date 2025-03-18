import { StorageService } from './services/StorageService.js';
import { formatDate, getTomorrowDate, formatDateForInput } from './utils/dateUtils.js';
import { NotificationService } from './services/NotificationService.js';
import { TaskManager } from './services/TaskManager.js';
import { TaskList } from './components/TaskList.js';
import { TaskItem } from './components/TaskItem.js';
import { TaskForm } from './components/TaskForm.js';
import { PomodoroTimer } from './components/PomodoroTimer.js';

// Initialize services
const storageService = new StorageService();
const notificationService = new NotificationService();
const taskManager = new TaskManager(storageService, notificationService);

let taskList;
let taskForm;
let pomodoroTimer;

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'night') {
        document.body.classList.add('night-mode');
    }
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('night-mode');
    localStorage.setItem('theme', body.classList.contains('night-mode') ? 'night' : 'light');
}

function createThemeToggle() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '🌓';
    themeToggle.title = 'Toggle Night Mode';
    themeToggle.onclick = toggleTheme;
    document.body.appendChild(themeToggle);
}

document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    createThemeToggle();
    initializeApp();
});

// Listen for task list refresh requests
document.addEventListener('refreshTaskList', () => {
    taskList.render();
});

function initializeApp() {
    // Initialize components
    taskList = new TaskList(
        taskManager.getTasks(),
        handleToggleTask,
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
        }
    );
    
    // Add timer to the container
    const pomodoroContainer = document.getElementById('pomodoroContainer');
    pomodoroContainer.appendChild(pomodoroTimer.element);
    
    // Listen for Pomodoro start events
    document.addEventListener('startPomodoro', (event) => {
        const { taskId, taskTitle } = event.detail;
        pomodoroTimer.setTask(taskId, taskTitle);
    });
    
    // Subscribe to task changes
    taskManager.subscribe((tasks) => {
        taskList.updateTasks(tasks);
    });

    // Initial render
    taskList.render();
}

async function handleNewTask(taskData) {
    try {
        await taskManager.addTask(taskData);
    } catch (error) {
        notificationService.showNotification(error.message, 'error');
    }
}

async function handleToggleTask(id) {
    try {
        await taskManager.toggleTask(id);
    } catch (error) {
        notificationService.showNotification(error.message, 'error');
    }
}

async function handleDeleteTask(id) {
    try {
        await taskManager.deleteTask(id);
    } catch (error) {
        notificationService.showNotification(error.message, 'error');
    }
}

async function handleEditTask(id, updates) {
    try {
        await taskManager.updateTask(id, updates);
    } catch (error) {
        notificationService.showNotification(error.message, 'error');
    }
}
