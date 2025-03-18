export class StorageService {
    getTasks() {
        try {
            return JSON.parse(localStorage.getItem('tasks')) || [];
        } catch (error) {
            console.error('Error reading from storage:', error);
            return [];
        }
    }

    async saveTasks(tasks) {
        try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            throw new Error('Failed to save tasks');
        }
    }
}
