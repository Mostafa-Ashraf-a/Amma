/**
 * Repeat Challenge Module (Echo Challenge)
 * Features: Auto-pilot mode, Voice sensing visualization, Mascot feedback.
 */
class RepeatChallenge {
    constructor() {
        this.currentVillage = null;
        this.currentAyahIndex = 0;
        this.ayahs = [];
        this.sound = null;
        this.isSensing = false;
        
        // Web Audio API for Voice Sensing
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.animationId = null;

        this.elements = {
            screen: document.getElementById('repeat-challenge-screen'),
            surahName: document.getElementById('repeat-surah-name'),
            progressBar: document.getElementById('repeat-progress'),
            ayahDisplay: document.getElementById('repeat-ayah-display'),
            mascot: document.getElementById('repeat-mascot'),
            mascotBubble: document.getElementById('repeat-bubble'),
            mascotImg: document.getElementById('mascot-img'),
            micIndicator: document.getElementById('mic-indicator'),
            micStatusText: document.getElementById('mic-status-text'),
            btnBack: document.getElementById('repeat-back-btn'),
            btnPrev: document.getElementById('btn-repeat-prev'),
            btnNext: document.getElementById('btn-repeat-next'),
            btnPlayPause: document.getElementById('btn-repeat-play-pause')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.elements.btnBack.addEventListener('click', () => this.handleBack());
        this.elements.btnPrev.addEventListener('click', () => this.jumpToPrev());
        this.elements.btnNext.addEventListener('click', () => this.jumpToNext());
    }

    async initChallenge(village) {
        this.currentVillage = village;
        this.elements.surahName.textContent = `سورة ${village.surah}`;
        this.currentAyahIndex = 0;
        
        // Reset Progress Bar
        gsap.set(this.elements.progressBar, { width: '0%' });
        
        // Show screen
        document.getElementById('village-screen').classList.add('hidden');
        document.querySelector('.bottom-nav')?.classList.add('hidden');
        document.querySelector('.top-navbar')?.classList.add('hidden');
        this.elements.screen.classList.remove('hidden');
        gsap.fromTo(this.elements.screen, {y: '100%'}, {y: '0%', duration: 0.5, ease: "power3.out"});

        try {
            console.log("RepeatChallenge: Fetching sync data...");
            const response = await fetch('/quran-sync.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            this.ayahs = data.ayahs;
            
            // Initialize Howler
            if (this.sound) this.sound.unload();
            this.sound = new Howl({
                src: [data.audio_url],
                html5: true,
                onend: () => this.handleAyahAudioEnd()
            });

            this.startCycle();
        } catch (error) {
            console.error("Error loading challenge data:", error);
        }
    }

    startCycle() {
        this.playAyah(this.currentAyahIndex);
    }

    playAyah(index) {
        if (index >= this.ayahs.length) {
            this.showSuccess();
            return;
        }

        const ayah = this.ayahs[index];
        this.renderAyah(ayah.text);
        this.updateProgress();

        // UI State: Listening
        this.setMascotState('listening');
        this.elements.ayahDisplay.className = 'ayah-card echo-listen';
        this.elements.micIndicator.classList.remove('active');
        this.elements.micStatusText.textContent = "استمع جيداً 🎧";

        // Play Audio Sprite (Segment)
        // We calculate the start time of the first word and end time of last word
        const start = ayah.words[0].start * 1000;
        const duration = (ayah.words[ayah.words.length - 1].end * 1000) - start;
        
        this.sound.stop();
        this.sound.seek(start / 1000);
        this.sound.play();

        // Autostop after ayah duration (since Howler doesn't have native sprites here easily)
        clearTimeout(this.stopTimeout);
        this.stopTimeout = setTimeout(() => {
            this.sound.pause();
            this.handleAyahAudioEnd();
        }, duration);
    }

    handleAyahAudioEnd() {
        clearTimeout(this.stopTimeout);
        // Transition to Speak/Repeat Mode
        this.startRepeatSession();
    }

    async startRepeatSession() {
        // UI State: Speaking
        this.setMascotState('speaking');
        this.elements.ayahDisplay.className = 'ayah-card echo-speak';
        this.elements.micIndicator.classList.add('active');
        this.elements.micStatusText.textContent = "دورك يا بطل! ردد معي 🎤";

        // Start Voice Sensing
        this.initVoiceSensing();

        // Delay before moving to next (Ayah duration + 1s buffer)
        const currentAyah = this.ayahs[this.currentAyahIndex];
        const repeatTime = (currentAyah.words[currentAyah.words.length - 1].end - currentAyah.words[0].start) * 1000 + 1500;

        setTimeout(() => {
            this.stopVoiceSensing();
            this.currentAyahIndex++;
            this.startCycle();
        }, repeatTime);
    }

    renderAyah(text) {
        this.elements.ayahDisplay.innerHTML = `<div class="word">${text}</div>`;
        gsap.from(this.elements.ayahDisplay.firstChild, {
            scale: 0.9,
            opacity: 0,
            duration: 0.4
        });
    }

    setMascotState(state) {
        if (state === 'listening') {
            this.elements.mascot.classList.remove('mascot-speaking');
            this.elements.mascotImg.src = "https://api.dicebear.com/7.x/bottts/svg?seed=Listen";
            this.elements.mascotBubble.textContent = "استمع جيداً 🎧";
        } else {
            this.elements.mascot.classList.add('mascot-speaking');
            this.elements.mascotImg.src = "https://api.dicebear.com/7.x/bottts/svg?seed=Teacher";
            this.elements.mascotBubble.textContent = "دورك يا بطل! ردد معي 🎤";
        }
    }

    updateProgress() {
        const percent = ((this.currentAyahIndex) / this.ayahs.length) * 100;
        gsap.to(this.elements.progressBar, { width: `${percent}%`, duration: 0.5 });
    }

    async initVoiceSensing() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
                
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.microphone = this.audioContext.createMediaStreamSource(stream);
                this.microphone.connect(this.analyser);
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            }

            this.isSensing = true;
            this.visualizeVoice();
        } catch (err) {
            console.warn("Microphone access denied or error:", err);
            this.micSimulation(); // Fallback if mic not available
        }
    }

    visualizeVoice() {
        if (!this.isSensing) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        let average = sum / this.dataArray.length;
        
        // Scale mic based on volume
        let scale = 1 + (average / 128); 
        gsap.set(this.elements.micIndicator, { scale: scale });

        this.animationId = requestAnimationFrame(() => this.visualizeVoice());
    }

    micSimulation() {
        // Just animate pulsing if mic is blocked
        gsap.to(this.elements.micIndicator, {
            scale: 1.2,
            duration: 0.4,
            repeat: -1,
            yoyo: true
        });
    }

    stopVoiceSensing() {
        this.isSensing = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        gsap.to(this.elements.micIndicator, { scale: 1, duration: 0.3 });
    }

    jumpToNext() {
        this.stopVoiceSensing();
        this.currentAyahIndex++;
        this.startCycle();
    }

    jumpToPrev() {
        this.stopVoiceSensing();
        this.currentAyahIndex = Math.max(0, this.currentAyahIndex - 1);
        this.startCycle();
    }

    showSuccess() {
        audioManager.play('success');
        this.elements.micStatusText.textContent = "أحسنت! سورة رائعة 🌟";
        
        if (typeof ui !== 'undefined') {
            ui.completeRepeatChallenge();
            
            const xpEl = document.getElementById('xp-text');
            if (xpEl && ui.animateXP) {
                 const currentXp = parseInt(xpEl.textContent);
                 ui.animateXP(currentXp, currentXp + 30); 
            }
        }

        setTimeout(() => {
            this.handleBack();
        }, 2000);
    }

    handleBack() {
        if (this.sound) this.sound.stop();
        this.stopVoiceSensing();
        clearTimeout(this.stopTimeout);
        
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

// Global instance
window.repeatChallenge = new RepeatChallenge();
