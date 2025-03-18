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
                    <span class="time">25:00</span>
                    <span class="session-type">Work Time</span>
                    <div class="current-task">No task selected</div>
                </div>
                <div class="timer-controls">
                    <button class="start-btn" disabled>Start</button>
                    <button class="pause-btn" disabled>Pause</button>
                    <button class="reset-btn" disabled>Reset</button>
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
        if (this.isRunning) return;
        
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
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.updateButtons(false);
        clearInterval(this.timer);
    }

    reset() {
        this.pause();
        this.timeRemaining = this.workDuration;
        this.isBreak = false;
        this.currentSession = 0;
        this.clearTask();
        this.updateDisplay();
    }

    updateButtons(isRunning) {
        const startBtn = this.element.querySelector('.start-btn');
        const pauseBtn = this.element.querySelector('.pause-btn');
        
        startBtn.disabled = isRunning;
        pauseBtn.disabled = !isRunning;
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