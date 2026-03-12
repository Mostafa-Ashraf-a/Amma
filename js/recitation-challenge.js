class RecitationChallenge {
    constructor() {
        this.currentVillage = null;
        this.currentAyahIndex = 0;
        this.currentWordIndex = 0;
        this.ayahs = [];
        this.isRecording = false;
        this.isTextHidden = false;
        this.simulationTimer = null;
        
        this.elements = {
            screen: document.getElementById('recitation-challenge-screen'),
            surahName: document.getElementById('recitation-surah-name'),
            progressBar: document.getElementById('recitation-progress'),
            currentXp: document.getElementById('recitation-current-xp'),
            ayahDisplay: document.getElementById('recitation-ayah-display'),
            mascotBubble: document.getElementById('recitation-bubble'),
            mascotImg: document.getElementById('recitation-mascot-img'),
            mainMicBtn: document.getElementById('btn-main-mic'),
            statusText: document.getElementById('recitation-status-text'),
            waves: document.getElementById('recitation-waves'),
            toggleTextBtn: document.getElementById('btn-toggle-text'),
            backBtn: document.getElementById('recitation-back-btn'),
            feedbackPanel: document.getElementById('recitation-feedback-panel'),
            accuracyValue: document.getElementById('accuracy-value'),
            feedbackStars: document.getElementById('feedback-stars')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.elements.backBtn.addEventListener('click', () => this.handleBack());
        this.elements.toggleTextBtn.addEventListener('click', () => this.toggleTextVisibility());
        this.elements.mainMicBtn.addEventListener('click', () => this.toggleRecording());
    }

    async initChallenge(village) {
        this.currentVillage = village;
        this.elements.surahName.textContent = `سورة ${village.surah}`;
        this.currentAyahIndex = 0;
        this.currentWordIndex = 0;
        this.isTextHidden = false;
        this.elements.ayahDisplay.classList.remove('text-hidden');
        this.elements.toggleTextBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';

        // Show screen
        document.getElementById('village-screen').classList.add('hidden');
        document.querySelector('.bottom-nav')?.classList.add('hidden');
        document.querySelector('.top-navbar')?.classList.add('hidden');
        this.elements.screen.classList.remove('hidden');
        gsap.fromTo(this.elements.screen, {y: '100%'}, {y: '0%', duration: 0.5, ease: "power3.out"});

        // Reset UI
        this.elements.feedbackPanel.classList.add('hidden');
        this.elements.statusText.textContent = "اضغط للتسميع";
        this.elements.mainMicBtn.className = "giant-mic-btn";
        this.elements.mainMicBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';

        try {
            const response = await fetch('quran-sync.json');
            const data = await response.json();
            this.ayahs = data.ayahs;
            this.loadAyah(0);
        } catch (error) {
            console.error("Error loading recitation data:", error);
        }
    }

    loadAyah(index) {
        if (index >= this.ayahs.length) {
            this.finalizeChallenge();
            return;
        }

        const ayah = this.ayahs[index];
        this.currentWordIndex = 0;
        this.renderAyah(ayah);
        this.updateProgress();
        this.elements.feedbackPanel.classList.add('hidden');
        this.updateActiveWord();
    }

    renderAyah(ayah) {
        // Clear board
        this.elements.ayahDisplay.innerHTML = '';
        
        // Add words as hidden placeholders
        ayah.words.forEach((word, idx) => {
            const span = document.createElement('span');
            span.className = 'word hidden-word';
            span.textContent = word.text;
            span.id = `word-${idx}`;
            this.elements.ayahDisplay.appendChild(span);
        });
        
        // Add the toggle button
        this.elements.ayahDisplay.appendChild(this.elements.toggleTextBtn);
        
        gsap.from('.word', {
            y: 10,
            opacity: 0,
            duration: 0.4,
            stagger: 0.05
        });
    }

    updateActiveWord() {
        // Clear all active pulses
        document.querySelectorAll('.word').forEach(el => el.classList.remove('active-pulse'));
        
        const currentAyah = this.ayahs[this.currentAyahIndex];
        if (!currentAyah || this.currentWordIndex >= currentAyah.words.length) return;

        const activeEl = document.getElementById(`word-${this.currentWordIndex}`);
        if (activeEl) {
            activeEl.classList.add('active-pulse');
        }
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        this.isRecording = true;
        this.elements.mainMicBtn.classList.add('recording');
        this.elements.waves.classList.remove('hidden');
        this.elements.statusText.textContent = "جاري الاستماع إليك...";
        this.elements.mascotBubble.textContent = "أبدعت يا بطل! سمّع الكلمة المظللة.";
        audioManager.play('click');
        
        this.startRealTimeSimulation();
    }

    stopRecording() {
        this.isRecording = false;
        this.elements.mainMicBtn.classList.remove('recording');
        this.elements.waves.classList.add('hidden');
        clearTimeout(this.simulationTimer);
        this.elements.statusText.textContent = "توقف التسميع";
    }

    startRealTimeSimulation() {
        // Simulate revealing a word every bit
        const delay = 1200 + Math.random() * 800;
        
        this.simulationTimer = setTimeout(() => {
            if (!this.isRecording) return;

            // Success probability
            const rand = Math.random();
            if (rand > 0.12) {
                this.revealNextWord();
            } else {
                this.handleSimulatedError();
            }
        }, delay);
    }

    revealNextWord() {
        const wordEl = document.getElementById(`word-${this.currentWordIndex}`);
        if (wordEl) {
            wordEl.classList.remove('hidden-word', 'active-pulse');
            wordEl.classList.add('word-green');
            gsap.from(wordEl, { scale: 1.4, duration: 0.3, ease: "back.out" });
            audioManager.play('pop');
        }

        this.currentWordIndex++;
        const currentAyah = this.ayahs[this.currentAyahIndex];
        
        if (this.currentWordIndex < currentAyah.words.length) {
            this.updateActiveWord();
            this.startRealTimeSimulation();
        } else {
            this.handleAyahCompletion();
        }
    }

    handleSimulatedError() {
        this.stopRecording();
        
        // Shake the card (needs class in CSS we added)
        const displayCard = this.elements.ayahDisplay;
        displayCard.classList.add('error-shake');
        audioManager.play('error');
        
        this.elements.mascotBubble.textContent = "اقتربت يا بطل! لنعد هذه الآية من البداية لتثبيتها 🔄";
        this.elements.statusText.textContent = "أعد المحاولة من أول الآية";

        setTimeout(() => {
            displayCard.classList.remove('error-shake');
            // Restart current ayah
            this.loadAyah(this.currentAyahIndex);
        }, 1200);
    }

    handleAyahCompletion() {
        this.stopRecording();
        audioManager.play('success');
        this.elements.mascotBubble.textContent = "أحسنت التسميع! آية تلو آية تكتمل السورة 🌟";
        
        setTimeout(() => {
            this.currentAyahIndex++;
            this.loadAyah(this.currentAyahIndex);
        }, 2000);
    }

    toggleTextVisibility() {
        this.isTextHidden = !this.isTextHidden;
        if (this.isTextHidden) {
            this.elements.toggleTextBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            document.querySelectorAll('.word.hidden-word').forEach(w => w.style.color = '#555');
        } else {
            this.elements.toggleTextBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
            document.querySelectorAll('.word.hidden-word').forEach(w => w.style.color = 'transparent');
        }
    }

    finalizeChallenge() {
        this.elements.mascotBubble.textContent = "مذهل! لقد أتممت التسميع الكامل للسورة 🥇";
        if (typeof ui !== 'undefined') {
            ui.completeRecitationChallenge();
        }
        
        setTimeout(() => {
            this.handleBack();
        }, 2500);
    }

    updateProgress() {
        const percent = (this.currentAyahIndex / this.ayahs.length) * 100;
        gsap.to(this.elements.progressBar, { width: `${percent}%`, duration: 0.5 });
    }

    handleBack() {
        this.stopRecording();
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

window.recitationChallenge = new RecitationChallenge();
