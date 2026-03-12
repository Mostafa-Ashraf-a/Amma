/**
 * Puzzle Challenge Module (Drag & Drop)
 * Features: Word scrambling, Drag & Drop validation, Hint & Listen power-ups.
 */
class PuzzleChallenge {
    constructor() {
        this.currentVillage = null;
        this.currentAyahIndex = 0;
        this.ayahs = [];
        this.correctOrder = [];
        this.placedWords = [];
        this.sound = null;
        
        this.elements = {
            screen: document.getElementById('puzzle-challenge-screen'),
            surahName: document.getElementById('puzzle-surah-name'),
            progressBar: document.getElementById('puzzle-progress'),
            ayahBoard: document.getElementById('drop-zones-container'),
            wordsPool: document.getElementById('puzzle-words-pool'),
            mascotBubble: document.getElementById('puzzle-bubble'),
            backBtn: document.getElementById('puzzle-back-btn'),
            btnHint: document.getElementById('btn-puzzle-hint'),
            btnListen: document.getElementById('btn-puzzle-listen')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.elements.backBtn.addEventListener('click', () => this.handleBack());
        this.elements.btnHint.addEventListener('click', () => this.giveHint());
        this.elements.btnListen.addEventListener('click', () => this.playAyahAudio());
    }

    async initChallenge(village) {
        this.currentVillage = village;
        this.elements.surahName.textContent = `سورة ${village.surah}`;
        this.currentAyahIndex = 0;

        // Show screen
        document.getElementById('village-screen').classList.add('hidden');
        document.querySelector('.bottom-nav')?.classList.add('hidden');
        document.querySelector('.top-navbar')?.classList.add('hidden');
        this.elements.screen.classList.remove('hidden');
        gsap.fromTo(this.elements.screen, {y: '100%'}, {y: '0%', duration: 0.5, ease: "power3.out"});

        try {
            console.log("PuzzleChallenge: Fetching sync data...");
            const response = await fetch('quran-sync.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("خطأ في ملف البيانات.");
            }

            const data = await response.json();
            this.ayahs = data.ayahs;
            
            // Initialize audio for "Listen" button
            if (this.sound) this.sound.unload();
            this.sound = new Howl({
                src: [data.audio_url],
                html5: true
            });

            this.loadAyah(0);
        } catch (error) {
            console.error("Error loading puzzle data:", error);
        }
    }

    loadAyah(index) {
        if (index >= this.ayahs.length) {
            this.showFinalSuccess();
            return;
        }

        const ayah = this.ayahs[index];
        this.correctOrder = ayah.words.map(w => w.text);
        this.placedWords = new Array(this.correctOrder.length).fill(null);
        
        this.renderBoard();
        this.renderPool();
        this.updateProgress();
    }

    renderBoard() {
        this.elements.ayahBoard.innerHTML = '';
        this.correctOrder.forEach((_, i) => {
            const zone = document.createElement('div');
            zone.className = 'drop-zone';
            zone.dataset.index = i;
            zone.innerHTML = `<span class="placeholder-text">${i + 1}</span>`;
            
            // Native Drag & Drop Listeners
            zone.addEventListener('dragover', (e) => e.preventDefault());
            zone.addEventListener('drop', (e) => this.handleDrop(e, i));
            
            this.elements.ayahBoard.appendChild(zone);
        });
    }

    renderPool() {
        this.elements.wordsPool.innerHTML = '';
        
        // Shuffle words
        const scrambled = [...this.correctOrder].sort(() => Math.random() - 0.5);
        
        scrambled.forEach((wordText) => {
            const card = document.createElement('div');
            card.className = 'word-card';
            card.textContent = wordText;
            card.draggable = true;
            card.dataset.word = wordText;
            
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', wordText);
                card.classList.add('dragging');
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            this.elements.wordsPool.appendChild(card);
        });

        gsap.from('.word-card', {
            scale: 0,
            opacity: 0,
            duration: 0.4,
            stagger: 0.05,
            ease: "back.out"
        });
    }

    handleDrop(e, zoneIndex) {
        e.preventDefault();
        const wordText = e.dataTransfer.getData('text/plain');
        
        // Check if correct
        if (this.correctOrder[zoneIndex] === wordText) {
            this.placeCorrectWord(wordText, zoneIndex);
        } else {
            this.handleWrongDrop(wordText, zoneIndex);
        }
    }

    placeCorrectWord(wordText, zoneIndex) {
        const zone = this.elements.ayahBoard.children[zoneIndex];
        zone.innerHTML = `<div class="word-card correct">${wordText}</div>`;
        zone.classList.add('filled');
        this.placedWords[zoneIndex] = wordText;
        
        // Remove from pool (find the element and remove)
        const cards = this.elements.wordsPool.querySelectorAll('.word-card');
        cards.forEach(c => {
            if (c.textContent === wordText && !c.classList.contains('hidden')) {
                c.classList.add('hidden');
                c.style.display = 'none';
            }
        });

        audioManager.play('pop');
        gsap.from(zone.firstChild, { scale: 1.4, duration: 0.3, ease: "back.out" });

        // Check if Ayah complete
        if (this.placedWords.every(w => w !== null)) {
            setTimeout(() => this.completeAyah(), 800);
        }
    }

    handleWrongDrop(wordText, zoneIndex) {
        audioManager.play('error'); // Need to add error sound
        this.elements.mascotBubble.textContent = "محاولة بطل! جرب مكاناً آخر 🧐";
        
        // Shake the zone
        const zone = this.elements.ayahBoard.children[zoneIndex];
        zone.classList.add('shake-anim');
        setTimeout(() => zone.classList.remove('shake-anim'), 400);
    }

    completeAyah() {
        this.playAyahAudio();
        this.elements.mascotBubble.textContent = "أحسنت! الآية مرتبة تماماً 🌟";
        
        setTimeout(() => {
            this.currentAyahIndex++;
            this.loadAyah(this.currentAyahIndex);
        }, 2000);
    }

    playAyahAudio() {
        if (!this.sound) return;
        const ayah = this.ayahs[this.currentAyahIndex];
        const start = ayah.words[0].start;
        const end = ayah.words[ayah.words.length - 1].end;
        
        this.sound.stop();
        this.sound.seek(start);
        this.sound.play();
        
        setTimeout(() => {
            this.sound.pause();
        }, (end - start) * 1000 + 500);
    }

    giveHint() {
        // Find first empty zone
        const emptyIdx = this.placedWords.findIndex(w => w === null);
        if (emptyIdx !== -1) {
            const correctWord = this.correctOrder[emptyIdx];
            this.placeCorrectWord(correctWord, emptyIdx);
            
            // Optional: reduce XP or limit hints
            this.elements.mascotBubble.textContent = "هذا تلميح صغير مني! 😉";
        }
    }

    updateProgress() {
        const percent = (this.currentAyahIndex / this.ayahs.length) * 100;
        gsap.to(this.elements.progressBar, { width: `${percent}%`, duration: 0.5 });
    }

    showFinalSuccess() {
        this.elements.mascotBubble.textContent = "مبروك يا بطل! لقد ختمت السورة بنجاح 🏆";
        audioManager.play('success');
        
        if (typeof ui !== 'undefined') {
            ui.completePuzzleChallenge(); // To be implemented
        }

        setTimeout(() => {
            this.handleBack();
        }, 3000);
    }

    handleBack() {
        if (this.sound) this.sound.stop();
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
window.puzzleChallenge = new PuzzleChallenge();
