export class PomodoroTimer {
    constructor(onTimerComplete, onTaskUpdate) {
        this.workDuration = 25 * 60; // 25 minutes in seconds
        this.shortBreakDuration = 5 * 60; // 5 minutes
        this.longBreakDuration = 15 * 60; // 15 minutes
        this.sessionsBeforeLongBreak = 4;
        this.currentSession = 0;
        this.timeRemaining = this.workDuration;
        this.isRunning = false;
        this.isBreak = false;
        this.timer = null;
        this.onTimerComplete = onTimerComplete;
        this.onTaskUpdate = onTaskUpdate;
        this.currentTask = null;
        
        this.element = this.createTimerElement();
        this.initializeEventListeners();
    }

    createTimerElement() {
        const container = document.createElement('div');
        container.className = 'pomodoro-container';
        
        container.innerHTML = `
            <div class="pomodoro-timer">
                <div class="timer-display">
                    <div class="time-ring">
                        <span class="time">${this.formatTime(this.timeRemaining)}</span>
                    </div>
                    <span class="session-type">${this.isBreak ? 'Break Time' : 'Focus Time'}</span>
                    <div class="current-task">No task selected</div>
                </div>
                <div class="timer-controls">
                    <button class="start-btn" disabled>
                        <svg width="15" height="15" viewBox="0 0 15 15">
                            <path d="M3.24182 2.32181C3.3919 2.23132 3.5784 2.22601 3.73338 2.30781L12.7334 7.05781C12.8974 7.14436 13 7.31457 13 7.5C13 7.68543 12.8974 7.85564 12.7334 7.94219L3.73338 12.6922C3.5784 12.774 3.3919 12.7687 3.24182 12.6782C3.09175 12.5877 3 12.4187 3 12.25V2.75C3 2.58128 3.09175 2.41229 3.24182 2.32181Z" />
                        </svg>
                        Start
                    </button>
                    <button class="pause-btn" disabled>
                        <svg width="15" height="15" viewBox="0 0 15 15">
                            <path d="M6.5 3.5C6.5 3.22386 6.27614 3 6 3H5C4.72386 3 4.5 3.22386 4.5 3.5V11.5C4.5 11.7761 4.72386 12 5 12H6C6.27614 12 6.5 11.7761 6.5 11.5V3.5ZM10.5 3.5C10.5 3.22386 10.2761 3 10 3H9C8.72386 3 8.5 3.22386 8.5 3.5V11.5C8.5 11.7761 8.72386 12 9 12H10C10.2761 12 10.5 11.7761 10.5 11.5V3.5Z" />
                        </svg>
                        Pause
                    </button>
                    <button class="reset-btn" disabled>
                        <svg width="15" height="15" viewBox="0 0 15 15">
                            <path d="M7.5 1C10.5376 1 13 3.46243 13 6.5C13 9.53757 10.5376 12 7.5 12C4.46243 12 2 9.53757 2 6.5C2 5.96957 2.49149 5.5 3 5.5C3.50851 5.5 4 5.96957 4 6.5C4 8.433 5.567 10 7.5 10C9.433 10 11 8.433 11 6.5C11 4.567 9.433 3 7.5 3C6.27467 3 5.20539 3.63963 4.57117 4.57117L5.5 5.5H3C2.44772 5.5 2 5.05228 2 4.5V2L2.92883 2.92883C3.79637 2.06129 4.98761 1.5 7.5 1Z" />
                        </svg>
                        Reset
                    </button>
                </div>
                <div class="session-info">
                    Session ${this.currentSession + 1}/4
                </div>
            </div>
        `;
        
        return container;
    }

    initializeEventListeners() {
        const startBtn = this.element.querySelector('.start-btn');
        const pauseBtn = this.element.querySelector('.pause-btn');
        const resetBtn = this.element.querySelector('.reset-btn');

        startBtn.addEventListener('click', () => this.start());
        pauseBtn.addEventListener('click', () => this.pause());
        resetBtn.addEventListener('click', () => this.reset());
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    updateDisplay() {
        const timeDisplay = this.element.querySelector('.time');
        const sessionType = this.element.querySelector('.session-type');
        const sessionInfo = this.element.querySelector('.session-info');
        
        timeDisplay.textContent = this.formatTime(this.timeRemaining);
        sessionType.textContent = this.isBreak ? 
            (this.timeRemaining === this.longBreakDuration ? 'Long Break' : 'Short Break') 
            : 'Work Time';
        sessionInfo.textContent = `Session ${this.currentSession + 1}/4`;
    }

    start() {
        if (this.isRunning || !this.currentTask) return; // Don't start if no task selected
        
        this.isRunning = true;
        this.updateButtons(true);
        
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();

            if (this.timeRemaining <= 0) {
                this.completeSession();
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning && this.currentTask) {  // Only allow resume if there's a task
            // Resume the timer
            this.start();
            return;
        }
        
        this.isRunning = false;
        this.updateButtons(false);
        clearInterval(this.timer);
    }

    reset() {
        clearInterval(this.timer);  // Clear interval directly instead of using pause()
        this.isRunning = false;
        this.timeRemaining = this.workDuration;
        this.isBreak = false;
        this.currentSession = 0;
        this.clearTask();
        this.updateButtons(false);  // Update buttons before clearing task
        this.updateDisplay();
    }

    updateButtons(isRunning) {
        const startBtn = this.element.querySelector('.start-btn');
        const pauseBtn = this.element.querySelector('.pause-btn');
        const resetBtn = this.element.querySelector('.reset-btn');
        
        // Update button states
        startBtn.disabled = isRunning || !this.currentTask;  // Disabled when running or no task
        pauseBtn.disabled = !isRunning;  // Only enabled when timer is running
        resetBtn.disabled = !this.currentTask;  // Enabled when there's a task

        // Update pause button icon and text
        pauseBtn.innerHTML = isRunning ? `
            <svg width="15" height="15" viewBox="0 0 15 15">
                <path d="M6.5 3.5C6.5 3.22386 6.27614 3 6 3H5C4.72386 3 4.5 3.22386 4.5 3.5V11.5C4.5 11.7761 4.72386 12 5 12H6C6.27614 12 6.5 11.7761 6.5 11.5V3.5ZM10.5 3.5C10.5 3.22386 10.2761 3 10 3H9C8.72386 3 8.5 3.22386 8.5 3.5V11.5C8.5 11.7761 8.72386 12 9 12H10C10.2761 12 10.5 11.7761 10.5 11.5V3.5Z" />
            </svg>
            Pause
        ` : `
            <svg width="15" height="15" viewBox="0 0 15 15">
                <path d="M3.24182 2.32181C3.3919 2.23132 3.5784 2.22601 3.73338 2.30781L12.7334 7.05781C12.8974 7.14436 13 7.31457 13 7.5C13 7.68543 12.8974 7.85564 12.7334 7.94219L3.73338 12.6922C3.5784 12.774 3.3919 12.7687 3.24182 12.6782C3.09175 12.5877 3 12.4187 3 12.25V2.75C3 2.58128 3.09175 2.41229 3.24182 2.32181Z" />
            </svg>
            Resume
        `;
    }

    setTask(taskId, taskTitle) {
        this.currentTask = { id: taskId, title: taskTitle };
        const currentTaskElement = this.element.querySelector('.current-task');
        currentTaskElement.textContent = `Working on: ${taskTitle}`;
        
        // Enable controls when a task is selected
        this.element.querySelector('.start-btn').disabled = false;
        this.element.querySelector('.reset-btn').disabled = false;
        
        // Update task status
        if (this.onTaskUpdate) {
            this.onTaskUpdate(taskId, true);
        }
    }

    clearTask() {
        if (this.currentTask && this.onTaskUpdate) {
            this.onTaskUpdate(this.currentTask.id, false);
        }
        this.currentTask = null;
        const currentTaskElement = this.element.querySelector('.current-task');
        currentTaskElement.textContent = 'No task selected';
        
        // Disable controls when no task is selected
        if (!this.isRunning) {
            this.element.querySelector('.start-btn').disabled = true;
            this.element.querySelector('.reset-btn').disabled = true;
        }
    }

    completeSession() {
        clearInterval(this.timer);
        this.isRunning = false;
        
        if (!this.isBreak) {
            this.currentSession++;
            this.isBreak = true;
            
            // Determine break type
            if (this.currentSession % this.sessionsBeforeLongBreak === 0) {
                this.timeRemaining = this.longBreakDuration;
                this.notifyCompletion('Long break time! Take 15 minutes off.');
            } else {
                this.timeRemaining = this.shortBreakDuration;
                this.notifyCompletion('Short break time! Take 5 minutes off.');
            }

            // Clear task during break
            this.clearTask();
        } else {
            this.isBreak = false;
            this.timeRemaining = this.workDuration;
            
            if (this.currentSession >= this.sessionsBeforeLongBreak) {
                this.currentSession = 0;
            }
            
            this.notifyCompletion('Break complete! Time to work.');
        }
        
        this.updateButtons(false);
        this.updateDisplay();
    }

    notifyCompletion(message) {
        if (this.onTimerComplete) {
            this.onTimerComplete(message);
        }
        
        // Request notification permission if not granted
        if (Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', { body: message });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Pomodoro Timer', { body: message });
                }
            });
        }
    }
} 