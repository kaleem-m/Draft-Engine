// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAuANB_8bVKGMvgNHXKE-7svI3jmWvUUxw",
    authDomain: "draftboard-fd6e5.firebaseapp.com",
    databaseURL: "https://draftboard-fd6e5-default-rtdb.firebaseio.com",
    projectId: "draftboard-fd6e5",
    storageBucket: "draftboard-fd6e5.firebasestorage.app",
    messagingSenderId: "965777715027",
    appId: "1:965777715027:web:29cdebdb0b752df5343ba6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const database = firebase.database();

// App Configuration
const APP_CONFIG = {
    DEFAULT_POSITIONS: [
        { name: 'QB', count: 1 },
        { name: 'RB', count: 2 },
        { name: 'WR', count: 2 },
        { name: 'TE', count: 1 },
        { name: 'FLEX', count: 1 },
        { name: 'DST', count: 1 },
        { name: 'K', count: 1 },
        { name: 'BENCH', count: 6 }
    ],
    
    // Sample player data (in production, this would come from an API)
    SAMPLE_PLAYERS: [
        // Quarterbacks
        { id: 'p1', name: 'Patrick Mahomes', position: 'QB', team: 'KC', rank: 1 },
        { id: 'p2', name: 'Josh Allen', position: 'QB', team: 'BUF', rank: 2 },
        { id: 'p3', name: 'Jalen Hurts', position: 'QB', team: 'PHI', rank: 3 },
        { id: 'p4', name: 'Lamar Jackson', position: 'QB', team: 'BAL', rank: 4 },
        { id: 'p5', name: 'Joe Burrow', position: 'QB', team: 'CIN', rank: 5 },
        { id: 'p6', name: 'Justin Herbert', position: 'QB', team: 'LAC', rank: 6 },
        { id: 'p7', name: 'Dak Prescott', position: 'QB', team: 'DAL', rank: 7 },
        { id: 'p8', name: 'Tua Tagovailoa', position: 'QB', team: 'MIA', rank: 8 },
        
        // Running Backs
        { id: 'p9', name: 'Christian McCaffrey', position: 'RB', team: 'SF', rank: 1 },
        { id: 'p10', name: 'Austin Ekeler', position: 'RB', team: 'LAC', rank: 2 },
        { id: 'p11', name: 'Bijan Robinson', position: 'RB', team: 'ATL', rank: 3 },
        { id: 'p12', name: 'Saquon Barkley', position: 'RB', team: 'NYG', rank: 4 },
        { id: 'p13', name: 'Tony Pollard', position: 'RB', team: 'DAL', rank: 5 },
        { id: 'p14', name: 'Derrick Henry', position: 'RB', team: 'TEN', rank: 6 },
        { id: 'p15', name: 'Josh Jacobs', position: 'RB', team: 'LV', rank: 7 },
        { id: 'p16', name: 'Nick Chubb', position: 'RB', team: 'CLE', rank: 8 },
        { id: 'p17', name: 'Jonathan Taylor', position: 'RB', team: 'IND', rank: 9 },
        { id: 'p18', name: 'Breece Hall', position: 'RB', team: 'NYJ', rank: 10 },
        
        // Wide Receivers
        { id: 'p19', name: 'Justin Jefferson', position: 'WR', team: 'MIN', rank: 1 },
        { id: 'p20', name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN', rank: 2 },
        { id: 'p21', name: 'Tyreek Hill', position: 'WR', team: 'MIA', rank: 3 },
        { id: 'p22', name: 'Cooper Kupp', position: 'WR', team: 'LAR', rank: 4 },
        { id: 'p23', name: 'Stefon Diggs', position: 'WR', team: 'BUF', rank: 5 },
        { id: 'p24', name: 'A.J. Brown', position: 'WR', team: 'PHI', rank: 6 },
        { id: 'p25', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', rank: 7 },
        { id: 'p26', name: 'Davante Adams', position: 'WR', team: 'LV', rank: 8 },
        { id: 'p27', name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', rank: 9 },
        { id: 'p28', name: 'Garrett Wilson', position: 'WR', team: 'NYJ', rank: 10 },
        { id: 'p29', name: 'Chris Olave', position: 'WR', team: 'NO', rank: 11 },
        { id: 'p30', name: 'Jaylen Waddle', position: 'WR', team: 'MIA', rank: 12 },
        
        // Tight Ends
        { id: 'p31', name: 'Travis Kelce', position: 'TE', team: 'KC', rank: 1 },
        { id: 'p32', name: 'Mark Andrews', position: 'TE', team: 'BAL', rank: 2 },
        { id: 'p33', name: 'T.J. Hockenson', position: 'TE', team: 'MIN', rank: 3 },
        { id: 'p34', name: 'George Kittle', position: 'TE', team: 'SF', rank: 4 },
        { id: 'p35', name: 'Dallas Goedert', position: 'TE', team: 'PHI', rank: 5 },
        { id: 'p36', name: 'Kyle Pitts', position: 'TE', team: 'ATL', rank: 6 },
        
        // Kickers
        { id: 'p37', name: 'Justin Tucker', position: 'K', team: 'BAL', rank: 1 },
        { id: 'p38', name: 'Harrison Butker', position: 'K', team: 'KC', rank: 2 },
        { id: 'p39', name: 'Daniel Carlson', position: 'K', team: 'LV', rank: 3 },
        { id: 'p40', name: 'Evan McPherson', position: 'K', team: 'CIN', rank: 4 },
        
        // Defenses
        { id: 'p41', name: 'Buffalo Bills', position: 'DST', team: 'BUF', rank: 1 },
        { id: 'p42', name: 'San Francisco 49ers', position: 'DST', team: 'SF', rank: 2 },
        { id: 'p43', name: 'Dallas Cowboys', position: 'DST', team: 'DAL', rank: 3 },
        { id: 'p44', name: 'New England Patriots', position: 'DST', team: 'NE', rank: 4 },
        { id: 'p45', name: 'Pittsburgh Steelers', position: 'DST', team: 'PIT', rank: 5 },
        
        // More players for depth
        { id: 'p46', name: 'Trey Lance', position: 'QB', team: 'SF', rank: 15 },
        { id: 'p47', name: 'Kenneth Walker III', position: 'RB', team: 'SEA', rank: 11 },
        { id: 'p48', name: 'Najee Harris', position: 'RB', team: 'PIT', rank: 12 },
        { id: 'p49', name: 'Calvin Ridley', position: 'WR', team: 'JAX', rank: 13 },
        { id: 'p50', name: 'DK Metcalf', position: 'WR', team: 'SEA', rank: 14 }
    ],
    
    // Sound Effects (using Web Audio API)
    SOUNDS: {
        yourTurn: 440, // Frequency for your turn notification
        pickMade: 523, // Frequency for pick made
        timerWarning: 880 // Frequency for timer warning
    }
};

// Utility Functions
const utils = {
    generateDraftCode: () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },
    
    playSound: (frequency, duration = 200) => {
        if (localStorage.getItem('soundEnabled') === 'false') return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    },
    
    showToast: (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type} px-6 py-3 text-white rounded-lg shadow-lg`;
        toast.textContent = message;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    formatTime: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};
