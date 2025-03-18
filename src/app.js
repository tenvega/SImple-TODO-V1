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
    themeToggle.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path class="sun" d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1m12.364-5.364l-1.06 1.06M3.696 12.304l-1.06 1.06m1.06-10.728l-1.06-1.06m10.728 12.848l-1.06-1.06M13 8a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z" />
            <path class="moon" d="M13.5 8c0-3.033-2.467-5.5-5.5-5.5C5.467 2.5 3 4.967 3 8c0 3.033 2.467 5.5 5.5 5.5 1.725 0 3.266-.799 4.274-2.045A5.5 5.5 0 0 1 8 13.5 5.5 5.5 0 0 1 2.5 8 5.5 5.5 0 0 1 8 2.5c.41 0 .81.045 1.195.13C8.275 3.304 7.5 4.566 7.5 6c0 2.485 2.015 4.5 4.5 4.5.535 0 1.048-.094 1.524-.265A5.47 5.47 0 0 1 13.5 8Z" />
        </svg>
    `;
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
