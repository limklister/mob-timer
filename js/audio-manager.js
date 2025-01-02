class AudioManager {
    constructor() {
        this.audioContext = null;
        this.initOnFirstInteraction = this.initOnFirstInteraction.bind(this);
        document.addEventListener('click', this.initOnFirstInteraction);
        document.addEventListener('keydown', this.initOnFirstInteraction);
    }

    initOnFirstInteraction() {
        if (!this.audioContext) {
            console.log('Initializing AudioContext on user interaction');
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext initialized, state:', this.audioContext.state);
            document.removeEventListener('click', this.initOnFirstInteraction);
            document.removeEventListener('keydown', this.initOnFirstInteraction);
        }
    }

    async resume() {
        try {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        } catch (error) {
            console.error('Failed to resume audio context:', error);
        }
    }

    async playGentleBeep() {
        try {
            if (!this.audioContext) return;
            await this.resume();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1);
        } catch (error) {
            console.error('Failed to play gentle beep:', error);
        }
    }

    async playBreakAlert() {
        try {
            if (!this.audioContext) return;
            await this.resume();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(520, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.7, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1.5);
        } catch (error) {
            console.error('Failed to play break alert:', error);
        }
    }
}