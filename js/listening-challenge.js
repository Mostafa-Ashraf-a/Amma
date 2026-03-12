class ListeningChallenge {
    constructor() {
        this.elements = {
            screen: document.getElementById('listening-challenge-screen'),
            backBtn: document.getElementById('listen-back-btn'),
            surahName: document.getElementById('listen-surah-name'),
            progressBar: document.getElementById('listen-progress'),
            ayahDisplay: document.getElementById('ayah-display'),
            btnPlayPause: document.getElementById('btn-play-pause'),
            btnReplay: document.getElementById('btn-replay'),
            btnSlow: document.getElementById('btn-slow'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            confettiCanvas: document.getElementById('confetti-canvas')
        };
        
        this.audioData = null;
        this.howlerSound = null;
        this.isPlaying = false;
        this.isSlow = false;
        this.syncInterval = null;
        this.currentAyahIndex = 0; // Track which ayah is shown
        this.currentWordGlobalIndex = -1; // Track active word for highlighting
        this.hasCompleted = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.elements.backBtn.addEventListener('click', () => this.handleBack());
        
        this.elements.btnPlayPause.addEventListener('click', () => this.togglePlay());
        
        this.elements.btnReplay.addEventListener('click', () => {
            if (this.howlerSound) {
                this.howlerSound.seek(0);
                this.howlerSound.play();
                this.isPlaying = true;
                this.updatePlayBtnUI();
            }
        });
        
        this.elements.btnSlow.addEventListener('click', () => {
            if (this.howlerSound) {
                this.isSlow = !this.isSlow;
                this.howlerSound.rate(this.isSlow ? 0.75 : 1.0);
                this.elements.btnSlow.classList.toggle('active', this.isSlow);
                audioManager.play('click');
            }
        });

        this.elements.btnNext.addEventListener('click', () => this.navigateAyah(1));
        this.elements.btnPrev.addEventListener('click', () => this.navigateAyah(-1));
    }
    
    async initChallenge(village) {
        this.elements.surahName.textContent = `سورة ${village.surah}`;
        this.resetState();
        
        // Show screen
        document.getElementById('village-screen').classList.add('hidden');
        document.querySelector('.bottom-nav')?.classList.add('hidden');
        document.querySelector('.top-navbar')?.classList.add('hidden');
        this.elements.screen.classList.remove('hidden');
        gsap.fromTo(this.elements.screen, {y: '100%'}, {y: '0%', duration: 0.5, ease: "power3.out"});
        
        // Load data
        try {
            console.log("ListeningChallenge: Fetching sync data...");
            this.elements.ayahDisplay.innerHTML = '<div class="loading-text">جاري تحميل الآيات...</div>';
            
            // Using relative path to support subdirectory hosting (e.g. GitHub Pages)
            const req = await fetch('quran-sync.json');
            if (!req.ok) throw new Error(`HTTP error! status: ${req.status}`);
            
            this.audioData = await req.json();
            console.log("ListeningChallenge: Data loaded successfully", this.audioData);
            
            this.renderAyah();
            this.initAudio();
        } catch(e) {
            console.error("Failed to load sync data", e);
            this.elements.ayahDisplay.innerHTML = `
                <div style="color: #f44336; padding: 20px; text-align: center;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>عذراً يا بطل، حدث خطأ في تحميل الآيات!</p>
                    <small style="display:block; margin-top:5px; opacity:0.7;">${e.message}</small>
                    <button onclick="location.reload()" style="margin-top:15px; padding: 8px 15px; border-radius: 20px; border:none; background:#ff9800; color:white; font-family:inherit; cursor:pointer;">إعادة المحاولة</button>
                </div>
            `;
        }
    }
    
    resetState() {
        if(this.howlerSound) {
            this.howlerSound.stop();
            this.howlerSound.unload();
        }
        clearInterval(this.syncInterval);
        this.isPlaying = false;
        this.isSlow = false;
        this.currentAyahIndex = 0;
        this.currentWordGlobalIndex = -1;
        this.hasCompleted = false;
        this.elements.progressBar.style.width = '0%';
        this.elements.btnSlow.classList.remove('active');
        this.updatePlayBtnUI();
        this.elements.confettiCanvas?.classList.add('hidden');
    }
    
    renderAyah() {
        const ayah = this.audioData.ayahs[this.currentAyahIndex];
        if (!ayah) return;

        this.elements.ayahDisplay.innerHTML = '';
        ayah.words.forEach((w, i) => {
            const span = document.createElement('span');
            span.className = 'word';
            span.id = `word-a${this.currentAyahIndex}-w${i}`;
            span.textContent = w.text;
            this.elements.ayahDisplay.appendChild(span);
        });
        
        // Animating ayah entrance
        gsap.fromTo('.word', 
            { opacity: 0, x: 20 }, 
            { opacity: 1, x: 0, stagger: 0.1, duration: 0.4, ease: "back.out(1.2)" }
        );
    }
    
    initAudio() {
        this.howlerSound = new Howl({
            src: [this.audioData.audio_url],
            html5: true,
            onload: () => console.log('Audio Loaded'),
            onend: () => this.handleAudioCompletion()
        });
    }
    
    togglePlay() {
        if(!this.howlerSound) return;
        
        if(this.isPlaying) {
            this.howlerSound.pause();
            clearInterval(this.syncInterval);
        } else {
            this.howlerSound.play();
            this.startSyncLoop();
        }
        this.isPlaying = !this.isPlaying;
        this.updatePlayBtnUI();
    }
    
    updatePlayBtnUI() {
        this.elements.btnPlayPause.innerHTML = this.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    }
    
    startSyncLoop() {
        clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => {
            if(!this.howlerSound || !this.isPlaying) return;
            
            let currentTime = this.howlerSound.seek();
            
            // Update progress bar
            let progress = (currentTime / this.audioData.duration) * 100;
            this.elements.progressBar.style.width = `${progress}%`;
            
            // Determine which ayah and word we are in
            let foundAyahIdx = -1;
            let foundWordIdx = -1;

            this.audioData.ayahs.forEach((ayah, aIdx) => {
                ayah.words.forEach((word, wIdx) => {
                    if (currentTime >= word.start && currentTime <= word.end) {
                        foundAyahIdx = aIdx;
                        foundWordIdx = wIdx;
                    }
                });
            });

            // If we moved to a new ayah, re-render
            if (foundAyahIdx !== -1 && foundAyahIdx !== this.currentAyahIndex) {
                this.currentAyahIndex = foundAyahIdx;
                this.renderAyah();
            }

            // Sync word highlighting
            const globalWordId = foundAyahIdx !== -1 ? `word-a${foundAyahIdx}-w${foundWordIdx}` : null;
            if (globalWordId !== this.currentWordGlobalIndex) {
                // Clear old highlight
                if (this.currentWordGlobalIndex) {
                    const oldEl = document.getElementById(this.currentWordGlobalIndex);
                    if (oldEl) oldEl.classList.remove('active');
                }
                // Set new highlight
                if (globalWordId) {
                    const newEl = document.getElementById(globalWordId);
                    if (newEl) newEl.classList.add('active');
                }
                this.currentWordGlobalIndex = globalWordId;
            }
        }, 50); // 50ms check
    }

    navigateAyah(direction) {
        if (!this.audioData) return;
        audioManager.play('click');

        let nextIdx = this.currentAyahIndex + direction;
        if (nextIdx >= 0 && nextIdx < this.audioData.ayahs.length) {
            const targetAyah = this.audioData.ayahs[nextIdx];
            const startTime = targetAyah.words[0].start;
            
            if (this.howlerSound) {
                this.howlerSound.seek(startTime);
                // If paused, keep paused but update UI
                if (!this.isPlaying) {
                    this.currentAyahIndex = nextIdx;
                    this.renderAyah();
                    // Manually set progress bar
                    let progress = (startTime / this.audioData.duration) * 100;
                    this.elements.progressBar.style.width = `${progress}%`;
                }
            }
        }
    }
    
    handleAudioCompletion() {
        this.isPlaying = false;
        this.updatePlayBtnUI();
        clearInterval(this.syncInterval);
        this.elements.progressBar.style.width = '100%';
        this.hasCompleted = true;
        
        // Remove active class from last word
        if (this.currentWordGlobalIndex) {
            document.getElementById(this.currentWordGlobalIndex)?.classList.remove('active');
        }
        
        this.showSuccess();
    }
    
    showSuccess() {
        audioManager.play('success');
        
        // Use confetti logic (assuming external library or simple mock)
        this.throwConfetti();
        
        // Reward logic
        console.log("Listening Challenge showSuccess: triggering reward...");
        if(typeof ui !== 'undefined') {
            console.log("ui object found, calling completeListenChallenge...");
            ui.completeListenChallenge();
            
            const xpEl = document.getElementById('xp-text');
            if (xpEl && ui.animateXP) {
                 const currentXp = parseInt(xpEl.textContent);
                 ui.animateXP(currentXp, currentXp + 20); 
            }
        } else {
            console.error("ui object NOT found in ListeningChallenge.showSuccess!");
        }
        
        setTimeout(() => {
            this.handleBack();
        }, 3000);
    }
    
    throwConfetti() {
        // Simple confetti simulation or placeholder if no library loaded
        this.elements.confettiCanvas.classList.remove('hidden');
        // Actually rendering confetti requires canvas 2D context drawing loop
        // Will rely on a simple popup/animation for now instead of full canvas rendering to save time
        const div = document.createElement('div');
        div.innerHTML = "🎉 أحسنت يا بطل! 🎉";
        div.style.position = 'absolute';
        div.style.top = '50%';
        div.style.left = '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.fontSize = '3rem';
        div.style.color = '#FFD700';
        div.style.textShadow = '0 4px 10px rgba(0,0,0,0.2)';
        div.style.zIndex = '100';
        this.elements.screen.appendChild(div);
        
        gsap.fromTo(div, {scale: 0}, {scale: 1.2, duration: 0.5, yoyo: true, repeat: 3});
        setTimeout(() => div.remove(), 2500);
    }
    
    handleBack() {
        if(!this.hasCompleted && this.isPlaying) {
            // Warn user
            alert("انتظر يا بطل! المكافأة في انتظارك عند انتهاء التلاوة");
            return;
        }
        
        this.resetState();
        document.querySelector('.bottom-nav')?.classList.remove('hidden');
        document.querySelector('.top-navbar')?.classList.remove('hidden');
        gsap.to(this.elements.screen, {
            y: '100%', 
            duration: 0.4, 
            ease: "power2.in", 
            onComplete: () => {
                this.elements.screen.classList.add('hidden');
                document.getElementById('village-screen').classList.remove('hidden');
            }
        });
    }
}

// Instantiate and expose globally
window.listeningChallenge = new ListeningChallenge();
