import { formatDate, formatDateForInput } from '../utils/dateUtils.js';

export class TaskItem {
    constructor(task, onToggle, onDelete, onEdit) {
        this.task = task;
        this.onToggle = onToggle;
        this.onDelete = onDelete;
        this.onEdit = onEdit;
    }

    createTaskElement() {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.taskId = this.task.id; // Add data attribute for easier selection
        
        const taskInfo = this.createTaskInfo();
        const actions = this.createActionButtons();
        
        li.appendChild(taskInfo);
        li.appendChild(actions);
        
        return li;
    }

    createTaskInfo() {
        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        
        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = this.task.title;
        
        const description = document.createElement('div');
        description.className = 'task-description';
        description.textContent = this.task.description;
        
        const dates = document.createElement('div');
        dates.className = 'task-dates';
        dates.innerHTML = `
            Created: ${formatDate(this.task.createdDate)}<br>
            Due: ${formatDate(this.task.dueDate)}
            ${this.task.completed ? `<br>Completed: ${formatDate(this.task.completedDate)}` : ''}
        `;

        if (this.task.isInPomodoro) {
            const pomodoroIndicator = document.createElement('div');
            pomodoroIndicator.className = 'pomodoro-indicator';
            pomodoroIndicator.innerHTML = '🍅 In Progress';
            taskInfo.appendChild(pomodoroIndicator);
        }
        
        taskInfo.appendChild(title);
        taskInfo.appendChild(description);
        taskInfo.appendChild(dates);
        
        return taskInfo;
    }

    createActionButtons() {
        const actions = document.createElement('div');
        actions.className = 'task-actions';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = this.task.completed ? 'Undo' : 'Complete';
        toggleBtn.onclick = () => this.onToggle(this.task.id);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => this.onDelete(this.task.id);
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'edit-btn';
        editBtn.onclick = (e) => {
            e.preventDefault();
            this.showEditForm();
        };

        const pomodoroBtn = document.createElement('button');
        pomodoroBtn.textContent = '🍅';
        pomodoroBtn.className = 'pomodoro-btn';
        pomodoroBtn.title = 'Start Pomodoro for this task';
        pomodoroBtn.onclick = () => {
            // Dispatch a custom event to start Pomodoro for this task
            document.dispatchEvent(new CustomEvent('startPomodoro', {
                detail: {
                    taskId: this.task.id,
                    taskTitle: this.task.title
                }
            }));
        };
        
        actions.appendChild(toggleBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        actions.appendChild(pomodoroBtn);
        
        return actions;
    }

    // New method to show edit form
    showEditForm() {
        // First, close any other open edit forms
        document.querySelectorAll('.edit-form').forEach(form => form.remove());
        document.querySelectorAll('.task-info').forEach(info => info.style.display = '');

        const taskElement = document.querySelector(`.task-item[data-task-id="${this.task.id}"]`);
        if (!taskElement) return;

        const taskInfo = taskElement.querySelector('.task-info');
        if (!taskInfo) return;

        // Only create a new edit form if there isn't one already
        if (taskElement.querySelector('.edit-form')) return;

        const editForm = this.createEditForm();
        taskInfo.style.display = 'none';
        taskElement.insertBefore(editForm, taskInfo);

        const saveBtn = editForm.querySelector('.save-btn');
        const cancelBtn = editForm.querySelector('.cancel-btn');

        saveBtn.onclick = () => this.saveEdit(editForm);
        cancelBtn.onclick = () => this.cancelEdit();
    }

    saveEdit(editForm) {
        const newTitle = editForm.querySelector('.edit-title').value;
        const newDescription = editForm.querySelector('.edit-description').value;
        const newDueDate = editForm.querySelector('.edit-date').value;

        if (!newTitle.trim()) {
            alert('Title cannot be empty!');
            return;
        }

        const updates = {
            title: newTitle,
            description: newDescription,
            dueDate: newDueDate ? new Date(newDueDate).toISOString() : null
        };

        this.onEdit(this.task.id, updates);
    }

    cancelEdit() {
        // Find the task element
        const taskElement = document.querySelector(`.task-item[data-task-id="${this.task.id}"]`);
        if (!taskElement) return;

        // Find all edit forms in this task and remove them
        const editForms = taskElement.querySelectorAll('.edit-form');
        editForms.forEach(form => form.remove());

        // Show the task info again
        const taskInfo = taskElement.querySelector('.task-info');
        if (taskInfo) {
            taskInfo.style.display = '';
        }

        // Refresh the list view
        document.dispatchEvent(new CustomEvent('refreshTaskList'));
    }

    createEditForm() {
        const editForm = document.createElement('div');
        editForm.className = 'edit-form';
        
        const dueDate = formatDateForInput(this.task.dueDate);
        
        editForm.innerHTML = `
            <input type="text" class="edit-title" value="${this.task.title}" />
            <textarea class="edit-description">${this.task.description || ''}</textarea>
            <input type="datetime-local" class="edit-date" value="${dueDate}" />
            <div class="edit-buttons">
                <button class="save-btn">Save</button>
                <button class="cancel-btn">Cancel</button>
            </div>
        `;
        
        return editForm;
    }
}
