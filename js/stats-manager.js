class StatsManager {
  constructor() {
    this.stats = [];
    this.appState = null;
    this.loadStats();
    this.flowColor = "#FF4BA5";
    this.energyColor = "#8B4B9F";
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
      this.createErrorModal(
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
      this.createErrorModal("Failed to record statistics.");
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
      this.createErrorModal("Failed to clear statistics.");
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
      this.createErrorModal("No stats recorded yet");
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
      this.createErrorModal("No valid stats to display");
      return;
    }

    // Create modal structure first
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";

    modal.innerHTML = `
      <div class="modal-content stats-visualization">
        <h2>Stats Timeline</h2>
        <div class="visualization-container"></div>
        <div class="stat-count">${validStats.length} valid data points</div>
        <div class="modal-actions">
          <button class="btn close-modal">Close</button>
          <button class="btn btn-danger clear-stats">Clear Stats</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Create SVG after modal is in DOM
    requestAnimationFrame(() => {
      const container = modal.querySelector('.visualization-container');
      const containerWidth = container.clientWidth;
      const width = Math.min(containerWidth - 40, 800);
      const height = Math.min(width * 0.6, 400);
      const padding = Math.max(20, width * 0.1);

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      svg.style.backgroundColor = "#fff";

      const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
      xAxis.setAttribute("x1", padding);
      xAxis.setAttribute("y1", height - padding);
      xAxis.setAttribute("x2", width - padding);
      xAxis.setAttribute("y2", height - padding);
      xAxis.setAttribute("stroke", "#000");
      xAxis.setAttribute("stroke-width", "2");

      const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
      yAxis.setAttribute("x1", padding);
      yAxis.setAttribute("y1", padding);
      yAxis.setAttribute("x2", padding);
      yAxis.setAttribute("y2", height - padding);
      yAxis.setAttribute("stroke", "#000");
      yAxis.setAttribute("stroke-width", "2");

      // Calculate time range for x-axis
      const timestamps = validStats.map((stat) => new Date(stat.timestamp));
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const timeRange = maxTime - minTime;

      const getTimeX = (timestamp) => {
        const timeOffset = new Date(timestamp) - minTime;
        return padding + (width - 2 * padding) * (timeOffset / timeRange);
      };

      const createPolyline = (values, color) => {
        const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        const points = validStats
          .map((stat, i) => {
            const x = getTimeX(stat.timestamp);
            const y = height - (padding + (height - 2 * padding) * values[i]);
            return `${x},${y}`;
          })
          .join(" ");

        polyline.setAttribute("points", points);
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke", color);
        polyline.setAttribute("stroke-width", "2");

        return polyline;
      };

      // Add energy line
      const energyLine = createPolyline(
        validStats.map((stat) => stat.energy),
        this.energyColor
      );
      svg.appendChild(energyLine);

      // Add flow line
      const flowLine = createPolyline(
        validStats.map((stat) => stat.flow),
        this.flowColor
      );
      svg.appendChild(flowLine);

      // Add data points
      validStats.forEach((stat) => {
        const x = getTimeX(stat.timestamp);
        
        // Energy point
        const energyPoint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        const energyY = height - (padding + (height - 2 * padding) * stat.energy);
        energyPoint.setAttribute("cx", x);
        energyPoint.setAttribute("cy", energyY);
        energyPoint.setAttribute("r", "3");
        energyPoint.setAttribute("fill", this.energyColor);
        svg.appendChild(energyPoint);

        // Flow point
        const flowPoint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        const flowY = height - (padding + (height - 2 * padding) * stat.flow);
        flowPoint.setAttribute("cx", x);
        flowPoint.setAttribute("cy", flowY);
        flowPoint.setAttribute("r", "3");
        flowPoint.setAttribute("fill", this.flowColor);
        svg.appendChild(flowPoint);
      });

      // Add legend
      const legend = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const legendItems = [
        { color: this.energyColor, label: "Energy" },
        { color: this.flowColor, label: "Flow" },
      ];

      legendItems.forEach((item, i) => {
        const y = padding + i * 20;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", width - padding - 60);
        line.setAttribute("y1", y);
        line.setAttribute("x2", width - padding - 40);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", item.color);
        line.setAttribute("stroke-width", "2");

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", width - padding - 35);
        text.setAttribute("y", y + 4);
        text.setAttribute("font-size", "12");
        text.textContent = item.label;

        legend.appendChild(line);
        legend.appendChild(text);
      });

      svg.appendChild(legend);
      svg.appendChild(xAxis);
      svg.appendChild(yAxis);
      container.appendChild(svg);

      // Event listeners
      modal.querySelector(".close-modal").addEventListener("click", () => {
        document.body.removeChild(modal);
      });

      modal.querySelector(".clear-stats").addEventListener("click", () => {
        this.showConfirmClearModal(modal);
      });
    });
  }

  createErrorModal(message) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content error-modal">
        <div class="error-message">${message}</div>
        <button class="btn close-modal">ok</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".close-modal").addEventListener("click", () => {
      document.body.removeChild(modal);
    });
  }

  showConfirmClearModal(statsModal) {
    const confirmModal = document.createElement("div");
    confirmModal.className = "modal";
    confirmModal.innerHTML = `
      <div class="modal-content confirm-modal">
        <div class="confirm-message">clear all stats?</div>
        <div class="modal-actions">
          <button class="btn close-modal">cancel</button>
          <button class="btn btn-danger confirm-clear">clear</button>
        </div>
      </div>
    `;

    document.body.appendChild(confirmModal);

    confirmModal.querySelector(".close-modal").addEventListener("click", () => {
      document.body.removeChild(confirmModal);
    });

    confirmModal.querySelector(".confirm-clear").addEventListener("click", () => {
      this.clearStats();
      document.body.removeChild(statsModal);
      document.body.removeChild(confirmModal);
    });
  }
}
