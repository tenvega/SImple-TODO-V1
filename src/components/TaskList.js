import { TaskItem } from './TaskItem.js';

export class TaskList {
    constructor(tasks, onToggle, onDelete, onEdit) {
        this.tasks = tasks;
        this.onToggle = onToggle;
        this.onDelete = onDelete;
        this.onEdit = onEdit;
        this.pendingList = document.getElementById('taskList');
        this.completedList = document.getElementById('completedTaskList');
        this.isLoading = false;
    }

    updateTasks(newTasks) {
        this.tasks = newTasks;
        this.render();
    }

    setLoading(loading) {
        this.isLoading = loading;
        if (loading) {
            this.pendingList.classList.add('loading');
            this.completedList.classList.add('loading');
        } else {
            this.pendingList.classList.remove('loading');
            this.completedList.classList.remove('loading');
        }
    }

    render() {
        if (this.isLoading) {
            this.renderLoadingState();
            return;
        }

        this.clearLists();
        
        const pendingTasks = this.tasks
            .filter(task => !task.completed)
            .sort((a, b) => {
                // If a task has no due date, put it at the bottom
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                // Sort by due date (ascending)
                return new Date(a.dueDate) - new Date(b.dueDate);
            });

        const completedTasks = this.tasks
            .filter(task => task.completed)
            .sort((a, b) => {
                // Sort completed tasks by completion date (most recent first)
                return new Date(b.completedDate) - new Date(a.completedDate);
            });

        pendingTasks.forEach(task => {
            const taskItem = new TaskItem(
                task,
                this.onToggle,
                this.onDelete,
                this.onEdit
            );
            this.pendingList.appendChild(taskItem.createTaskElement());
        });

        completedTasks.forEach(task => {
            const taskItem = new TaskItem(
                task,
                this.onToggle,
                this.onDelete,
                this.onEdit
            );
            this.completedList.appendChild(taskItem.createTaskElement());
        });

        this.updateTaskCounts(pendingTasks.length, completedTasks.length);
    }

    renderLoadingState() {
        this.clearLists();
        const loadingTemplate = `
            <li class="task-item loading-item">
                <div class="loading-animation"></div>
            </li>
        `;
        this.pendingList.innerHTML = loadingTemplate.repeat(2);
        this.completedList.innerHTML = loadingTemplate.repeat(2);
    }

    clearLists() {
        this.pendingList.innerHTML = '';
        this.completedList.innerHTML = '';
    }

    updateTaskCounts(pendingCount, completedCount) {
        const pendingHeader = document.querySelector('.tasks-section:first-child h2');
        const completedHeader = document.querySelector('.tasks-section:last-child h2');
        
        pendingHeader.textContent = `Pending Tasks (${pendingCount})`;
        completedHeader.textContent = `Completed Tasks (${completedCount})`;
    }

    addTask(task) {
        this.tasks.push(task);
        this.render();
    }

    removeTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.render();
    }

    updateTask(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates);
            this.render();
        }
    }

    toggleTaskStatus(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedDate = task.completed ? new Date().toISOString() : null;
            this.render();
        }
    }
}
