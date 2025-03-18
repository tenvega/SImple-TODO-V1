document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    setInterval(checkDueTasks, 60000); // Check for due dates every minute
    renderTasks();
});

// Task array to store all tasks
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Check for tasks due soon every minute
setInterval(checkDueTasks, 60000);

function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskDescription = document.getElementById('taskDescription');
    const dueDateInput = document.getElementById('dueDateInput');

    if (!taskInput.value.trim()) {
        alert('Please enter a task!');
        return;
    }

    const task = {
        id: Date.now(),
        title: taskInput.value,
        description: taskDescription.value,
        createdDate: new Date().toISOString(),
        dueDate: dueDateInput.value,
        completed: false,
        completedDate: null
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    
    // Clear inputs
    taskInput.value = '';
    taskDescription.value = '';
    dueDateInput.value = '';
}

function loadTasks() {
    let taskList = document.getElementById("taskList");
    let completedTaskList = document.getElementById("completedTaskList");
    taskList.innerHTML = "";
    completedTaskList.innerHTML = "";

    tasks.forEach(task => {
        const li = createTaskElement(task);
        if (task.completed) {
            completedTaskList.appendChild(li);
        } else {
            taskList.appendChild(li);
        }
    });
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    
    const taskInfo = document.createElement('div');
    taskInfo.className = 'task-info';
    
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;
    
    const description = document.createElement('div');
    description.className = 'task-description';
    description.textContent = task.description;
    
    const dates = document.createElement('div');
    dates.className = 'task-dates';
    dates.innerHTML = `
        Created: ${formatDate(task.createdDate)}<br>
        Due: ${formatDate(task.dueDate)}
        ${task.completed ? `<br>Completed: ${formatDate(task.completedDate)}` : ''}
    `;
    
    taskInfo.appendChild(title);
    taskInfo.appendChild(description);
    taskInfo.appendChild(dates);
    
    const actions = document.createElement('div');
    actions.className = 'task-actions';
    
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = task.completed ? 'Undo' : 'Complete';
    toggleBtn.onclick = () => toggleTask(task.id);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteTask(task.id);
    
    // In createTaskElement function, modify the edit button creation:
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-btn'; // Add a class for styling
    editBtn.addEventListener('click', function(e) {
         e.preventDefault();
         console.log('Edit button clicked for task:', task.id);
         editTask(task.id);
});
    // Append all buttons to actions div
    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);
    actions.appendChild(editBtn);
     // Append taskInfo and actions to li
    li.appendChild(taskInfo);
    li.appendChild(actions);
    // Return the li element
    return li;
} 

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedDate = task.completed ? new Date().toISOString() : null;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function editTask(id) {
    console.log('Edit task called with id:', id);
    
    const task = tasks.find(t => t.id === id);
    console.log('Found task:', task);
    
    if (!task) {
        console.log('No task found with id:', id);
        return;
    }

    // Find the task element (simplified approach)
       // Replace the taskElement finding code with this:
    const allTaskItems = document.querySelectorAll('.task-item');
    let taskElement = null;
    allTaskItems.forEach(item => {
        if (item.querySelector('.task-info').textContent.includes(task.title)) {
        taskElement = item;
        }
    });
     console.log('Found task element:', taskElement);

     if (!taskElement) {
        console.log('Task element not found');
        return;
    }

    const taskInfo = taskElement.querySelector('.task-info');

     if (!taskInfo) {
        console.log('Task info element not found');
        return;
    }

    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'edit-form';
    
    // Convert the date to the correct format for datetime-local input
    const dueDate = task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '';
    console.log('Formatted due date:', dueDate);

    editForm.innerHTML = `
        <input type="text" class="edit-title" value="${task.title}" />
        <textarea class="edit-description">${task.description || ''}</textarea>
        <input type="datetime-local" class="edit-date" value="${dueDate}" />
        <div class="edit-buttons">
            <button class="save-btn">Save</button>
            <button class="cancel-btn">Cancel</button>
        </div>
    `;

    // Replace task info with edit form
    taskInfo.style.display = 'none';
    taskElement.insertBefore(editForm, taskInfo);
    console.log('Edit form inserted');

    // Add event listeners for save and cancel
    const saveBtn = editForm.querySelector('.save-btn');
    const cancelBtn = editForm.querySelector('.cancel-btn');

    saveBtn.onclick = () => {
        console.log('Save button clicked');
        const newTitle = editForm.querySelector('.edit-title').value;
        const newDescription = editForm.querySelector('.edit-description').value;
        const newDueDate = editForm.querySelector('.edit-date').value;

        if (!newTitle.trim()) {
            alert('Title cannot be empty!');
            return;
        }

        // Update task
        task.title = newTitle;
        task.description = newDescription;
        task.dueDate = newDueDate ? new Date(newDueDate).toISOString() : null;

        saveTasks();
        renderTasks();
    };

    cancelBtn.onclick = () => {
        console.log('Cancel button clicked');
        renderTasks();
    };
}


function formatDate(dateString) {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function checkDueTasks() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    
    tasks.forEach(task => {
        if (!task.completed && task.dueDate) {
            const dueDate = new Date(task.dueDate);
            if (dueDate > now && dueDate <= tomorrow) {
                showNotification(`Task "${task.title}" is due within 24 hours!`);
            }
        }
    });
}

function showNotification(message) {
    const notifications = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    notifications.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function renderTasks() {
    const pendingList = document.getElementById('taskList');
    const completedList = document.getElementById('completedTaskList');
    
    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    tasks.forEach(task => {
        const li = createTaskElement(task);
        if (task.completed) {
            completedList.appendChild(li);
        } else {
            pendingList.appendChild(li);
        }
    });
}
