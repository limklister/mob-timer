class AppState {
    constructor() {
        this.timer = null;
        this.team = null;
        this.stats = null;
        this.audio = null;
        this.subscribers = new Map();
    }

    init(timerCore, teamManager, statsManager, audioManager) {
        this.timer = timerCore;
        this.team = teamManager;
        this.stats = statsManager;
        this.audio = audioManager;
    }

    subscribe(component, callback) {
        if (!this.subscribers.has(component)) {
            this.subscribers.set(component, new Set());
        }
        this.subscribers.get(component).add(callback);
    }

    unsubscribe(component, callback) {
        if (this.subscribers.has(component)) {
            this.subscribers.get(component).delete(callback);
        }
    }

    notify(component, data) {
        if (this.subscribers.has(component)) {
            this.subscribers.get(component).forEach(callback => callback(data));
        }
    }
}