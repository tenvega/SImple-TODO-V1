export class TaskManager {
    constructor(storageService, notificationService) {
        this.storageService = storageService;
        this.notificationService = notificationService;
        this.tasks = [];
        this.subscribers = [];
        this.initialize();
    }

    async initialize() {
        try {
            const tasks = await this.storageService.getTasks();
            this.tasks = Array.isArray(tasks) ? tasks : [];
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

    async addTask(taskData) {
        try {
            // Ensure this.tasks is an array
            if (!Array.isArray(this.tasks)) {
                this.tasks = [];
            }
            
            const task = {
                id: Date.now().toString(),
                ...taskData,
                completed: false,
                createdAt: new Date().toISOString()
            };

            this.tasks.push(task);
            await this.storageService.saveTasks(this.tasks);
            this.notifySubscribers();
            return task;
        } catch (error) {
            console.error('Error adding task:', error);
            throw new Error('Failed to add task. Please try again.');
        }
    }

    async toggleTask(id) {
        try {
            const task = this.tasks.find(t => t.id === id);
            if (!task) {
                throw new Error('Task not found');
            }

            task.completed = !task.completed;
            task.completedDate = task.completed ? new Date().toISOString() : null;
            
            await this.storageService.saveTasks(this.tasks);
            this.notifySubscribers();
            return task;
        } catch (error) {
            console.error('Error toggling task:', error);
            throw new Error('Failed to update task status. Please try again.');
        }
    }

    async updateTask(id, updates) {
        try {
            const task = this.tasks.find(t => t.id === id);
            if (!task) {
                throw new Error('Task not found');
            }

            Object.assign(task, updates);
            await this.storageService.saveTasks(this.tasks);
            this.notifySubscribers();
            return task;
        } catch (error) {
            console.error('Error updating task:', error);
            throw new Error('Failed to update task. Please try again.');
        }
    }

    async deleteTask(id) {
        try {
            this.tasks = this.tasks.filter(t => t.id !== id);
            await this.storageService.saveTasks(this.tasks);
            this.notifySubscribers();
        } catch (error) {
            console.error('Error deleting task:', error);
            throw new Error('Failed to delete task. Please try again.');
        }
    }

    getTasks() {
        return this.tasks;
    }

    getTaskById(id) {
        return this.tasks.find(t => t.id === id);
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
}
