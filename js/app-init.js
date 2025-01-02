document.addEventListener('DOMContentLoaded', () => {
    // Initialize state and managers
    const appState = new AppState();
    const audioManager = new AudioManager();
    const statsManager = new StatsManager();
    const timerCore = new TimerCore(statsManager, audioManager);
    const teamManager = new TeamManager(timerCore);
    
    // Set up state management
    appState.init(timerCore, teamManager, statsManager, audioManager);
    timerCore.setTeamManager(teamManager);
    timerCore.setAppState(appState);
    teamManager.setAppState(appState);
    statsManager.setAppState(appState);
    
    // Hide modals on init
    document.getElementById('switchModal').style.display = 'none';
    document.getElementById('statsModal').style.display = 'none';

    // Setup stats button
    const showStatsBtn = document.getElementById('showStatsBtn');
    showStatsBtn.addEventListener('click', () => {
        statsManager.showStatsVisualization();
    });
});