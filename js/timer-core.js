class TimerCore {
  constructor(statsManager, audioManager) {
    this.audioManager = audioManager;
    this.appState = null;
    // DOM Elements
    this.timerDisplay = document.getElementById("timer");
    this.startPauseBtn = document.getElementById("startPauseBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.rotationTimeInput = document.getElementById("rotationTime");
    this.breakFrequencyInput = document.getElementById("breakFrequency");
    this.breakLengthInput = document.getElementById("breakLength");
    this.breakModal = document.getElementById("breakModal");
    this.breakTimer = document.getElementById("breakTimer");
    this.skipBreakBtn = document.getElementById("skipBreakBtn");
    this.startBreakBtn = document.getElementById("startBreakBtn");
    this.switchModal = document.getElementById("switchModal");
    this.modalCurrentDriver = document.getElementById("modalCurrentDriver");
    this.modalNextDriver = document.getElementById("modalNextDriver");
    this.continueBtn = document.getElementById("continueBtn");

    // Timer State
    this.totalSeconds = 5 * 60;
    this.remainingSeconds = this.totalSeconds;
    this.timerInterval = null;
    this.isRunning = false;
    this.isBreak = false;
    this.breakSeconds = 5 * 60;
    this.breakRemaining = this.breakSeconds;

    // Settings
    this.rotationTime = 5;
    this.breakFrequency = 4;
    this.rotationCount = 0;
    this.teamManager = null;
    this.statsManager = statsManager;

    // Setup
    this.setupEventListeners();
    this.hideBreakModal();
    this.loadFromURL();
    this.hideSwitchModal();
  }

  setAppState(appState) {
    this.appState = appState;
  }

  setTeamManager(teamManager) {
    this.teamManager = teamManager;
  }

  hideBreakModal() {
    this.breakModal.style.display = "none";
  }

  showBreakModal() {
    this.breakModal.style.display = "flex";
  }

  async showBreakView() {
    const switchModalTitle = document.getElementById("switchModalTitle");
    const breakTimerContainer = document.getElementById("breakTimerContainer");
    const continueBtn = document.getElementById("continueBtn");
    const startBreakBtn = document.getElementById("startBreakBtn");
    const continueFromBreakBtn = document.getElementById(
      "continueFromBreakBtn"
    );

    switchModalTitle.textContent = "time for a break!";
    breakTimerContainer.style.display = "block";
    continueBtn.style.display = "none";
  }

  hideBreakView() {
    const switchModalTitle = document.getElementById("switchModalTitle");
    const breakTimerContainer = document.getElementById("breakTimerContainer");
    const continueBtn = document.getElementById("continueBtn");
    const continueFromBreakBtn = document.getElementById(
      "continueFromBreakBtn"
    );

    switchModalTitle.textContent = "Time's Up!";
    breakTimerContainer.style.display = "none";
    continueBtn.style.display = "block";
    continueFromBreakBtn.style.display = "none";
  }

  completeRotation() {
    this.hideBreakView();
    this.hideSwitchModal();
    if (this.teamManager) {
      this.teamManager.setNextDriver();
      this.remainingSeconds = this.totalSeconds;
      this.updateTimerDisplay();
      this.startTimer();
    }
  }

  setupEventListeners() {
    this.skipBreakBtn.addEventListener("click", () => this.skipBreak());
    this.startBreakBtn.addEventListener("click", () => this.startBreak());
    this.breakLengthInput.addEventListener("change", () =>
      this.updateBreakLength()
    );
    this.startPauseBtn.addEventListener("click", () => this.toggleTimer());
    this.resetBtn.addEventListener("click", () => this.resetTimer());
    this.rotationTimeInput.addEventListener("change", () =>
      this.updateRotationTime()
    );
    this.breakFrequencyInput.addEventListener("change", () =>
      this.updateBreakFrequency()
    );
    this.continueBtn.addEventListener("click", () => this.handleDriverSwitch());
  }

  async showSwitchModal(currentDriver, nextDriver) {
    this.modalCurrentDriver.textContent = currentDriver;
    this.modalNextDriver.textContent = nextDriver;
    this.switchModal.style.display = "flex";
    await this.audioManager.playGentleBeep();
  }

  hideSwitchModal() {
    this.switchModal.style.display = "none";
  }

  showStatsModal() {
    const statsModal = document.getElementById("statsModal");
    const clickArea = document.getElementById("clickArea");
    const clickMarker = document.getElementById("clickMarker");
    let coordinates = null;

    if (this.teamManager) {
      const currentDriverIndex = this.teamManager.getCurrentDriverIndex();
      const nextDriverIndex =
        (currentDriverIndex + 1) % this.teamManager.getTeamSize();
      const currentDriver =
        this.teamManager.getTeamMembers()[currentDriverIndex];
      const nextDriver = this.teamManager.getTeamMembers()[nextDriverIndex];
      this.showSwitchModal(currentDriver, nextDriver);
    }

    const handleClick = (e) => {
      console.log("Click event:", {
        clientX: e.clientX,
        clientY: e.clientY,
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        target: e.target,
        currentTarget: e.currentTarget,
      });

      const rect = clickArea.getBoundingClientRect();
      console.log("Click area rect:", {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });

      const x = e.offsetX / rect.width; // 0-1 value
      const y = 1 - e.offsetY / rect.height; // 0-1 value, inverted for energy

      console.log("Normalized coordinates:", { x, y });

      coordinates = { x, y };

      // Show marker at click position - use offsetX/Y which are relative to click area
      clickMarker.style.display = "block";
      clickMarker.style.position = "relative";
      clickMarker.style.left = `${e.offsetX}px`;
      clickMarker.style.top = `${e.offsetY}px`;

      // Record stats and proceed to driver switch after a short delay
      setTimeout(() => {
        this.statsManager.recordStat(y, x);

        // Cleanup
        clickArea.removeEventListener("click", handleClick);
        statsModal.style.display = "none";
        clickMarker.style.display = "none";

        // After recording stats
        if (this.shouldStartBreak) {
          this.showBreakView();
        } else {
          this.completeRotation();
        }
      }, 1000);
    };

    clickArea.addEventListener("click", handleClick);
    statsModal.style.display = "flex";
    clickMarker.style.display = "none"; // Reset marker
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

  skipBreak() {
    this.hideBreakModal();
    this.isBreak = false;
    this.breakRemaining = this.breakSeconds;
    this.updateBreakTimerDisplay();
    // Continue with the normal timer flow
    if (this.teamManager) {
      const currentDriverIndex = this.teamManager.getCurrentDriverIndex();
      const nextDriverIndex =
        (currentDriverIndex + 1) % this.teamManager.getTeamSize();
      const currentDriver =
        this.teamManager.getTeamMembers()[currentDriverIndex];
      const nextDriver = this.teamManager.getTeamMembers()[nextDriverIndex];
      this.showSwitchModal(currentDriver, nextDriver);
    }
  }

  startBreak() {
    this.isBreak = true;
    this.breakRemaining = this.breakSeconds;
    this.updateBreakTimerDisplay();

    const startBreakBtn = document.getElementById("startBreakBtn");
    const continueFromBreakBtn = document.getElementById(
      "continueFromBreakBtn"
    );
    startBreakBtn.style.display = "none";
    continueFromBreakBtn.style.display = "block";

    this.timerInterval = setInterval(() => this.updateBreakTimer(), 1000);

    // Add event listener for continue button
    continueFromBreakBtn.onclick = () => {
      clearInterval(this.timerInterval);
      this.completeRotation();
    };
  }

  updateBreakTimer() {
    if (this.breakRemaining > 0) {
      this.breakRemaining--;
      this.updateBreakTimerDisplay();
    } else {
      clearInterval(this.timerInterval);
      this.isBreak = false;
      this.breakRemaining = this.breakSeconds;
      this.audioManager.playBreakAlert();
    }
  }

  updateBreakTimerDisplay() {
    const minutes = Math.floor(this.breakRemaining / 60);
    const seconds = this.breakRemaining % 60;
    this.breakTimer.textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  updateBreakLength() {
    this.breakSeconds = parseInt(this.breakLengthInput.value) * 60;
    this.breakRemaining = this.breakSeconds;
    this.updateBreakTimerDisplay();
    this.updateURL();
  }

  loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const time = params.get("time");
    const breaks = params.get("breaks");
    const breakLength = params.get("breakLength");

    if (time) {
      this.rotationTimeInput.value = time;
      this.updateRotationTime();
    }

    if (breaks) {
      this.breakFrequencyInput.value = breaks;
      this.updateBreakFrequency();
    }

    if (breakLength) {
      this.breakLengthInput.value = breakLength;
      this.updateBreakLength();
    }
  }

  updateURL() {
    const params = new URLSearchParams(window.location.search);
    params.set("time", this.rotationTime);
    params.set("breaks", this.breakFrequency);
    params.set("breakLength", parseInt(this.breakLengthInput.value));
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newURL);
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
      alert("Please add team members first!");
      return;
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.startPauseBtn.textContent = "Pause";
      this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }
  }

  pauseTimer() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.startPauseBtn.textContent = "Start";
  }

  resetTimer() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.remainingSeconds = this.totalSeconds;
    this.updateTimerDisplay();
    this.startPauseBtn.textContent = "Start";

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
      this.pauseTimer();

      if (this.teamManager) {
        // Always show stats modal first
        this.shouldStartBreak = this.rotationCount % this.breakFrequency === 0;
        this.showStatsModal();
      }
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    this.timerDisplay.textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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
