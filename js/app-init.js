document.addEventListener('DOMContentLoaded', () => {
    const timerCore = new TimerCore();
    const teamManager = new TeamManager(timerCore);
    timerCore.setTeamManager(teamManager);
});