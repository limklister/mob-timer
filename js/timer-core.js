class TimerCore {
    constructor() {
        // DOM Elements
        this.timerDisplay = document.getElementById('timer');
        this.startPauseBtn = document.getElementById('startPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.rotationTimeInput = document.getElementById('rotationTime');
        this.breakFrequencyInput = document.getElementById('breakFrequency');
        this.switchModal = document.getElementById('switchModal');
        this.modalCurrentDriver = document.getElementById('modalCurrentDriver');
        this.modalNextDriver = document.getElementById('modalNextDriver');
        this.continueBtn = document.getElementById('continueBtn');

        // Timer State
        this.totalSeconds = 5 * 60;
        this.remainingSeconds = this.totalSeconds;
        this.timerInterval = null;
        this.isRunning = false;

        // Settings
        this.rotationTime = 5;
        this.breakFrequency = 4;
        this.rotationCount = 0;
        this.teamManager = null;

        // Setup
        this.setupEventListeners();
        this.loadFromURL();
    }

    setTeamManager(teamManager) {
        this.teamManager = teamManager;
    }

    setupEventListeners() {
        this.startPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.rotationTimeInput.addEventListener('change', () => this.updateRotationTime());
        this.breakFrequencyInput.addEventListener('change', () => this.updateBreakFrequency());
        this.continueBtn.addEventListener('click', () => this.handleDriverSwitch());
        
        // Play sound when timer hits 0
        this.timeUpSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodHQrGc3MWy0/NyMZjUvfdpMP5JjL7DxTRZuYDO61EwQZ2A2tdBKFGpgNrbQSxNvYDa20EsTc2A3ttBLE3RgOLfRTBN0YDi30UwT');
    }

    showSwitchModal(currentDriver, nextDriver) {
        this.modalCurrentDriver.textContent = currentDriver;
        this.modalNextDriver.textContent = nextDriver;
        this.switchModal.style.display = 'flex';
        this.timeUpSound.play().catch(e => console.log('Audio play failed:', e));
    }

    hideSwitchModal() {
        this.switchModal.style.display = 'none';
    }

    handleDriverSwitch() {
        this.hideSwitchModal();
        
        if (this.teamManager) {
            this.teamManager.setNextDriver();
        }
        
        this.remainingSeconds = this.totalSeconds;
        this.updateTimerDisplay();
        
        // Auto-start the timer for the next driver
        this.startTimer();
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const time = params.get('time');
        const breaks = params.get('breaks');

        if (time) {
            this.rotationTimeInput.value = time;
            this.updateRotationTime();
        }

        if (breaks) {
            this.breakFrequencyInput.value = breaks;
            this.updateBreakFrequency();
        }
    }

    updateURL() {
        const params = new URLSearchParams(window.location.search);
        params.set('time', this.rotationTime);
        params.set('breaks', this.breakFrequency);
        const newURL = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newURL);
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (!this.teamManager || this.teamManager.getTeamSize() === 0) {
            alert('Please add team members first!');
            return;
        }

        if (!this.isRunning) {
            this.isRunning = true;
            this.startPauseBtn.textContent = 'Pause';
            this.timerInterval = setInterval(() => this.updateTimer(), 1000);
        }
    }

    pauseTimer() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.startPauseBtn.textContent = 'Start';
    }

    resetTimer() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.remainingSeconds = this.totalSeconds;
        this.updateTimerDisplay();
        this.startPauseBtn.textContent = 'Start';
        
        if (this.teamManager) {
            this.teamManager.resetDriver();
        }
    }

    updateTimer() {
        if (this.remainingSeconds > 0) {
            this.remainingSeconds--;
            this.updateTimerDisplay();
        } else {
            this.rotationCount++;
            
            if (this.rotationCount % this.breakFrequency === 0) {
                alert('Break time!');
            }

            // Stop the timer and show the modal
            this.pauseTimer();
            
            if (this.teamManager) {
                const currentDriverIndex = this.teamManager.getCurrentDriverIndex();
                const nextDriverIndex = (currentDriverIndex + 1) % this.teamManager.getTeamSize();
                const currentDriver = this.teamManager.getTeamMembers()[currentDriverIndex];
                const nextDriver = this.teamManager.getTeamMembers()[nextDriverIndex];
                
                this.showSwitchModal(currentDriver, nextDriver);
            }
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        this.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateRotationTime() {
        this.rotationTime = parseInt(this.rotationTimeInput.value);
        this.totalSeconds = this.rotationTime * 60;
        this.remainingSeconds = this.totalSeconds;
        this.updateTimerDisplay();
        this.updateURL();
    }

    updateBreakFrequency() {
        this.breakFrequency = parseInt(this.breakFrequencyInput.value);
        this.updateURL();
    }
}