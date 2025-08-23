// Authentication Module
const authModule = {
    currentUser: null,
    
    init() {
        this.setupAuthListeners();
        this.setupAuthStateObserver();
    },
    
    setupAuthListeners() {
        // Login form
        document.getElementById('loginBtn').addEventListener('click', () => {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            this.signIn(email, password);
        });
        
        // Register form
        document.getElementById('registerBtn').addEventListener('click', () => {
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            this.signUp(email, password);
        });
        
        // Google Sign In
        document.getElementById('googleSignInBtn').addEventListener('click', () => {
            this.signInWithGoogle();
        });
        
        // Sign Out
        document.getElementById('signOutBtn').addEventListener('click', () => {
            this.signOut();
        });
        
        // Toggle between login and register
        document.getElementById('showRegisterBtn').addEventListener('click', () => {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('registerForm').classList.remove('hidden');
        });
        
        document.getElementById('showLoginBtn').addEventListener('click', () => {
            document.getElementById('registerForm').classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
        });
        
        // Enter key support
        ['loginEmail', 'loginPassword'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('loginBtn').click();
                }
            });
        });
        
        ['registerEmail', 'registerPassword'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('registerBtn').click();
                }
            });
        });
    },
    
    setupAuthStateObserver() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.onAuthSuccess(user);
            } else {
                this.currentUser = null;
                this.onAuthLogout();
            }
        });
    },
    
    async signIn(email, password) {
        if (!email || !password) {
            utils.showToast('Please enter email and password', 'error');
            return;
        }
        
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            utils.showToast('Successfully signed in!', 'success');
        } catch (error) {
            console.error('Sign in error:', error);
            utils.showToast(this.getErrorMessage(error.code), 'error');
        }
    },
    
    async signUp(email, password) {
        if (!email || !password) {
            utils.showToast('Please enter email and password', 'error');
            return;
        }
        
        if (password.length < 6) {
            utils.showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Create user profile in database
            await database.ref(`users/${userCredential.user.uid}`).set({
                email: email,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                drafts: {}
            });
            
            utils.showToast('Account created successfully!', 'success');
        } catch (error) {
            console.error('Sign up error:', error);
            utils.showToast(this.getErrorMessage(error.code), 'error');
        }
    },
    
    async signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        try {
            const result = await auth.signInWithPopup(provider);
            
            // Check if new user and create profile
            const userRef = database.ref(`users/${result.user.uid}`);
            const snapshot = await userRef.once('value');
            
            if (!snapshot.exists()) {
                await userRef.set({
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL,
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    drafts: {}
                });
            }
            
            utils.showToast('Successfully signed in with Google!', 'success');
        } catch (error) {
            console.error('Google sign in error:', error);
            utils.showToast(this.getErrorMessage(error.code), 'error');
        }
    },
    
    async signOut() {
        try {
            await auth.signOut();
            utils.showToast('Successfully signed out', 'success');
        } catch (error) {
            console.error('Sign out error:', error);
            utils.showToast('Error signing out', 'error');
        }
    },
    
    onAuthSuccess(user) {
        // Update UI
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('dashboardScreen').classList.remove('hidden');
        document.getElementById('userInfo').classList.remove('hidden');
        document.getElementById('userEmail').textContent = user.email;
        
        // Load user's drafts
        this.loadUserDrafts();
        
        // Clear form fields
        ['loginEmail', 'loginPassword', 'registerEmail', 'registerPassword'].forEach(id => {
            document.getElementById(id).value = '';
        });
    },
    
    onAuthLogout() {
        // Update UI
        document.getElementById('authScreen').classList.remove('hidden');
        document.getElementById('dashboardScreen').classList.add('hidden');
        document.getElementById('draftSetupScreen').classList.add('hidden');
        document.getElementById('draftBoardScreen').classList.add('hidden');
        document.getElementById('userInfo').classList.add('hidden');
        
        // Clean up any active draft listeners
        if (window.draftModule) {
            draftModule.cleanup();
        }
    },
    
    async loadUserDrafts() {
        if (!this.currentUser) return;
        
        const draftsRef = database.ref(`users/${this.currentUser.uid}/drafts`);
        const snapshot = await draftsRef.once('value');
        const userDrafts = snapshot.val() || {};
        
        const activeDraftsContainer = document.getElementById('activeDrafts');
        activeDraftsContainer.innerHTML = '';
        
        if (Object.keys(userDrafts).length === 0) {
            activeDraftsContainer.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-inbox text-4xl mb-2"></i>
                    <p>No active drafts. Create or join one to get started!</p>
                </div>
            `;
            return;
        }
        
        // Load draft details for each draft
        for (const draftId of Object.keys(userDrafts)) {
            const draftSnapshot = await database.ref(`drafts/${draftId}`).once('value');
            const draftData = draftSnapshot.val();
            
            if (draftData) {
                const draftCard = document.createElement('div');
                draftCard.className = 'bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition cursor-pointer';
                draftCard.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-semibold text-gray-800 dark:text-white">${draftData.name || 'Untitled Draft'}</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Code: ${draftId}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${draftData.teams} teams • Round ${draftData.currentRound || 1}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition" onclick="draftModule.joinDraft('${draftId}')">
                                ${draftData.status === 'completed' ? 'View Results' : 'Continue Draft'}
                            </button>
                            ${draftData.createdBy === this.currentUser.uid ? `
                                <button class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition" onclick="draftModule.deleteDraft('${draftId}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
                activeDraftsContainer.appendChild(draftCard);
            }
        }
    },
    
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': 'Email is already registered',
            'auth/invalid-email': 'Invalid email address',
            'auth/operation-not-allowed': 'Operation not allowed',
            'auth/weak-password': 'Password is too weak',
            'auth/user-disabled': 'User account is disabled',
            'auth/user-not-found': 'No user found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/popup-closed-by-user': 'Sign-in popup was closed',
            'auth/cancelled-popup-request': 'Only one popup request allowed at a time',
            'auth/popup-blocked': 'Sign-in popup was blocked by the browser'
        };
        
        return errorMessages[errorCode] || 'An error occurred. Please try again.';
    }
};