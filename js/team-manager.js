class TeamManager {
    constructor(timerCore) {
        this.appState = null;
        // DOM Elements
        this.teamList = document.getElementById('teamList');
        this.memberInput = document.getElementById('memberInput');
        this.addMemberBtn = document.getElementById('addMemberBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.currentDriverDisplay = document.getElementById('currentDriverDisplay');
        this.nextDriverDisplay = document.getElementById('nextDriverDisplay');

        // Core State
        this.teamMembers = [];
        this.currentDriverIndex = -1;
        this.draggedItem = null;

        // Setup
        this.setupEventListeners();
        this.loadFromURL();
    }

    setAppState(appState) {
        this.appState = appState;
    }

    setupEventListeners() {
        this.addMemberBtn.addEventListener('click', () => this.addMember());
        this.memberInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addMember();
        });
        this.shuffleBtn.addEventListener('click', () => this.shuffleTeamOrder());

        // Drag and Drop
        this.teamList.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.teamList.addEventListener('dragover', this.handleDragOver.bind(this));
        this.teamList.addEventListener('drop', this.handleDrop.bind(this));
        this.teamList.addEventListener('dragend', this.handleDragEnd.bind(this));
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const members = params.get('members');
        const currentDriver = params.get('driver');
        
        if (members) {
            const memberList = members.split(',');
            memberList.forEach(member => {
                if (member.trim()) {
                    this.teamMembers.push(member.trim());
                    this.createTeamMemberElement(member.trim());
                }
            });

            if (currentDriver) {
                const driverIndex = this.teamMembers.indexOf(currentDriver);
                if (driverIndex !== -1) {
                    this.currentDriverIndex = driverIndex;
                } else {
                    this.currentDriverIndex = 0;
                }
            } else if (this.teamMembers.length > 0) {
                this.currentDriverIndex = 0;
            }

            this.updateDriverDisplays();
        }
    }

    updateURL() {
        const params = new URLSearchParams(window.location.search);
        if (this.teamMembers.length > 0) {
            params.set('members', this.teamMembers.join(','));
            if (this.currentDriverIndex !== -1) {
                params.set('driver', this.teamMembers[this.currentDriverIndex]);
            }
        }
        const newURL = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newURL);
    }

    addMember() {
        const memberName = this.memberInput.value.trim();
        
        if (memberName && !this.teamMembers.includes(memberName)) {
            this.teamMembers.push(memberName);
            this.createTeamMemberElement(memberName);
            this.memberInput.value = '';

            if (this.teamMembers.length === 1) {
                this.currentDriverIndex = 0;
                this.updateDriverDisplays();
            }
            this.updateURL();
        }
    }

    createTeamMemberElement(memberName) {
        const memberDiv = document.createElement('div');
        memberDiv.classList.add('team-member');
        memberDiv.setAttribute('draggable', 'true');

        const radioWrapper = document.createElement('div');
        radioWrapper.classList.add('team-member-radio');

        const nameSpan = document.createElement('span');
        nameSpan.textContent = memberName;
        nameSpan.classList.add('member-name');

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.classList.add('remove-member');
        removeBtn.addEventListener('click', () => this.removeMember(memberName));

        radioWrapper.appendChild(nameSpan);

        memberDiv.appendChild(radioWrapper);
        memberDiv.appendChild(removeBtn);
        
        this.teamList.appendChild(memberDiv);
        this.updateDriverDisplays();
    }

    removeMember(memberName) {
        const index = this.teamMembers.indexOf(memberName);
        this.teamMembers.splice(index, 1);
        
        const memberElements = this.teamList.querySelectorAll('.team-member');
        memberElements[index].remove();
        
        if (this.currentDriverIndex >= this.teamMembers.length) {
            this.currentDriverIndex = this.teamMembers.length - 1;
        }

        if (this.teamMembers.length === 0) {
            this.currentDriverIndex = -1;
        }
        
        this.updateDriverDisplays();
        this.updateURL();
    }

    updateDriverDisplays() {
        if (this.teamMembers.length > 0 && this.currentDriverIndex !== -1) {
            const currentDriver = this.teamMembers[this.currentDriverIndex];
            const nextDriverIndex = (this.currentDriverIndex + 1) % this.teamMembers.length;
            const nextDriver = this.teamMembers[nextDriverIndex];
            
            this.currentDriverDisplay.textContent = currentDriver;
            this.nextDriverDisplay.textContent = nextDriver;
            
            // Update member list styling
            const memberElements = this.teamList.querySelectorAll('.team-member');
            
            memberElements.forEach((memberEl, index) => {
                memberEl.classList.remove('current', 'next');
                
                if (index === this.currentDriverIndex) {
                    memberEl.classList.add('current');
                } else if (index === nextDriverIndex) {
                    memberEl.classList.add('next');
                }
            });
        } else {
            this.currentDriverDisplay.textContent = 'No driver selected';
            this.nextDriverDisplay.textContent = 'No driver selected';
        }
    }

    shuffleTeamOrder() {
        for (let i = this.teamMembers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.teamMembers[i], this.teamMembers[j]] = [this.teamMembers[j], this.teamMembers[i]];
        }

        this.teamList.innerHTML = '';
        this.teamMembers.forEach(member => {
            this.createTeamMemberElement(member);
        });

        this.updateDriverDisplays();
        this.updateURL();
    }

    handleDragStart(e) {
        if (!e.target.closest('.team-member')) return;
        this.draggedItem = e.target.closest('.team-member');
        this.draggedItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDrop(e) {
        e.preventDefault();
        if (!this.draggedItem) return;

        const afterElement = this.getDragAfterElement(this.teamList, e.clientY);
        if (afterElement === null) {
            this.teamList.appendChild(this.draggedItem);
        } else {
            this.teamList.insertBefore(this.draggedItem, afterElement);
        }

        this.updateTeamMembersOrder();
        this.updateURL();
    }

    handleDragEnd() {
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
            this.draggedItem = null;
        }
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.team-member:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    updateTeamMembersOrder() {
        this.teamMembers = Array.from(this.teamList.querySelectorAll('.member-name'))
            .map(nameEl => nameEl.textContent);
        this.updateDriverDisplays();
    }

    getTeamMembers() {
        return this.teamMembers;
    }

    getCurrentDriverIndex() {
        return this.currentDriverIndex;
    }

    setNextDriver() {
        if (this.teamMembers.length > 0) {
            this.currentDriverIndex = (this.currentDriverIndex + 1) % this.teamMembers.length;
            this.updateDriverDisplays();
            this.updateURL();
        }
    }

    getTeamSize() {
        return this.teamMembers.length;
    }

    resetDriver() {
        if (this.teamMembers.length > 0) {
            this.currentDriverIndex = 0;
            this.updateDriverDisplays();
        } else {
            this.currentDriverIndex = -1;
            this.updateDriverDisplays();
        }
        this.updateURL();
    }
}