export class TaskForm {
    constructor(onTaskAdd) {
        this.onTaskAdd = onTaskAdd;
        this.form = this.initializeForm();
        this.isSubmitting = false;
    }

    initializeForm() {
        this.taskInput = document.getElementById('taskInput');
        this.taskDescription = document.getElementById('taskDescription');
        this.dueDateInput = document.getElementById('dueDateInput');
        this.priorityInput = document.getElementById('priorityInput');
        this.tagsInput = document.getElementById('tagsInput');
        this.addButton = document.querySelector('.add-btn');
        
        // Set default date to tomorrow at 9:00 AM in local timezone
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        // Format the date for the input
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const hours = String(tomorrow.getHours()).padStart(2, '0');
        const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
        
        // Set the value in the format required by datetime-local
        this.dueDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        this.addButton.addEventListener('click', () => this.handleSubmit());
        return { 
            taskInput: this.taskInput, 
            taskDescription: this.taskDescription, 
            dueDateInput: this.dueDateInput,
            priorityInput: this.priorityInput,
            tagsInput: this.tagsInput
        };
    }

    parseTags(tagsString) {
        return tagsString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }

    async handleSubmit() {
        if (this.isSubmitting || !this.validateForm()) {
            return;
        }

        try {
            this.setSubmitting(true);
            
            let dueDate;
            if (this.dueDateInput.value) {
                dueDate = new Date(this.dueDateInput.value);
            } else {
                // Set default to tomorrow at 9:00 AM
                dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 1);
                dueDate.setHours(9, 0, 0, 0);
            }
            
            const taskData = {
                title: this.taskInput.value,
                description: this.taskDescription.value,
                dueDate: dueDate.toISOString(),
                priority: this.priorityInput.value,
                tags: this.parseTags(this.tagsInput.value)
            };

            await this.onTaskAdd(taskData);
            this.clearForm();
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setSubmitting(false);
        }
    }

    validateForm() {
        this.clearErrors();

        if (!this.taskInput.value.trim()) {
            this.showError('Please enter a task title');
            this.taskInput.classList.add('error');
            return false;
        }

        if (this.dueDateInput.value) {
            const selectedDate = new Date(this.dueDateInput.value);
            if (selectedDate < new Date()) {
                this.showError('Due date cannot be in the past');
                this.dueDateInput.classList.add('error');
                return false;
            }
        }

        return true;
    }

    setSubmitting(submitting) {
        this.isSubmitting = submitting;
        this.addButton.disabled = submitting;
        this.addButton.textContent = submitting ? 'Adding...' : 'Add Task';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = message;
        this.addButton.parentNode.insertBefore(errorDiv, this.addButton);
    }

    clearErrors() {
        const errors = document.querySelectorAll('.form-error');
        errors.forEach(error => error.remove());
        this.taskInput.classList.remove('error');
        this.dueDateInput.classList.remove('error');
    }

    clearForm() {
        this.taskInput.value = '';
        this.taskDescription.value = '';
        this.priorityInput.value = 'medium';
        this.tagsInput.value = '';
        this.clearErrors();
        
        // Set default date to tomorrow at 9:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        
        // Format the date for the input
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const hours = String(tomorrow.getHours()).padStart(2, '0');
        const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
        
        // Set the value in the format required by datetime-local
        this.dueDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
}

