// UI and Animations with GSAP
const ui = {
    elements: {
        userName: document.getElementById('user-name'),
        userLevel: document.getElementById('user-level'),
        xpBar: document.getElementById('xp-bar'),
        xpText: document.getElementById('xp-text'),
        streakDays: document.getElementById('streak-days'),
        loadingOverlay: document.getElementById('loading-overlay'),
        
        // Screens
        splashScreen: document.getElementById('splash-screen'),
        welcomeScreen: document.getElementById('welcome-screen'),
        authScreen: document.getElementById('auth-screen'),
        mainApp: document.getElementById('main-app'),
        villageScreen: document.getElementById('village-screen'), // New Village Screen
        
        // Buttons
        btnKidsPath: document.getElementById('btn-kids-path'),
        btnLoginSubmit: document.getElementById('btn-login-submit'),
        btnBackToMap: document.getElementById('btn-back-to-map'),
        
        // Village specific
        villageTitle: document.getElementById('village-screen-title'),
        btnChalListen: document.getElementById('btn-chal-listen'),
        btnChalRepeat: document.getElementById('btn-chal-repeat'),
        btnChalRecord: document.getElementById('btn-chal-record'),
        btnChalQuiz: document.getElementById('btn-chal-quiz'),
        
        // Popups
        challengePopup: document.getElementById('challenge-popup'),
        successOverlay: document.getElementById('success-overlay'),
        closePopupBtn: document.getElementById('close-popup'),
        recordBtn: document.getElementById('record-btn'),
        feedbackContainer: document.getElementById('feedback-container'),
        continueBtn: document.getElementById('continue-btn'),
        popupSurahName: document.getElementById('popup-surah-name'),
    },

    // Persistent State Tracker
    challengeProgress: {}, // Format: { villageId: { listen: boolean, repeat: boolean, record: boolean, quiz: boolean } }

    init(userData) {
        this.userData = userData; // Store for later
        this.setupEventListeners();
        
        // Play splash animations instead of going directly to main app
        this.playSplashAnimation();
    },
    
    playSplashAnimation() {
        const tl = gsap.timeline();
        
        // Logo pop out
        tl.to('.app-logo', { scale: 1, rotation: 360, duration: 0.8, ease: "back.out(1.5)" })
          // Text slide up
          .to(['.splash-title', '.splash-subtitle'], { y: 0, opacity: 1, duration: 0.5, stagger: 0.2 }, "-=0.2")
          // Show loader
          .to('.splash-loader', { opacity: 1, duration: 0.3 });
          
        setTimeout(() => {
            this.showWelcomeScreen();
        }, 3000);
    },
    
    showWelcomeScreen() {
        // Fade out splash
        gsap.to(this.elements.splashScreen, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                this.elements.splashScreen.classList.remove('active');
                this.elements.splashScreen.classList.add('hidden');
                
                // Show welcome screen
                this.elements.welcomeScreen.classList.remove('hidden');
                this.elements.welcomeScreen.classList.add('active');
                
                // Animate paths cascading in
                gsap.from('.path-card', {
                    x: 50,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.15,
                    ease: "back.out(1.2)"
                });
            }
        });
    },

    showAuthScreen() {
        audioManager.play('click');
        
        // Transition from Welcome to Auth screen
        gsap.to(this.elements.welcomeScreen, {
            opacity: 0,
            scale: 0.95,
            duration: 0.4,
            onComplete: () => {
                this.elements.welcomeScreen.classList.remove('active');
                this.elements.welcomeScreen.classList.add('hidden');
                
                // Show Auth Screen
                this.elements.authScreen.classList.remove('hidden');
                this.elements.authScreen.classList.add('active');
                
                // Animate Auth elements
                gsap.from('.auth-wrapper', {
                    y: 50,
                    opacity: 0,
                    scale: 0.9,
                    duration: 0.6,
                    ease: "back.out(1.2)"
                });
            }
        });
    },

    startMainApp() {
        audioManager.play('success'); // gentle sound for entering app
        
        // Transition from Auth to Main App
        gsap.to(this.elements.authScreen, {
            opacity: 0,
            scale: 0.95,
            duration: 0.4,
            onComplete: () => {
                this.elements.authScreen.classList.remove('active');
                this.elements.authScreen.classList.add('hidden');
                
                // Show Main App
                this.elements.mainApp.classList.remove('hidden');
                this.elements.mainApp.classList.add('active');
                
                // Update header info
                this.updateUserInfo(this.userData);
                
                // Force Phaser canvas to resize/render properly if hidden initially
                if (mapEngine.game) {
                    window.dispatchEvent(new Event('resize'));
                }
                
                // Hide loading overlay natively existing in main-app
                setTimeout(() => {
                    gsap.to(this.elements.loadingOverlay, {
                        opacity: 0,
                        duration: 0.5,
                        onComplete: () => this.elements.loadingOverlay.classList.add('hidden')
                    });
                }, 500);
            }
        });
    },

    updateUserInfo(userData) {
        this.elements.userName.textContent = userData.name;
        this.elements.userLevel.textContent = userData.level;
        this.elements.streakDays.textContent = `${userData.streak} أيام`;
        
        // Animate XP
        this.animateXP(0, userData.xp);
        
        // Update recitation screen XP if it exists
        const recXp = document.getElementById('recitation-current-xp');
        if (recXp) recXp.textContent = userData.xp;

        // Update puzzle screen XP if it exists
        const puzXp = document.getElementById('puzzle-current-xp');
        if (puzXp) puzXp.textContent = userData.xp;
    },

    openVillageScreen(village) {
        audioManager.play('click');
        this.currentVillage = village;
        
        // Populate Data
        this.elements.villageTitle.textContent = village.name;
        document.querySelector('.village-title-container p').textContent = `سورة ${village.surah}`;
        
        // Populate Data Progress State
        const vId = village.id;
        if (!this.challengeProgress[vId]) {
            this.challengeProgress[vId] = { listen: false, repeat: false, record: false, quiz: false };
        }
        const prog = this.challengeProgress[vId];

        // 1. Listen (Always unlocked)
        this.elements.btnChalListen.className = 'challenge-item unlocked' + (prog.listen ? ' completed' : '');
        this.elements.btnChalListen.querySelector('.chal-status').innerHTML = prog.listen ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-play"></i>';

        // 2. Repeat
        const repeatUnlocked = prog.listen;
        this.elements.btnChalRepeat.className = 'challenge-item ' + (repeatUnlocked ? 'unlocked' : 'locked') + (prog.repeat ? ' completed' : '');
        this.elements.btnChalRepeat.querySelector('.chal-status').innerHTML = prog.repeat ? '<i class="fa-solid fa-check"></i>' : (repeatUnlocked ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-lock"></i>');

        // 3. Record
        const recordUnlocked = prog.repeat;
        this.elements.btnChalRecord.className = 'challenge-item ' + (recordUnlocked ? 'unlocked' : 'locked') + (prog.record ? ' completed' : '');
        if (recordUnlocked && !prog.record) this.elements.btnChalRecord.classList.add('highlight'); // Add sparkle to current
        this.elements.btnChalRecord.querySelector('.chal-status').innerHTML = prog.record ? '<i class="fa-solid fa-check"></i>' : (recordUnlocked ? '<i class="fa-solid fa-microphone"></i>' : '<i class="fa-solid fa-lock"></i>');

        // 4. Quiz
        const quizUnlocked = prog.record;
        this.elements.btnChalQuiz.className = 'challenge-item ' + (quizUnlocked ? 'unlocked' : 'locked') + (prog.quiz ? ' completed' : '');
        this.elements.btnChalQuiz.querySelector('.chal-status').innerHTML = prog.quiz ? '<i class="fa-solid fa-check"></i>' : (quizUnlocked ? '<i class="fa-solid fa-puzzle-piece"></i>' : '<i class="fa-solid fa-lock"></i>');
        
        // Transition Details
        this.elements.villageScreen.classList.remove('hidden');
        
        // Animate slide in from right (RTL logic -> slide from left essentially, but visually right)
        gsap.fromTo(this.elements.villageScreen, 
            { x: '100%', opacity: 1 },
            { x: '0%', duration: 0.4, ease: "power2.out", onComplete: () => {
                this.elements.villageScreen.classList.add('active');
                
                // Animate challenge items pop in
                gsap.from('.challenge-item', {
                    y: 20,
                    opacity: 0,
                    duration: 0.4,
                    stagger: 0.1,
                    ease: "back.out(1.2)"
                });
            }}
        );
    },
    
    closeVillageScreen() {
        // Slide out
        gsap.to(this.elements.villageScreen, {
            x: '100%',
            duration: 0.4,
            ease: "power2.in",
            onComplete: () => {
                this.elements.villageScreen.classList.remove('active');
                this.elements.villageScreen.classList.add('hidden');
                this.elements.villageScreen.style.transform = 'none'; // reset
            }
        });
    },

    animateXP(oldXp, newXp) {
        // Calculate percentage (assuming 500 XP per level)
        const percent = (newXp % 500) / 500 * 100;
        
        gsap.to(this.elements.xpBar, {
            width: `${Math.min(percent, 100)}%`,
            duration: 1,
            ease: "power2.out"
        });

        // Animate number
        let rawObj = { val: oldXp };
        gsap.to(rawObj, {
            val: newXp,
            duration: 1,
            onUpdate: () => {
                const roundedVal = Math.floor(rawObj.val);
                this.elements.xpText.textContent = `${roundedVal} XP`;
                
                // Also update recitation screen XP if it's currently relevant
                const recXp = document.getElementById('recitation-current-xp');
                if (recXp) recXp.textContent = roundedVal;

                // Also update puzzle screen XP if it's currently relevant
                const puzXp = document.getElementById('puzzle-current-xp');
                if (puzXp) puzXp.textContent = roundedVal;
            }
        });
    },

    setupEventListeners() {
        // Path selection -> Go to Auth
        if (this.elements.btnKidsPath) {
            this.elements.btnKidsPath.addEventListener('click', () => {
                this.showAuthScreen();
            });
        }
        
        // Auth Submit -> Go to Main Map
        if (this.elements.btnLoginSubmit) {
            this.elements.btnLoginSubmit.addEventListener('click', () => {
                // Here we would normally validate inputs and call API
                // But for the prototype we just proceed:
                const emailInput = document.querySelector('.input-group input[type="email"]');
                const passwordInput = document.querySelector('.input-group input[type="password"]');
                
                // Simple empty check just for feel
                if(!emailInput.value && !passwordInput.value) {
                    // Small shake animation if empty
                    gsap.to('.auth-wrapper', { x: [-10, 10, -10, 10, 0], duration: 0.4 });
                    // Optional: auto fill to help reviewer
                    emailInput.value = "ahmed@kids.com";
                    passwordInput.value = "123456";
                    return;
                }
                
                this.startMainApp();
            });
        }
        
        // Village Screen Event Listeners
        if (this.elements.btnBackToMap) {
            this.elements.btnBackToMap.addEventListener('click', () => {
                audioManager.play('click');
                this.closeVillageScreen();
            });
        }
        
        // Challenge flow logic (Mock progression)
        
        // 1. Listen Challenge
        this.elements.btnChalListen.addEventListener('click', () => {
             audioManager.play('click');
             
             // Check if already completed
             if (this.elements.btnChalListen.classList.contains('completed')) {
                 // Even if completed, they can enter again to review 
                 window.listeningChallenge.initChallenge(this.currentVillage);
             } else {
                 // Open the interactive listening challenge UI
                 window.listeningChallenge.initChallenge(this.currentVillage);
             }
        });
        
        // 2. Repeat Challenge
        this.elements.btnChalRepeat.addEventListener('click', () => {
             if(this.elements.btnChalRepeat.classList.contains('locked')) return;
             
             audioManager.play('click');
             // Open the interactive repeat challenge UI
             window.repeatChallenge.initChallenge(this.currentVillage);
        });
        
        // 3. Record Challenge
        this.elements.btnChalRecord.addEventListener('click', () => {
             if(this.elements.btnChalRecord.classList.contains('locked')) return;
             
             audioManager.play('click');
             // Open the interactive recitation challenge UI
             window.recitationChallenge.initChallenge(this.currentVillage);
        });
        
        // 4. Quiz Challenge 
        this.elements.btnChalQuiz.addEventListener('click', () => {
             if(this.elements.btnChalQuiz.classList.contains('locked')) return;
             
             audioManager.play('click');
             // Open the interactive puzzle challenge UI
             window.puzzleChallenge.initChallenge(this.currentVillage);
        });

        this.elements.closePopupBtn.addEventListener('click', () => {
            audioManager.play('click');
            this.hideChallengePopup();
        });

        this.elements.recordBtn.addEventListener('click', () => {
            audioManager.play('click');
            this.startRecordingSimulation();
        });

        this.elements.continueBtn.addEventListener('click', () => {
            audioManager.play('click');
            this.hideSuccessOverlay();
        });
        
        // Add click sounds to nav items and handle Map visibility
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                audioManager.play('click');
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Show/Hide map based on tab
                const iconClass = item.querySelector('i').className;
                const gameContainer = document.getElementById('game-container');
                if (gameContainer) {
                    if (iconClass.includes('fa-map-location-dot')) {
                        gameContainer.style.display = 'block';
                        // Force resize to ensure map renders correctly after being hidden
                        if(mapEngine.game) window.dispatchEvent(new Event('resize'));
                    } else {
                        gameContainer.style.display = 'none';
                    }
                }
            });
        });
    },

    completeListenChallenge() {
        console.log("Completing Listen Challenge..."); // Debug
        
        // Save Progress
        if (this.currentVillage) {
            if (!this.challengeProgress[this.currentVillage.id]) {
                this.challengeProgress[this.currentVillage.id] = { listen: false, repeat: false, record: false, quiz: false };
            }
            this.challengeProgress[this.currentVillage.id].listen = true;
        }

        // Mark Listen as completed
        const listenBtn = document.getElementById('btn-chal-listen');
        if (listenBtn) {
            listenBtn.classList.add('completed');
            listenBtn.classList.add('unlocked'); // Ensure it stays visible
            const statusIcon = listenBtn.querySelector('.chal-status');
            if (statusIcon) statusIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
        }
        
        // Unlock Repeat if it's currently locked
        const repeatBtn = document.getElementById('btn-chal-repeat');
        if(repeatBtn && repeatBtn.classList.contains('locked')) {
            repeatBtn.classList.remove('locked');
            repeatBtn.classList.add('unlocked');
            const repeatStatus = repeatBtn.querySelector('.chal-status');
            if (repeatStatus) repeatStatus.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    },

    completeRepeatChallenge() {
        console.log("Completing Repeat Challenge..."); // Debug
        
        // Save Progress
        if (this.currentVillage) {
            if (!this.challengeProgress[this.currentVillage.id]) {
                this.challengeProgress[this.currentVillage.id] = { listen: false, repeat: false, record: false, quiz: false };
            }
            this.challengeProgress[this.currentVillage.id].repeat = true;
        }

        // Mark Repeat as completed
        const repeatBtn = document.getElementById('btn-chal-repeat');
        if (repeatBtn) {
            repeatBtn.classList.add('completed');
            const statusIcon = repeatBtn.querySelector('.chal-status');
            if (statusIcon) statusIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
        }
        
        // Unlock Record if it's currently locked
        const recordBtn = document.getElementById('btn-chal-record');
        if(recordBtn && recordBtn.classList.contains('locked')) {
            recordBtn.classList.remove('locked');
            recordBtn.classList.add('unlocked');
            recordBtn.classList.add('highlight');
            const recordStatus = recordBtn.querySelector('.chal-status');
            if (recordStatus) recordStatus.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        }
    },

    completeRecitationChallenge() {
        console.log("Completing Recitation Challenge..."); // Debug
        
        // Save Progress
        if (this.currentVillage) {
            if (!this.challengeProgress[this.currentVillage.id]) {
                this.challengeProgress[this.currentVillage.id] = { listen: false, repeat: false, record: false, quiz: false };
            }
            this.challengeProgress[this.currentVillage.id].record = true;
        }

        // Mark Record as completed
        const recordBtn = document.getElementById('btn-chal-record');
        if (recordBtn) {
            recordBtn.classList.add('completed');
            recordBtn.classList.remove('highlight');
            const statusIcon = recordBtn.querySelector('.chal-status');
            if (statusIcon) statusIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
        }
        
        // Unlock Quiz
        const quizBtn = document.getElementById('btn-chal-quiz');
        if(quizBtn && quizBtn.classList.contains('locked')) {
            quizBtn.classList.remove('locked');
            quizBtn.classList.add('unlocked');
            const quizStatus = quizBtn.querySelector('.chal-status');
            if (quizStatus) quizStatus.innerHTML = '<i class="fa-solid fa-puzzle-piece"></i>';
        }

        // Village Logic: If all core challenges done, show final success
        this.showFeedbackAndSuccess();
    },

    completePuzzleChallenge() {
        console.log("Completing Puzzle Challenge..."); // Debug
        
        // Save Progress
        if (this.currentVillage) {
            if (!this.challengeProgress[this.currentVillage.id]) {
                this.challengeProgress[this.currentVillage.id] = { listen: false, repeat: false, record: false, quiz: false };
            }
            this.challengeProgress[this.currentVillage.id].quiz = true;
        }

        // Mark Quiz as completed
        const quizBtn = document.getElementById('btn-chal-quiz');
        if (quizBtn) {
            quizBtn.classList.add('completed');
            const statusIcon = quizBtn.querySelector('.chal-status');
            if (statusIcon) statusIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
        }
        
        // Award massive XP for finishing the village
        const xpEl = document.getElementById('xp-text');
        if (xpEl && this.animateXP) {
             const currentXp = parseInt(xpEl.textContent);
             this.animateXP(currentXp, currentXp + 100); 
        }

        // Final Village Celebration
        this.showFeedbackAndSuccess();
    },

    showChallengePopup(village) {
        this.elements.popupSurahName.textContent = `سورة ${village.surah}`;
        this.elements.challengePopup.classList.add('active');
        this.elements.feedbackContainer.classList.add('hidden');
        
        // Reset recording animation
        document.getElementById('recording-waves').classList.add('hidden');
        
        // Remove old classes from recording button (in case it was active earlier)
        const btn = this.elements.recordBtn;
        btn.classList.remove('recording');
        btn.innerHTML = '<i class="fa-solid fa-microphone"></i><span>إبدأ التسجيل</span>';
        btn.style.background = ''; // reset gradient

        // GSAP entrance animation
        gsap.fromTo(this.elements.challengePopup.querySelector('.popup-content'), 
            { scale: 0.5, opacity: 0 }, 
            { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.5)" }
        );
    },

    hideChallengePopup() {
        gsap.to(this.elements.challengePopup.querySelector('.popup-content'), {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                this.elements.challengePopup.classList.remove('active');
            }
        });
    },

    startRecordingSimulation() {
        const btn = this.elements.recordBtn;
        btn.classList.add('recording');
        btn.innerHTML = '<i class="fa-solid fa-stop"></i><span>جاري الاستماع للآية...</span>';
        btn.style.background = 'linear-gradient(135deg, #F44336, #E57373)';
        
        // Show audio waves layout.css animation
        document.getElementById('recording-waves').classList.remove('hidden');
        
        gsap.from('.wave', { scaleY: 0.1, duration: 0.3, stagger: 0.1 });
        
        // Simulate AI Processing (2 seconds delay)
        setTimeout(() => {
            btn.classList.remove('recording');
            btn.innerHTML = '<i class="fa-solid fa-check"></i><span>تم التقييم بنجاح</span>';
            btn.style.background = 'linear-gradient(135deg, #4CAF50, #8BC34A)';
            
            document.getElementById('recording-waves').classList.add('hidden');
            
            // Mark Record challenge as completed in our Village Hub
            this.elements.btnChalRecord.classList.add('completed');
            this.elements.btnChalRecord.querySelector('.chal-status').innerHTML = '<i class="fa-solid fa-check"></i>';
            
            // Save Progress
            if (this.currentVillage) this.challengeProgress[this.currentVillage.id].record = true;

            // Unlock Quiz
            this.elements.btnChalQuiz.classList.remove('locked');
            this.elements.btnChalQuiz.classList.add('unlocked');
            this.elements.btnChalQuiz.querySelector('.chal-status').innerHTML = '<i class="fa-solid fa-puzzle-piece"></i>';
            
            this.showFeedbackAndSuccess();
        }, 2500);
    },

    showFeedbackAndSuccess() {
        // Show inline feedback
        const feedback = this.elements.feedbackContainer;
        feedback.classList.remove('hidden');
        
        // Highlight green
        gsap.from(feedback, { y: 20, opacity: 0, duration: 0.5 });
        audioManager.play('success');

        // Wait a bit, then show full screen success overlay
        setTimeout(() => {
            this.hideChallengePopup();
            
            setTimeout(() => {
                this.elements.successOverlay.classList.add('active');
                
                // Animate stars
                gsap.fromTo('.success-stars i', 
                    { scale: 0, rotation: -180 }, 
                    { scale: 1, rotation: 0, duration: 0.6, stagger: 0.2, ease: "back.out(2)" }
                );
                
                gsap.fromTo('.success-title',
                    { y: -30, opacity: 0 },
                    { y: 0, opacity: 1, delay: 0.6, duration: 0.5 }
                );
                
                // Add XP (Simulated +50)
                const currentXp = parseInt(this.elements.xpText.textContent);
                this.animateXP(currentXp, currentXp + 50);
                
                // (Optional) Here we would call API to genuinely update XP in the backend
                // api.updateUserProgress(50);
                
            }, 300);
        }, 1500);
    },
    
    hideSuccessOverlay() {
        gsap.to(this.elements.successOverlay, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => this.elements.successOverlay.classList.remove('active')
        });
    }
};

// Global Exposure
window.ui = ui;
