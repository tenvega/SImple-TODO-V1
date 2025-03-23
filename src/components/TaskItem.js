import { formatDate, formatDateForInput } from '../utils/dateUtils.js';

export class TaskItem {
    constructor(task, onComplete, onDelete, onEdit) {
        this.task = task;
        this.onComplete = onComplete;
        this.onDelete = onDelete;
        this.onEdit = onEdit;
        this.element = this.createTaskElement();
    }

    createTaskElement() {
        const li = document.createElement('li');
        li.className = 'task-item adding';
        li.dataset.taskId = this.task.id || this.task._id;
        li.dataset.priority = this.task.priority || 'medium';
        
        // Remove the 'adding' class after animation completes
        li.addEventListener('animationend', () => {
            li.classList.remove('adding');
        });
        
        const taskInfo = this.createTaskInfo();
        const actions = this.createActionButtons();
        
        li.appendChild(taskInfo);
        li.appendChild(actions);
        
        return li;
    }

    createTaskInfo() {
        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        
        const header = document.createElement('div');
        header.className = 'task-header';
        
        const priorityBadge = document.createElement('span');
        priorityBadge.className = `priority-badge ${this.task.priority || 'medium'}`;
        priorityBadge.textContent = `${(this.task.priority || 'medium').charAt(0).toUpperCase() + (this.task.priority || 'medium').slice(1)} Priority`;
        header.appendChild(priorityBadge);
        
        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = this.task.title;
        header.appendChild(title);
        
        const description = document.createElement('div');
        description.className = 'task-description';
        description.textContent = this.task.description;

        // Create tags container
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';
        if (this.task.tags && this.task.tags.length > 0) {
            this.task.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
        }

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
            pomodoroIndicator.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M8 5V8L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                In Progress
            `;
            taskInfo.appendChild(pomodoroIndicator);
        }
        
        taskInfo.appendChild(header);
        taskInfo.appendChild(description);
        if (this.task.tags && this.task.tags.length > 0) {
            taskInfo.appendChild(tagsContainer);
        }
        taskInfo.appendChild(dates);
        
        return taskInfo;
    }

    createActionButtons() {
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        // Complete/Undo button
        const completeBtn = document.createElement('button');
        completeBtn.className = `icon-button complete-button ${this.task.completed ? 'completed' : ''}`;
        completeBtn.innerHTML = this.task.completed ? `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 8.5C2.5 6.5 3.5 3.5 8 3.5C12.5 3.5 13.5 6.5 13.5 8.5" 
                    stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M4.5 6.5L2.5 8.5L0.5 6.5" 
                    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ` : `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        completeBtn.title = this.task.completed ? "Mark as incomplete" : "Mark as complete";
        completeBtn.onclick = () => {
            const taskId = this.task.id || this.task._id;
            if (taskId) {
                this.onComplete(taskId, !this.task.completed);
            } else {
                console.error('Task ID is undefined:', this.task);
            }
        };

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'icon-button edit-button';
        editBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 2.5L13.5 4.5M11.5 2.5L3 11L2 14L5 13L13.5 4.5M11.5 2.5L13.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        editBtn.onclick = (e) => {
            e.preventDefault();
            this.showEditForm();
        };

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-button delete-button';
        deleteBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        deleteBtn.onclick = () => this.handleDelete();

        // Pomodoro button
        const pomodoroBtn = document.createElement('button');
        pomodoroBtn.className = 'icon-button pomodoro-button';
        pomodoroBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 5V8L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        pomodoroBtn.onclick = () => {
            document.dispatchEvent(new CustomEvent('startPomodoro', {
                detail: {
                    taskId: this.task.id || this.task._id,
                    taskTitle: this.task.title
                }
            }));
        };

        actions.appendChild(completeBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        actions.appendChild(pomodoroBtn);

        return actions;
    }

    showEditForm() {
        // First, close any other open edit forms
        document.querySelectorAll('.edit-form').forEach(form => form.remove());
        document.querySelectorAll('.task-info').forEach(info => info.style.display = '');

        const taskElement = document.querySelector(`.task-item[data-task-id="${this.task.id || this.task._id}"]`);
        if (!taskElement) return;

        const taskInfo = taskElement.querySelector('.task-info');
        if (!taskInfo) return;

        // Only create a new edit form if there isn't one already
        if (!taskElement.querySelector('.edit-form')) {
            const editForm = this.createEditForm();
            taskInfo.style.display = 'none';
            taskElement.insertBefore(editForm, taskInfo);
        }
    }

    saveEdit(editForm) {
        const newTitle = editForm.querySelector('.edit-title').value;
        const newDescription = editForm.querySelector('.edit-description').value;
        const newDueDate = editForm.querySelector('.edit-date').value;
        const newPriority = editForm.querySelector('.edit-priority').value;
        const newTags = editForm.querySelector('.edit-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        if (!newTitle.trim()) {
            alert('Title cannot be empty!');
            return;
        }

        const updates = {
            title: newTitle,
            description: newDescription,
            dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
            priority: newPriority,
            tags: newTags
        };

        const taskId = this.task.id || this.task._id;
        if (taskId) {
            this.onEdit(taskId, updates);
        } else {
            console.error('Task ID is undefined:', this.task);
        }
    }

    cancelEdit() {
        // Find the task element
        const taskElement = document.querySelector(`.task-item[data-task-id="${this.task.id || this.task._id}"]`);
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
        const taskId = this.task.id || this.task._id;
        
        editForm.innerHTML = `
            <input 
                type="text" 
                class="edit-title" 
                id="edit-title-${taskId}"
                name="title"
                value="${this.task.title}"
                autocomplete="off" 
            />
            <textarea 
                class="edit-description"
                id="edit-description-${taskId}"
                name="description"
            >${this.task.description || ''}</textarea>
            <div class="date-inputs">
                <input 
                    type="datetime-local" 
                    class="edit-date" 
                    id="edit-date-${taskId}"
                    name="dueDate"
                    value="${dueDate}" 
                />
                <span class="input-label">Due Date</span>
            </div>
            <div class="priority-select">
                <select 
                    class="edit-priority"
                    id="edit-priority-${taskId}"
                    name="priority"
                >
                    <option value="low" ${this.task.priority === 'low' ? 'selected' : ''}>Low Priority</option>
                    <option value="medium" ${this.task.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
                    <option value="high" ${this.task.priority === 'high' ? 'selected' : ''}>High Priority</option>
                </select>
                <span class="input-label">Priority</span>
            </div>
            <div class="tags-input-container">
                <input 
                    type="text" 
                    class="edit-tags" 
                    id="edit-tags-${taskId}"
                    name="tags"
                    value="${this.task.tags ? this.task.tags.join(', ') : ''}" 
                    placeholder="Add tags (comma separated)" 
                />
                <span class="input-label">Tags</span>
            </div>
            <div class="edit-buttons">
                <button class="icon-button save-button" title="Save changes">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 2C2 1.44772 2.44772 1 3 1H10.1716C10.4368 1 10.6911 1.10536 10.8787 1.29289L13.7071 4.12132C13.8946 4.30886 14 4.56321 14 4.82843V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V2Z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M5 1V4H10V1" stroke="currentColor" stroke-width="1.5"/>
                        <rect x="4" y="8" width="8" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="icon-button cancel-button" title="Cancel editing">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2.5 2.5L13.5 13.5M13.5 2.5L2.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;

        const saveBtn = editForm.querySelector('.save-button');
        const cancelBtn = editForm.querySelector('.cancel-button');

        saveBtn.onclick = () => this.saveEdit(editForm);
        cancelBtn.onclick = () => this.cancelEdit();

        return editForm;
    }

    async handleDelete() {
        const taskElement = document.querySelector(`.task-item[data-task-id="${this.task.id || this.task._id}"]`);
        if (!taskElement) return;

        // Add the removing class to start the fade out animation
        taskElement.classList.add('removing');

        // Wait for the animation to complete before actually deleting
        await new Promise(resolve => {
            taskElement.addEventListener('transitionend', resolve, { once: true });
        });

        // Call the actual delete handler
        const taskId = this.task.id || this.task._id;
        if (taskId) {
            this.onDelete(taskId);
        } else {
            console.error('Task ID is undefined:', this.task);
        }
    }
}
