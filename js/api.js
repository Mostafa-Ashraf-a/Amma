// API Communication Module & Hybrid Storage Logic
const API_URL = 'http://localhost:3000';

// Initial Data (Seed) from your current db.json
const INITIAL_DATA = {
    student: {
        id: 1, name: "أحمد بطل القرآن", xp: 120, level: 2, avatar: "👦", streak: 5, badges: ["بطل البداية"]
    },
    villages: [
        { id: 1, name: "قرية الناس", surah: "الناس", status: "completed", stars: 3, x: 100, y: 700 },
        { id: 2, name: "قرية الفلق", surah: "الفلق", status: "completed", stars: 2, x: 300, y: 550 },
        { id: 3, name: "قرية الإخلاص", surah: "الإخلاص", status: "unlocked", stars: 0, x: 120, y: 400 },
        { id: 4, name: "قرية المسد", surah: "المسد", status: "locked", stars: 0, x: 300, y: 250 },
        { id: 5, name: "قرية النصر", surah: "النصر", status: "locked", stars: 0, x: 150, y: 100 }
    ]
};

const api = {
    isServerActive: false,

    async checkServer() {
        try {
            const res = await fetch(`${API_URL}/student`, { method: 'HEAD' });
            this.isServerActive = res.ok;
        } catch {
            this.isServerActive = false;
        }
    },

    // --- Data Management (Hybrid: Server vs LocalStorage) ---
    async getUserData() {
        await this.checkServer();
        if (this.isServerActive) {
            const res = await fetch(`${API_URL}/student`);
            return await res.json();
        } else {
            // Read from LocalStorage or initialize with seed
            let data = localStorage.getItem('juz_amma_student');
            if (!data) {
                localStorage.setItem('juz_amma_student', JSON.stringify(INITIAL_DATA.student));
                return INITIAL_DATA.student;
            }
            return JSON.parse(data);
        }
    },

    async getVillages() {
        if (this.isServerActive) {
            const res = await fetch(`${API_URL}/villages`);
            return await res.json();
        } else {
            let data = localStorage.getItem('juz_amma_villages');
            if (!data) {
                localStorage.setItem('juz_amma_villages', JSON.stringify(INITIAL_DATA.villages));
                return INITIAL_DATA.villages;
            }
            return JSON.parse(data);
        }
    },

    async updateUserProgress(xpToAdd) {
        if (this.isServerActive) {
            const user = await this.getUserData();
            const newXp = user.xp + xpToAdd;
            const newLevel = Math.floor(newXp / 500) + 1;
            const res = await fetch(`${API_URL}/student`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xp: newXp, level: newLevel }),
            });
            return await res.json();
        } else {
            const user = await this.getUserData();
            user.xp += xpToAdd;
            user.level = Math.floor(user.xp / 500) + 1;
            localStorage.setItem('juz_amma_student', JSON.stringify(user));
            return user;
        }
    },

    async updateVillageStatus(villageId, status, stars) {
        if (this.isServerActive) {
            const res = await fetch(`${API_URL}/villages/${villageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, stars }),
            });
            return await res.json();
        } else {
            const villages = await this.getVillages();
            const village = villages.find(v => v.id == villageId);
            if (village) {
                village.status = status;
                village.stars = stars;
                localStorage.setItem('juz_amma_villages', JSON.stringify(villages));
            }
            return village;
        }
    }
};
