class StatsManager {
  constructor() {
    this.stats = [];
    this.appState = null;
    this.loadStats();
    
    // Get modal elements
    this.statsModal = document.getElementById('statsVisualizationModal');
    this.errorModal = document.getElementById('errorModal');
    this.confirmModal = document.getElementById('confirmClearModal');
    
    // Bind event listeners
    this.bindModalListeners();
  }

  bindModalListeners() {
    // Stats visualization modal
    this.statsModal.querySelector('.close-modal').addEventListener('click', () => {
      this.hideModal(this.statsModal);
    });
    this.statsModal.querySelector('.clear-stats').addEventListener('click', () => {
      this.showConfirmClearModal();
    });

    // Error modal
    this.errorModal.querySelector('.close-modal').addEventListener('click', () => {
      this.hideModal(this.errorModal);
    });

    // Confirm clear modal
    this.confirmModal.querySelector('.close-modal').addEventListener('click', () => {
      this.hideModal(this.confirmModal);
    });
    this.confirmModal.querySelector('.confirm-clear').addEventListener('click', () => {
      this.clearStats();
      this.hideModal(this.confirmModal);
      this.hideModal(this.statsModal);
    });
  }

  setAppState(appState) {
    this.appState = appState;
  }

  loadStats() {
    try {
      const savedStats = localStorage.getItem("mobStats");
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        this.stats = parsed.filter(
          (stat) =>
            typeof stat.energy === "number" &&
            typeof stat.flow === "number" &&
            !isNaN(stat.energy) &&
            !isNaN(stat.flow)
        );
      }
    } catch (error) {
      console.error("Error loading stats:", error);
      this.stats = [];
    }
  }

  saveStats() {
    try {
      localStorage.setItem("mobStats", JSON.stringify(this.stats));
    } catch (error) {
      console.error("Error saving stats:", error);
      this.showErrorModal(
        "Failed to save stats. Local storage might be full or disabled."
      );
    }
  }

  recordStat(energy, flow) {
    try {
      if (
        typeof energy !== "number" ||
        typeof flow !== "number" ||
        isNaN(energy) ||
        isNaN(flow)
      ) {
        throw new Error("Invalid energy or flow values");
      }

      const stat = {
        energy,
        flow,
        timestamp: new Date().toISOString(),
      };
      this.stats.push(stat);
      this.saveStats();
      if (this.appState) {
        this.appState.notify("stats", { type: "new", stat });
      }
    } catch (error) {
      console.error("Error recording stat:", error);
      this.showErrorModal("Failed to record statistics.");
    }
  }

  clearStats() {
    try {
      this.stats = [];
      this.saveStats();
      if (this.appState) {
        this.appState.notify("stats", { type: "clear" });
      }
    } catch (error) {
      console.error("Error clearing stats:", error);
      this.showErrorModal("Failed to clear statistics.");
    }
  }

  getAverageStats() {
    if (!this.stats.length) return null;

    try {
      return {
        energy:
          this.stats.reduce((sum, s) => sum + s.energy, 0) / this.stats.length,
        flow:
          this.stats.reduce((sum, s) => sum + s.flow, 0) / this.stats.length,
      };
    } catch (error) {
      console.error("Error calculating average stats:", error);
      return null;
    }
  }

  showStatsVisualization() {
    if (this.stats.length === 0) {
      this.showErrorModal("No stats recorded yet");
      return;
    }

    const validStats = this.stats.filter(
      (stat) =>
        typeof stat.energy === "number" &&
        typeof stat.flow === "number" &&
        !isNaN(stat.energy) &&
        !isNaN(stat.flow)
    );

    if (validStats.length === 0) {
      this.showErrorModal("No valid stats to display");
      return;
    }

    // Update stat count
    document.getElementById('statCount').textContent = `${validStats.length} valid data points`;

    // Create chart
    requestAnimationFrame(() => {
      const container = this.statsModal.querySelector('.visualization-container');
      container.innerHTML = ''; // Clear previous chart
      const chart = new StatsChart();
      chart.create(container, validStats);
    });

    this.showModal(this.statsModal);
  }

  showErrorModal(message) {
    document.getElementById('errorMessage').textContent = message;
    this.showModal(this.errorModal);
  }

  showModal(modal) {
    modal.style.display = 'flex';
  }

  hideModal(modal) {
    modal.style.display = 'none';
  }

  showConfirmClearModal() {
    this.showModal(this.confirmModal);
  }
}