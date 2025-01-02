class StatsManager {
    constructor() {
        this.stats = [];
        this.appState = null;
        this.loadStats();
    }

    setAppState(appState) {
        this.appState = appState;
    }

    loadStats() {
        try {
            const savedStats = localStorage.getItem('mobStats');
            if (savedStats) {
                const parsed = JSON.parse(savedStats);
                // Validate each stat
                this.stats = parsed.filter(stat => 
                    typeof stat.energy === 'number' && 
                    typeof stat.flow === 'number' &&
                    !isNaN(stat.energy) && 
                    !isNaN(stat.flow)
                );
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            this.stats = [];
        }
    }

    saveStats() {
        try {
            localStorage.setItem('mobStats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Error saving stats:', error);
            this.createErrorModal('Failed to save stats. Local storage might be full or disabled.');
        }
    }

    recordStat(energy, flow) {
        try {
            // Validate inputs
            if (typeof energy !== 'number' || typeof flow !== 'number' || 
                isNaN(energy) || isNaN(flow)) {
                throw new Error('Invalid energy or flow values');
            }
            
            const stat = { 
                energy, 
                flow,
                timestamp: new Date().toISOString() 
            };
            this.stats.push(stat);
            console.log('Recording stat:', stat);  // Debug log
            this.saveStats();
            if (this.appState) {
                this.appState.notify('stats', { type: 'new', stat });
            }
        } catch (error) {
            console.error('Error recording stat:', error);
            this.createErrorModal('Failed to record statistics.');
        }
    }

    clearStats() {
        try {
            this.stats = [];
            this.saveStats();
            if (this.appState) {
                this.appState.notify('stats', { type: 'clear' });
            }
        } catch (error) {
            console.error('Error clearing stats:', error);
            this.createErrorModal('Failed to clear statistics.');
        }
    }

    getAverageStats() {
        if (!this.stats.length) return null;
        
        try {
            return {
                energy: this.stats.reduce((sum, s) => sum + s.energy, 0) / this.stats.length,
                flow: this.stats.reduce((sum, s) => sum + s.flow, 0) / this.stats.length
            };
        } catch (error) {
            console.error('Error calculating average stats:', error);
            return null;
        }
    }

    showStatsVisualization() {
        if (this.stats.length === 0) {
            this.createErrorModal('No stats recorded yet');
            return;
        }

        console.log('Current stats:', this.stats);  // Debug log

        // Validate stats before visualization
        const validStats = this.stats.filter(stat => 
            typeof stat.energy === 'number' && 
            typeof stat.flow === 'number' &&
            !isNaN(stat.energy) && 
            !isNaN(stat.flow)
        );

        if (validStats.length === 0) {
            this.createErrorModal('No valid stats to display');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        const width = 600;
        const height = 400;
        const padding = 40;

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.style.backgroundColor = '#fff';

        // Add axes
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', padding);
        xAxis.setAttribute('y1', height - padding);
        xAxis.setAttribute('x2', width - padding);
        xAxis.setAttribute('y2', height - padding);
        xAxis.setAttribute('stroke', '#000');
        xAxis.setAttribute('stroke-width', '2');

        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', padding);
        yAxis.setAttribute('y1', padding);
        yAxis.setAttribute('x2', padding);
        yAxis.setAttribute('y2', height - padding);
        yAxis.setAttribute('stroke', '#000');
        yAxis.setAttribute('stroke-width', '2');

        // Add axis labels
        const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xLabel.setAttribute('x', width / 2);
        xLabel.setAttribute('y', height - 10);
        xLabel.setAttribute('text-anchor', 'middle');
        xLabel.textContent = 'Time';

        const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yLabel.setAttribute('x', 20);
        yLabel.setAttribute('y', height / 2);
        yLabel.setAttribute('text-anchor', 'middle');
        yLabel.setAttribute('transform', `rotate(-90, 20, ${height / 2})`);
        yLabel.textContent = 'Energy';

        // Calculate time range for x-axis
        const timestamps = validStats.map(stat => new Date(stat.timestamp));
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const timeRange = maxTime - minTime;

        // Helper function to get x coordinate from timestamp
        const getTimeX = (timestamp) => {
            const timeOffset = new Date(timestamp) - minTime;
            return padding + (width - 2 * padding) * (timeOffset / timeRange);
        };

        // Create polylines for flow and energy
        const createPolyline = (values, color) => {
            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            const points = validStats.map((stat, i) => {
                const x = getTimeX(stat.timestamp);
                const y = height - (padding + (height - 2 * padding) * values[i]);
                return `${x},${y}`;
            }).join(' ');
            
            polyline.setAttribute('points', points);
            polyline.setAttribute('fill', 'none');
            polyline.setAttribute('stroke', color);
            polyline.setAttribute('stroke-width', '2');
            
            return polyline;
        };

        // Add energy line
        const energyLine = createPolyline(
            validStats.map(stat => stat.energy),
            '#4444FF'
        );
        svg.appendChild(energyLine);

        // Add flow line
        const flowLine = createPolyline(
            validStats.map(stat => stat.flow),
            '#44FF44'
        );
        svg.appendChild(flowLine);

        // Add dots for each data point
        validStats.forEach((stat) => {
            try {
                // Energy point
                const energyPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                const energyX = getTimeX(stat.timestamp);
                const energyY = height - (padding + (height - 2 * padding) * stat.energy);
                
                energyPoint.setAttribute('cx', energyX);
                energyPoint.setAttribute('cy', energyY);
                energyPoint.setAttribute('r', '3');
                energyPoint.setAttribute('fill', '#4444FF');
                
                svg.appendChild(energyPoint);

                // Flow point
                const flowPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                const flowY = height - (padding + (height - 2 * padding) * stat.flow);
                
                flowPoint.setAttribute('cx', energyX);
                flowPoint.setAttribute('cy', flowY);
                flowPoint.setAttribute('r', '3');
                flowPoint.setAttribute('fill', '#44FF44');
                
                svg.appendChild(flowPoint);
            } catch (error) {
                console.error('Error plotting point:', error, stat);
            }
        });

        // Add legend
        const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const legendItems = [
            { color: '#4444FF', label: 'Energy' },
            { color: '#44FF44', label: 'Flow' }
        ];

        legendItems.forEach((item, i) => {
            const y = padding + i * 20;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', width - padding - 60);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - padding - 40);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', item.color);
            line.setAttribute('stroke-width', '2');
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', width - padding - 35);
            text.setAttribute('y', y + 4);
            text.setAttribute('font-size', '12');
            text.textContent = item.label;
            
            legend.appendChild(line);
            legend.appendChild(text);
        });
        
        svg.appendChild(legend);

        svg.appendChild(xAxis);
        svg.appendChild(yAxis);
        svg.appendChild(xLabel);
        svg.appendChild(yLabel);

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

        const style = document.createElement('style');
        style.textContent = `
            .stats-visualization {
                padding: 2rem;
            }
            .visualization-container {
                background: #fff;
                border-radius: 8px;
                padding: 1rem;
                margin: 1rem 0;
            }
            .stat-count {
                text-align: center;
                color: #666;
                margin: 1rem 0;
            }
            .modal {
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(modal);
        modal.querySelector('.visualization-container').appendChild(svg);

        // Event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });

        modal.querySelector('.clear-stats').addEventListener('click', () => {
            this.showConfirmClearModal(modal, style);
        });
    }

    createErrorModal(message) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content error-modal">
                <div class="error-message">${message}</div>
                <button class="btn close-modal">ok</button>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .error-modal {
                padding: 2rem;
                text-align: center;
            }
            .error-message {
                margin-bottom: 1.5rem;
                color: #666;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });
    }

    showConfirmClearModal(statsModal, statsStyle) {
        const confirmModal = document.createElement('div');
        confirmModal.className = 'modal';
        confirmModal.innerHTML = `
            <div class="modal-content confirm-modal">
                <div class="confirm-message">clear all stats?</div>
                <div class="modal-actions">
                    <button class="btn close-modal">cancel</button>
                    <button class="btn btn-danger confirm-clear">clear</button>
                </div>
            </div>
        `;

        const confirmStyle = document.createElement('style');
        confirmStyle.textContent = `
            .confirm-modal {
                padding: 2rem;
                text-align: center;
            }
            .confirm-message {
                margin-bottom: 1.5rem;
                color: #666;
            }
        `;
        document.head.appendChild(confirmStyle);
        document.body.appendChild(confirmModal);

        confirmModal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(confirmModal);
            document.head.removeChild(confirmStyle);
        });

        confirmModal.querySelector('.confirm-clear').addEventListener('click', () => {
            this.clearStats();
            document.body.removeChild(statsModal);
            document.head.removeChild(statsStyle);
            document.body.removeChild(confirmModal);
            document.head.removeChild(confirmStyle);
        });
    }
}