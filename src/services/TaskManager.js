export class TaskManager {
    constructor(storageService, notificationService) {
        this.storageService = storageService;
        this.notificationService = notificationService;
        this.tasks = [];
        this.subscribers = [];
        this.initialize();
    }

    // Helper method to get task ID regardless of format
    getTaskId(task) {
        return task.id || task._id;
    }

    // Helper method to find task index by either id or _id
    findTaskIndex(searchId) {
        return this.tasks.findIndex(task => 
            (task.id === searchId) || (task._id === searchId)
        );
    }

    async initialize() {
        try {
            const tasks = await this.storageService.getTasks();
            this.tasks = tasks || [];
            this.notifySubscribers();
        } catch (error) {
            console.error('Error initializing tasks:', error);
            this.tasks = [];
        }
    }

    // Add listener for task changes
    subscribe(listener) {
        this.subscribers.push(listener);
    }

    // Notify all listeners of changes
    notifySubscribers() {
        this.subscribers.forEach(listener => listener(this.tasks));
    }

    async addTask(task) {
        if (!this.getTaskId(task)) {
            task.id = Date.now().toString();
        }
        this.tasks.push(task);
        await this.saveTasks();
        this.notifySubscribers();
        return task;
    }

    async toggleTask(id) {
        const taskIndex = this.findTaskIndex(id);
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        this.tasks[taskIndex].completed = !this.tasks[taskIndex].completed;
        await this.saveTasks();
        this.notifySubscribers();
        return this.tasks[taskIndex];
    }

    async updateTask(id, updates) {
        const taskIndex = this.findTaskIndex(id);
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        // If we receive a complete task object, preserve the ID format
        if (typeof updates === 'object' && (updates.id || updates._id)) {
            const existingId = this.getTaskId(this.tasks[taskIndex]);
            this.tasks[taskIndex] = { 
                ...updates,
                // Preserve the original ID format
                id: updates.id || existingId,
                _id: updates._id || existingId
            };
        } else {
            // Otherwise, merge the updates with the existing task
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...updates
            };
        }

        await this.saveTasks();
        this.notifySubscribers();
        return this.tasks[taskIndex];
    }

    async deleteTask(id) {
        const taskIndex = this.findTaskIndex(id);
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        this.tasks.splice(taskIndex, 1);
        await this.saveTasks();
        this.notifySubscribers();
    }

    getTasks() {
        return [...this.tasks];
    }

    getTaskById(id) {
        return this.tasks.find(task => 
            (task.id === id) || (task._id === id)
        );
    }

    getPendingTasks() {
        return this.tasks.filter(t => !t.completed);
    }

    getCompletedTasks() {
        return this.tasks.filter(t => t.completed);
    }

    // Get all unique tags from tasks
    getAllTags() {
        const tagsSet = new Set();
        this.tasks.forEach(task => {
            if (task.tags) {
                task.tags.forEach(tag => tagsSet.add(tag));
            }
        });
        return Array.from(tagsSet).sort();
    }

    // Get tasks by tag
    getTasksByTag(tag) {
        return this.tasks.filter(task => task.tags && task.tags.includes(tag));
    }

    // Add tag to task
    async addTagToTask(taskId, tag) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        if (!task.tags) {
            task.tags = [];
        }
        if (!task.tags.includes(tag)) {
            task.tags.push(tag);
            await this.storageService.saveTasks(this.tasks);
            this.notifySubscribers();
        }
    }

    // Remove tag from task
    async removeTagFromTask(taskId, tag) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.tags) {
            return;
        }
        task.tags = task.tags.filter(t => t !== tag);
        await this.storageService.saveTasks(this.tasks);
        this.notifySubscribers();
    }

    async saveTasks() {
        try {
            await this.storageService.saveTasks(this.tasks);
        } catch (error) {
            console.error('Error saving tasks:', error);
            throw new Error('Failed to save tasks');
        }
    }
}
