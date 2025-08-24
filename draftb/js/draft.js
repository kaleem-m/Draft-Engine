// Draft Management Module
const draftModule = {
    currentDraft: null,
    draftRef: null,
    listeners: [],
    timerInterval: null,
    isMyTurn: false,
    
    init() {
        this.setupDraftListeners();
        this.setupRosterDefaults();
    },
    
    setupDraftListeners() {
        // Create draft button
        document.getElementById('createDraftBtn').addEventListener('click', () => {
            this.showDraftSetup();
        });
        
        // Join draft button
        document.getElementById('joinDraftBtn').addEventListener('click', async () => {
            const codeInput = document.getElementById('joinDraftCode');
            const code = codeInput.value.trim().toUpperCase();
            const joinBtn = document.getElementById('joinDraftBtn');
            
            if (!code) {
                utils.showToast('Please enter a draft code', 'error');
                codeInput.focus();
                return;
            }
            
            // Disable button during join process
            joinBtn.disabled = true;
            joinBtn.textContent = 'Joining...';
            
            try {
                await this.joinDraft(code);
                // Clear the input on successful join
                codeInput.value = '';
            } finally {
                // Re-enable button
                joinBtn.disabled = false;
                joinBtn.textContent = 'Join Draft';
            }
        });
        
        // Draft setup
        document.getElementById('cancelSetupBtn').addEventListener('click', () => {
            this.hideDraftSetup();
        });
        
        document.getElementById('startDraftBtn').addEventListener('click', () => {
            this.createDraft();
        });
        
        document.getElementById('addPositionBtn').addEventListener('click', () => {
            this.addRosterPosition();
        });
        
        // Draft controls
        document.getElementById('pauseDraftBtn').addEventListener('click', () => {
            this.pauseDraft();
        });
        
        document.getElementById('resumeDraftBtn').addEventListener('click', () => {
            this.resumeDraft();
        });
        
        document.getElementById('undoPickBtn').addEventListener('click', () => {
            this.undoLastPick();
        });
        
        document.getElementById('resetDraftBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the entire draft?')) {
                this.resetDraft();
            }
        });
        
        document.getElementById('exportDraftBtn').addEventListener('click', () => {
            this.exportDraft();
        });
        
        // Player search
        document.getElementById('playerSearch').addEventListener('input', (e) => {
            this.filterPlayers();
        });
        
        document.getElementById('positionFilter').addEventListener('change', () => {
            this.filterPlayers();
        });
        
        // Enter key support for join draft code
        document.getElementById('joinDraftCode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('joinDraftBtn').click();
            }
        });
    },
    
    setupRosterDefaults() {
        const container = document.getElementById('rosterSettings');
        container.innerHTML = '';
        
        APP_CONFIG.DEFAULT_POSITIONS.forEach(pos => {
            this.addRosterPosition(pos.name, pos.count);
        });
    },
    
    addRosterPosition(name = '', count = 1) {
        const container = document.getElementById('rosterSettings');
        const posDiv = document.createElement('div');
        posDiv.className = 'flex space-x-2';
        posDiv.innerHTML = `
            <input type="text" placeholder="Position" value="${name}" class="position-name flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
            <input type="number" placeholder="Count" value="${count}" min="0" class="position-count w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
            <button class="remove-position px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        posDiv.querySelector('.remove-position').addEventListener('click', () => {
            posDiv.remove();
        });
        
        container.appendChild(posDiv);
    },
    
    showDraftSetup() {
        document.getElementById('dashboardScreen').classList.add('hidden');
        document.getElementById('draftSetupScreen').classList.remove('hidden');
    },
    
    hideDraftSetup() {
        document.getElementById('draftSetupScreen').classList.add('hidden');
        document.getElementById('dashboardScreen').classList.remove('hidden');
    },
    
    async createDraft() {
        const draftName = document.getElementById('draftName').value || 'Untitled Draft';
        const numTeams = parseInt(document.getElementById('numTeams').value);
        const timePerPick = parseInt(document.getElementById('timePerPick').value);
        
        // Get roster settings
        const rosterSettings = [];
        document.querySelectorAll('#rosterSettings > div').forEach(div => {
            const name = div.querySelector('.position-name').value;
            const count = parseInt(div.querySelector('.position-count').value);
            if (name && count > 0) {
                rosterSettings.push({ name, count });
            }
        });
        
        if (rosterSettings.length === 0) {
            utils.showToast('Please add at least one roster position', 'error');
            return;
        }
        
        const draftCode = utils.generateDraftCode();
        const totalRounds = rosterSettings.reduce((sum, pos) => sum + pos.count, 0);
        
        // Create draft object
        const draftData = {
            code: draftCode,
            name: draftName,
            createdBy: authModule.currentUser.uid,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            teams: numTeams,
            timePerPick: timePerPick,
            rosterSettings: rosterSettings,
            totalRounds: totalRounds,
            currentPick: 1,
            currentRound: 1,
            currentTeam: 1,
            status: 'waiting', // waiting, active, paused, completed - Start as waiting
            draftOrder: [],
            picks: {},
            teamRosters: {},
            participants: {},
            spectators: {},
            players: APP_CONFIG.SAMPLE_PLAYERS
        };
        
        // Initialize team rosters
        for (let i = 1; i <= numTeams; i++) {
            draftData.teamRosters[`team${i}`] = {
                name: `Team ${i}`,
                owner: null,
                picks: []
            };
        }
        
        // Don't assign creator to team automatically - they will choose during team selection
        draftData.participants[authModule.currentUser.uid] = {
            email: authModule.currentUser.email,
            team: null, // Will be assigned during team selection
            joinedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        try {
            // Save draft to Firebase
            await database.ref(`drafts/${draftCode}`).set(draftData);
            
            // Add draft to user's draft list
            await database.ref(`users/${authModule.currentUser.uid}/drafts/${draftCode}`).set(true);
            
            utils.showToast(`Draft created! Code: ${draftCode}`, 'success');
            
            // Navigate to draft board
            this.joinDraft(draftCode);
        } catch (error) {
            console.error('Error creating draft:', error);
            utils.showToast('Error creating draft', 'error');
        }
    },
    
    async joinDraft(draftCode) {
        try {
            // Validate draft code format
            if (!draftCode || draftCode.length !== 6) {
                utils.showToast('Invalid draft code format', 'error');
                return;
            }
            
            utils.showToast('Joining draft...', 'info');
            
            const draftSnapshot = await database.ref(`drafts/${draftCode}`).once('value');
            
            if (!draftSnapshot.exists()) {
                utils.showToast('Draft not found. Please check the code and try again.', 'error');
                return;
            }
            
            this.currentDraft = draftSnapshot.val();
            this.currentDraft.code = draftCode;
            this.draftRef = database.ref(`drafts/${draftCode}`);
            
            const userId = authModule.currentUser.uid;
            
            // Check if user is already in the draft
            const isParticipant = this.currentDraft.participants && this.currentDraft.participants[userId];
            const isSpectator = this.currentDraft.spectators && this.currentDraft.spectators[userId];
            
            if (!isParticipant && !isSpectator) {
                // Join as participant without team assignment (will choose later)
                await this.draftRef.child(`participants/${userId}`).set({
                    email: authModule.currentUser.email,
                    team: null, // Will be assigned during team selection
                    joinedAt: firebase.database.ServerValue.TIMESTAMP
                });
                
                utils.showToast('Successfully joined draft!', 'success');
            } else {
                utils.showToast('Rejoining draft...', 'info');
            }
            
            // Add to user's drafts
            await database.ref(`users/${userId}/drafts/${draftCode}`).set(true);
            
            // Navigate to team selection or draft board based on draft status
            if (this.currentDraft.status === 'waiting') {
                this.showTeamSelection();
            } else {
                this.showDraftBoard();
            }
            
        } catch (error) {
            console.error('Error joining draft:', error);
            
            // Provide more specific error messages
            if (error.code === 'PERMISSION_DENIED') {
                utils.showToast('Permission denied. Please check if you are signed in.', 'error');
            } else if (error.code === 'NETWORK_ERROR') {
                utils.showToast('Network error. Please check your connection and try again.', 'error');
            } else {
                utils.showToast('Error joining draft. Please try again.', 'error');
            }
        }
    },
    
    showDraftBoard() {
        // Hide other screens
        document.getElementById('dashboardScreen').classList.add('hidden');
        document.getElementById('draftSetupScreen').classList.add('hidden');
        document.getElementById('teamSelectionScreen').classList.add('hidden');
        document.getElementById('draftBoardScreen').classList.remove('hidden');
        
        // Update draft info
        document.getElementById('draftTitle').textContent = this.currentDraft.name;
        document.getElementById('draftCode').textContent = `Code: ${this.currentDraft.code}`;
        
        // Show admin controls if creator
        if (this.currentDraft.createdBy === authModule.currentUser.uid) {
            document.getElementById('draftControls').classList.remove('hidden');
        }
        
        // Initialize draft board
        this.initializeDraftBoard();
        this.setupRealtimeListeners();
    },
    
    async startDraft() {
        if (this.currentDraft.createdBy !== authModule.currentUser.uid) {
            utils.showToast('Only the draft creator can start the draft', 'error');
            return;
        }
        
        await this.draftRef.update({ status: 'active' });
        utils.showToast('Draft started!', 'success');
        
        // Remove start button
        const startBtn = document.getElementById('startDraftBtn');
        if (startBtn) startBtn.remove();
        
        // Start timer
        this.startPickTimer();
    },
    
    initializeDraftBoard() {
        // Populate player list
        this.renderPlayerList();
        
        // Populate position filter
        const positions = [...new Set(this.currentDraft.players.map(p => p.position))];
        const positionFilter = document.getElementById('positionFilter');
        positionFilter.innerHTML = '<option value="">All Positions</option>';
        positions.forEach(pos => {
            positionFilter.innerHTML += `<option value="${pos}">${pos}</option>`;
        });
        
        // Render team boards
        this.renderTeamBoards();
        
        // Update current pick info
        this.updateCurrentPick();
        
        // Start timer if draft is active
        if (this.currentDraft.status === 'active') {
            this.startPickTimer();
        }
    },
    
    renderPlayerList() {
        const container = document.getElementById('playerList');
        container.innerHTML = '';
        
        this.currentDraft.players.forEach(player => {
            const isDrafted = this.isPlayerDrafted(player.id);
            const playerDiv = document.createElement('div');
            playerDiv.className = `player-card p-3 bg-gray-100 dark:bg-gray-700 rounded-lg ${isDrafted ? 'drafted' : ''}`;
            playerDiv.dataset.playerId = player.id;
            
            // Check if it's my turn and draft is active
            const canPick = !isDrafted && this.isMyTurn && this.currentDraft.status === 'active';
            
            if (canPick) {
                playerDiv.classList.add('cursor-pointer', 'hover:bg-indigo-100', 'dark:hover:bg-indigo-900');
                playerDiv.style.cursor = 'pointer';
            } else {
                playerDiv.style.cursor = isDrafted ? 'not-allowed' : 'default';
            }
            
            playerDiv.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-semibold text-gray-800 dark:text-white">${player.name}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${player.position} - ${player.team}</p>
                    </div>
                    <span class="text-sm font-bold text-gray-500 dark:text-gray-400">#${player.rank}</span>
                </div>
            `;
            
            if (canPick) {
                playerDiv.onclick = () => {
                    console.log('Player selected:', player.name);
                    this.selectPlayer(player);
                };
            }
            
            container.appendChild(playerDiv);
        });
    },
    
    selectPlayer(player) {
        // Highlight selected player
        document.querySelectorAll('.player-card').forEach(card => {
            card.classList.remove('ring-2', 'ring-indigo-500');
        });
        
        const playerCard = document.querySelector(`[data-player-id="${player.id}"]`);
        if (playerCard) {
            playerCard.classList.add('ring-2', 'ring-indigo-500');
        }
        
        // Show selection confirmation
        const actionDiv = document.getElementById('selectedPlayerAction');
        const playerNameSpan = document.getElementById('selectedPlayerName');
        const confirmBtn = document.getElementById('confirmPickBtn');
        
        actionDiv.classList.remove('hidden');
        playerNameSpan.textContent = `${player.name} (${player.position} - ${player.team})`;
        
        // Remove old event listener and add new one
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.onclick = () => {
            console.log('Confirming draft of:', player.name);
            this.draftPlayer(player);
            actionDiv.classList.add('hidden');
        };
    },
    
    renderTeamBoards() {
        const container = document.getElementById('teamBoards');
        container.innerHTML = '';
        
        // Show only teams with owners first, then empty teams
        const teamsWithOwners = [];
        const teamsWithoutOwners = [];
        
        for (let i = 1; i <= this.currentDraft.teams; i++) {
            const teamKey = `team${i}`;
            const team = this.currentDraft.teamRosters[teamKey];
            
            if (team.owner) {
                teamsWithOwners.push({ key: teamKey, team, number: i });
            } else {
                teamsWithoutOwners.push({ key: teamKey, team, number: i });
            }
        }
        
        // Render teams with owners first
        [...teamsWithOwners, ...teamsWithoutOwners].forEach(({ key: teamKey, team, number: i }) => {
            const isCurrentTeam = this.currentDraft.currentTeam === i;
            
            // Find participant for this team
            const participant = team.owner ? 
                Object.values(this.currentDraft.participants || {}).find(p => p.team === teamKey) : null;
            
            const teamDiv = document.createElement('div');
            teamDiv.className = `team-board bg-white dark:bg-gray-800 rounded-lg p-4 shadow ${isCurrentTeam ? 'active' : ''}`;
            teamDiv.innerHTML = `
                <h4 class="font-bold text-gray-800 dark:text-white mb-2">
                    ${team.name}
                    ${team.owner ? `<span class="text-sm font-normal text-gray-600 dark:text-gray-400">(${participant?.email || 'Unknown User'})</span>` : '<span class="text-sm font-normal text-gray-500">(Available)</span>'}
                </h4>
                <div class="space-y-1 max-h-48 overflow-y-auto">
                    ${(team.picks || []).map(pick => `
                        <div class="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded pick-animation">
                            <span class="font-medium">${pick.player.name}</span>
                            <span class="text-gray-500 dark:text-gray-400"> - ${pick.player.position}</span>
                        </div>
                    `).join('') || '<p class="text-gray-400 text-sm">No picks yet</p>'}
                </div>
            `;
            
            container.appendChild(teamDiv);
        });
    },
    
    setupRealtimeListeners() {
        // Clean up existing listeners
        this.cleanup();
        
        // Listen for draft updates
        const listener = this.draftRef.on('value', (snapshot) => {
            this.currentDraft = snapshot.val();
            this.currentDraft.code = snapshot.key;
            
            // Update UI
            this.renderPlayerList();
            this.renderTeamBoards();
            this.updateCurrentPick();
            
            // Check if it's my turn
            this.checkMyTurn();
            
            // Handle draft status changes
            if (this.currentDraft.status === 'completed') {
                this.onDraftComplete();
            }
        });
        
        this.listeners.push(() => this.draftRef.off('value', listener));
    },
    
    updateCurrentPick() {
        const pick = this.currentDraft.currentPick;
        const round = this.currentDraft.currentRound;
        const team = this.currentDraft.currentTeam;
        
        document.getElementById('currentPick').textContent = `${round}.${pick}`;
        document.getElementById('currentTeam').textContent = this.currentDraft.teamRosters[`team${team}`].name;
        
        // Update on the clock message
        const onTheClock = document.getElementById('onTheClock');
        if (this.currentDraft.status === 'paused') {
            onTheClock.innerHTML = '<p class="text-center text-lg font-medium text-yellow-600">Draft is paused</p>';
        } else if (this.currentDraft.status === 'completed') {
            onTheClock.innerHTML = '<p class="text-center text-lg font-medium text-green-600">Draft completed!</p>';
        } else {
            const teamName = this.currentDraft.teamRosters[`team${team}`].name;
            onTheClock.innerHTML = `<p class="text-center text-lg font-medium text-indigo-800 dark:text-indigo-200">${teamName} is on the clock!</p>`;
        }
    },
    
    checkMyTurn() {
        const userId = authModule.currentUser.uid;
        const participant = this.currentDraft.participants?.[userId];
        
        console.log('Checking turn - User ID:', userId);
        console.log('Participant:', participant);
        console.log('Current Team:', this.currentDraft.currentTeam);
        console.log('Draft Status:', this.currentDraft.status);
        
        if (participant && participant.team && this.currentDraft.status === 'active') {
            const currentTeamKey = `team${this.currentDraft.currentTeam}`;
            const wasMyTurn = this.isMyTurn;
            this.isMyTurn = participant.team === currentTeamKey;
            
            console.log('My team:', participant.team, 'Current team:', currentTeamKey, 'Is my turn:', this.isMyTurn);
            
            if (this.isMyTurn && !wasMyTurn) {
                utils.playSound(APP_CONFIG.SOUNDS.yourTurn);
                utils.showToast("It's your turn to pick!", 'info');
            }
        } else {
            this.isMyTurn = false;
        }
    },
    
    async draftPlayer(player) {
        console.log('draftPlayer called with:', player);
        console.log('Is my turn?', this.isMyTurn);
        console.log('Draft status:', this.currentDraft.status);
        
        if (!this.currentDraft) {
            utils.showToast('No active draft', 'error');
            return;
        }
        
        if (this.currentDraft.status !== 'active') {
            utils.showToast('Draft is not active. Please start the draft first.', 'error');
            return;
        }
        
        if (!this.isMyTurn) {
            utils.showToast("It's not your turn!", 'error');
            return;
        }
        
        if (this.isPlayerDrafted(player.id)) {
            utils.showToast('Player already drafted', 'error');
            return;
        }
        
        const pickNumber = this.currentDraft.currentPick;
        const round = this.currentDraft.currentRound;
        const teamKey = `team${this.currentDraft.currentTeam}`;
        
        // Record the pick
        const pickData = {
            player: player,
            round: round,
            pick: pickNumber,
            team: teamKey,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        try {
            console.log('Updating draft with pick:', pickData);
            
            // Update draft in Firebase
            const updates = {};
            updates[`picks/${pickNumber}`] = pickData;
            updates[`teamRosters/${teamKey}/picks`] = [...(this.currentDraft.teamRosters[teamKey].picks || []), pickData];
            
            // Calculate next pick
            const nextPick = this.calculateNextPick();
            updates['currentPick'] = nextPick.pick;
            updates['currentRound'] = nextPick.round;
            updates['currentTeam'] = nextPick.team;
            
            // Check if draft is complete
            if (nextPick.round > this.currentDraft.totalRounds) {
                updates['status'] = 'completed';
            }
            
            await this.draftRef.update(updates);
            
            utils.playSound(APP_CONFIG.SOUNDS.pickMade);
            utils.showToast(`Drafted ${player.name}!`, 'success');
            
            // Reset timer
            this.startPickTimer();
            
        } catch (error) {
            console.error('Error drafting player:', error);
            utils.showToast('Error making pick: ' + error.message, 'error');
        }
    },
    
    calculateNextPick() {
        let pick = this.currentDraft.currentPick + 1;
        let round = this.currentDraft.currentRound;
        let team = this.currentDraft.currentTeam;
        
        // Use draft order if available, otherwise fall back to simple team numbering
        const draftOrder = this.currentDraft.draftOrder || [];
        const activeTeamsCount = draftOrder.length || this.currentDraft.teams;
        
        // Snake draft logic
        if (round % 2 === 1) {
            // Odd round - normal order
            team++;
            if (team > activeTeamsCount) {
                team = activeTeamsCount;
                round++;
            }
        } else {
            // Even round - reverse order
            team--;
            if (team < 1) {
                team = 1;
                round++;
            }
        }
        
        return { pick, round, team };
    },
    
    isPlayerDrafted(playerId) {
        if (!this.currentDraft.picks) return false;
        return Object.values(this.currentDraft.picks).some(pick => pick.player.id === playerId);
    },
    
    filterPlayers() {
        const searchTerm = document.getElementById('playerSearch').value.toLowerCase();
        const positionFilter = document.getElementById('positionFilter').value;
        
        const filteredPlayers = this.currentDraft.players.filter(player => {
            const matchesSearch = player.name.toLowerCase().includes(searchTerm) || 
                                 player.team.toLowerCase().includes(searchTerm);
            const matchesPosition = !positionFilter || player.position === positionFilter;
            return matchesSearch && matchesPosition;
        });
        
        // Re-render with filtered players
        const container = document.getElementById('playerList');
        container.innerHTML = '';
        
        filteredPlayers.forEach(player => {
            const isDrafted = this.isPlayerDrafted(player.id);
            const playerDiv = document.createElement('div');
            playerDiv.className = `player-card p-3 bg-gray-100 dark:bg-gray-700 rounded-lg ${isDrafted ? 'drafted' : ''}`;
            playerDiv.dataset.playerId = player.id;
            
            // Check if it's my turn and draft is active
            const canPick = !isDrafted && this.isMyTurn && this.currentDraft.status === 'active';
            
            if (canPick) {
                playerDiv.classList.add('cursor-pointer', 'hover:bg-indigo-100', 'dark:hover:bg-indigo-900');
                playerDiv.style.cursor = 'pointer';
            } else {
                playerDiv.style.cursor = isDrafted ? 'not-allowed' : 'default';
            }
            
            playerDiv.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-semibold text-gray-800 dark:text-white">${player.name}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${player.position} - ${player.team}</p>
                    </div>
                    <span class="text-sm font-bold text-gray-500 dark:text-gray-400">#${player.rank}</span>
                </div>
            `;
            
            if (canPick) {
                playerDiv.onclick = () => {
                    console.log('Player selected (from filter):', player.name);
                    this.selectPlayer(player);
                };
            }
            
            container.appendChild(playerDiv);
        });
    },
    
    startPickTimer() {
        clearInterval(this.timerInterval);
        
        if (this.currentDraft.status !== 'active') return;
        
        let timeRemaining = this.currentDraft.timePerPick;
        const timerElement = document.getElementById('pickTimer');
        
        this.timerInterval = setInterval(() => {
            timeRemaining--;
            timerElement.textContent = timeRemaining;
            
            if (timeRemaining <= 10) {
                timerElement.classList.add('timer-warning');
                if (timeRemaining === 10) {
                    utils.playSound(APP_CONFIG.SOUNDS.timerWarning);
                }
            } else {
                timerElement.classList.remove('timer-warning');
            }
            
            if (timeRemaining <= 0) {
                clearInterval(this.timerInterval);
                this.onTimerExpire();
            }
        }, 1000);
    },
    
    async onTimerExpire() {
        // Auto-skip to next team
        if (this.isMyTurn) {
            utils.showToast('Time expired! Skipping your pick.', 'warning');
        }
        
        const nextPick = this.calculateNextPick();
        await this.draftRef.update({
            currentPick: nextPick.pick,
            currentRound: nextPick.round,
            currentTeam: nextPick.team
        });
        
        this.startPickTimer();
    },
    
    async pauseDraft() {
        await this.draftRef.update({ status: 'paused' });
        clearInterval(this.timerInterval);
        document.getElementById('pauseDraftBtn').classList.add('hidden');
        document.getElementById('resumeDraftBtn').classList.remove('hidden');
        utils.showToast('Draft paused', 'info');
    },
    
    async resumeDraft() {
        await this.draftRef.update({ status: 'active' });
        this.startPickTimer();
        document.getElementById('resumeDraftBtn').classList.add('hidden');
        document.getElementById('pauseDraftBtn').classList.remove('hidden');
        utils.showToast('Draft resumed', 'info');
    },
    
    async undoLastPick() {
        if (!this.currentDraft.picks || Object.keys(this.currentDraft.picks).length === 0) {
            utils.showToast('No picks to undo', 'error');
            return;
        }
        
        // Get the last pick
        const lastPickNum = this.currentDraft.currentPick - 1;
        const lastPick = this.currentDraft.picks[lastPickNum];
        
        if (!lastPick) {
            utils.showToast('No pick to undo', 'error');
            return;
        }
        
        // Remove the pick
        const updates = {};
        updates[`picks/${lastPickNum}`] = null;
        
        // Remove from team roster
        const teamPicks = this.currentDraft.teamRosters[lastPick.team].picks.filter(
            p => p.pick !== lastPickNum
        );
        updates[`teamRosters/${lastPick.team}/picks`] = teamPicks;
        
        // Revert to previous pick
        updates['currentPick'] = lastPickNum;
        updates['currentRound'] = lastPick.round;
        updates['currentTeam'] = parseInt(lastPick.team.replace('team', ''));
        
        await this.draftRef.update(updates);
        utils.showToast('Last pick undone', 'success');
    },
    
    async resetDraft() {
        const updates = {
            currentPick: 1,
            currentRound: 1,
            currentTeam: 1,
            picks: {},
            status: 'waiting'
        };
        
        // Clear all team rosters
        for (let i = 1; i <= this.currentDraft.teams; i++) {
            updates[`teamRosters/team${i}/picks`] = [];
        }
        
        await this.draftRef.update(updates);
        utils.showToast('Draft reset', 'success');
    },
    
    async deleteDraft(draftCode) {
        if (!confirm('Are you sure you want to delete this draft?')) return;
        
        try {
            // Remove draft from database
            await database.ref(`drafts/${draftCode}`).remove();
            
            // Remove from user's drafts
            await database.ref(`users/${authModule.currentUser.uid}/drafts/${draftCode}`).remove();
            
            utils.showToast('Draft deleted', 'success');
            authModule.loadUserDrafts();
        } catch (error) {
            console.error('Error deleting draft:', error);
            utils.showToast('Error deleting draft', 'error');
        }
    },
    
    exportDraft() {
        // Generate CSV
        let csv = 'Pick,Round,Team,Player,Position\\n';
        
        Object.values(this.currentDraft.picks || {}).forEach(pick => {
            const teamName = this.currentDraft.teamRosters[pick.team].name;
            csv += `${pick.pick},${pick.round},${teamName},${pick.player.name},${pick.player.position}\\n`;
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `draft-results-${this.currentDraft.code}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        utils.showToast('Draft results exported', 'success');
    },
    
    onDraftComplete() {
        clearInterval(this.timerInterval);
        utils.showToast('Draft completed!', 'success');
        
        // Show celebration animation
        this.showCelebration();
    },
    
    showCelebration() {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        
        // Create confetti
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
            celebration.appendChild(confetti);
        }
        
        document.body.appendChild(celebration);
        
        setTimeout(() => {
            celebration.remove();
        }, 3000);
    },
    
    showTeamSelection() {
        // Hide other screens
        document.getElementById('dashboardScreen').classList.add('hidden');
        document.getElementById('draftSetupScreen').classList.add('hidden');
        document.getElementById('draftBoardScreen').classList.add('hidden');
        document.getElementById('teamSelectionScreen').classList.remove('hidden');
        
        // Update draft info
        document.getElementById('teamSelectionDraftCode').textContent = this.currentDraft.code;
        document.getElementById('totalTeamsCount').textContent = this.currentDraft.teams;
        
        // Render team selection
        this.renderTeamSelection();
        
        // Setup team selection listeners
        this.setupTeamSelectionListeners();
        
        // Show start button if creator and enough participants
        if (this.currentDraft.createdBy === authModule.currentUser.uid) {
            document.getElementById('startDraftFromSelectionBtn').classList.remove('hidden');
        }
    },
    
    renderTeamSelection() {
        const container = document.getElementById('teamSelectionGrid');
        const userId = authModule.currentUser.uid;
        const participant = this.currentDraft.participants[userId];
        
        container.innerHTML = '';
        
        // Count participants with assigned teams
        let participantCount = 0;
        Object.values(this.currentDraft.participants).forEach(p => {
            if (p.team) participantCount++;
        });
        document.getElementById('participantCount').textContent = participantCount;
        
        for (let i = 1; i <= this.currentDraft.teams; i++) {
            const teamKey = `team${i}`;
            const team = this.currentDraft.teamRosters[teamKey];
            const isOwned = team.owner !== null;
            const isMyTeam = participant && participant.team === teamKey;
            
            const teamDiv = document.createElement('div');
            teamDiv.className = `team-selection-card p-4 border-2 rounded-lg cursor-pointer transition ${
                isMyTeam ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900' :
                isOwned ? 'border-gray-300 bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50' :
                'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900'
            }`;
            
            const ownerInfo = isOwned ? 
                this.currentDraft.participants[team.owner] || 
                Object.values(this.currentDraft.participants).find(p => p.team === teamKey) : null;
            
            teamDiv.innerHTML = `
                <div class="text-center">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">${team.name}</h3>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        ${isOwned ? 
                            `<p class="font-medium">${ownerInfo?.email || 'Unknown'}</p>
                             <p class="text-green-600 dark:text-green-400">Taken</p>` :
                            `<p class="text-blue-600 dark:text-blue-400">Available</p>`
                        }
                        ${isMyTeam ? '<p class="text-indigo-600 dark:text-indigo-400 font-bold">Your Team</p>' : ''}
                    </div>
                </div>
            `;
            
            if (!isOwned && !isMyTeam) {
                teamDiv.onclick = () => this.selectTeam(teamKey);
            } else if (isMyTeam) {
                teamDiv.onclick = () => this.deselectTeam();
            }
            
            container.appendChild(teamDiv);
        }
    },
    
    setupTeamSelectionListeners() {
        // Spectate button
        document.getElementById('spectateBtn').onclick = () => {
            this.joinAsSpectator();
        };
        
        // Start draft button (admin only)
        document.getElementById('startDraftFromSelectionBtn').onclick = () => {
            this.startDraftFromSelection();
        };
        
        // Setup realtime listeners for team selection updates
        this.setupTeamSelectionRealtimeListeners();
    },
    
    setupTeamSelectionRealtimeListeners() {
        // Clean up existing listeners
        this.cleanup();
        
        // Listen for draft updates
        const listener = this.draftRef.on('value', (snapshot) => {
            this.currentDraft = snapshot.val();
            this.currentDraft.code = snapshot.key;
            
            // Update team selection UI
            this.renderTeamSelection();
            
            // If draft started, navigate to draft board
            if (this.currentDraft.status === 'active') {
                this.showDraftBoard();
            }
        });
        
        this.listeners.push(() => this.draftRef.off('value', listener));
    },
    
    async selectTeam(teamKey) {
        const userId = authModule.currentUser.uid;
        
        try {
            // First check if team is still available
            const teamSnapshot = await this.draftRef.child(`teamRosters/${teamKey}/owner`).once('value');
            if (teamSnapshot.val()) {
                utils.showToast('Team is no longer available', 'error');
                return;
            }
            
            // Update participant's team
            await this.draftRef.child(`participants/${userId}/team`).set(teamKey);
            await this.draftRef.child(`teamRosters/${teamKey}/owner`).set(userId);
            
            utils.showToast(`Selected ${this.currentDraft.teamRosters[teamKey].name}!`, 'success');
            
        } catch (error) {
            console.error('Error selecting team:', error);
            utils.showToast('Error selecting team', 'error');
        }
    },
    
    async deselectTeam() {
        const userId = authModule.currentUser.uid;
        const participant = this.currentDraft.participants[userId];
        
        if (!participant || !participant.team) return;
        
        try {
            // Remove team assignment
            await this.draftRef.child(`participants/${userId}/team`).set(null);
            await this.draftRef.child(`teamRosters/${participant.team}/owner`).set(null);
            
            utils.showToast('Team deselected', 'info');
            
        } catch (error) {
            console.error('Error deselecting team:', error);
            utils.showToast('Error deselecting team', 'error');
        }
    },
    
    async joinAsSpectator() {
        const userId = authModule.currentUser.uid;
        
        try {
            // Remove from participants and add to spectators
            await this.draftRef.child(`participants/${userId}`).remove();
            await this.draftRef.child(`spectators/${userId}`).set({
                email: authModule.currentUser.email,
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            utils.showToast('Joined as spectator', 'info');
            this.showDraftBoard();
            
        } catch (error) {
            console.error('Error joining as spectator:', error);
            utils.showToast('Error joining as spectator', 'error');
        }
    },
    
    async startDraftFromSelection() {
        if (this.currentDraft.createdBy !== authModule.currentUser.uid) {
            utils.showToast('Only the draft creator can start the draft', 'error');
            return;
        }
        
        // Check if we have enough participants with teams
        const participantsWithTeams = Object.values(this.currentDraft.participants).filter(p => p.team).length;
        
        if (participantsWithTeams < 2) {
            utils.showToast('Need at least 2 participants with selected teams to start the draft', 'error');
            return;
        }
        
        try {
            // Generate draft order based on team assignments
            const draftOrder = [];
            for (let i = 1; i <= this.currentDraft.teams; i++) {
                const teamKey = `team${i}`;
                if (this.currentDraft.teamRosters[teamKey].owner) {
                    draftOrder.push(teamKey);
                }
            }
            
            await this.draftRef.update({ 
                status: 'active',
                draftOrder: draftOrder
            });
            
            utils.showToast('Draft started!', 'success');
            
        } catch (error) {
            console.error('Error starting draft:', error);
            utils.showToast('Error starting draft', 'error');
        }
    },

    cleanup() {
        // Remove all listeners
        this.listeners.forEach(removeListener => removeListener());
        this.listeners = [];
        
        // Clear timer
        clearInterval(this.timerInterval);
        
        // Reset state
        this.currentDraft = null;
        this.draftRef = null;
        this.isMyTurn = false;
    }
};