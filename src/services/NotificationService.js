export class NotificationService {
    constructor() {
        this.notificationContainer = document.getElementById('notifications');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        this.notificationContainer.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    checkDueTasks(tasks) {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
        
        tasks.forEach(task => {
            if (!task.completed && task.dueDate) {
                const dueDate = new Date(task.dueDate);
                if (dueDate > now && dueDate <= tomorrow) {
                    this.showNotification(`Task "${task.title}" is due within 24 hours!`);
                }
            }
        });
    }

    startDueTasksCheck(tasks) {
        // Initial check
        this.checkDueTasks(tasks);
        // Check every minute
        return setInterval(() => this.checkDueTasks(tasks), 60000);
    }
}
