import { db } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection, 
    getDocs, 
    writeBatch 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Initial Data (Seed)
const INITIAL_DATA = {
    student: {
        id: "hero_1", // Using string IDs for Firestore
        name: "أحمد بطل القرآن", 
        xp: 120, 
        level: 2, 
        avatar: "👦", 
        streak: 5, 
        badges: ["بطل البداية"]
    },
    villages: [
        { id: "1", name: "قرية الناس", surah: "الناس", status: "completed", stars: 3, x: 100, y: 700 },
        { id: "2", name: "قرية الفلق", surah: "الفلق", status: "completed", stars: 2, x: 300, y: 550 },
        { id: "3", name: "قرية الإخلاص", surah: "الإخلاص", status: "unlocked", stars: 0, x: 120, y: 400 },
        { id: "4", name: "قرية المسد", surah: "المسد", status: "locked", stars: 0, x: 300, y: 250 },
        { id: "5", name: "قرية النصر", surah: "النصر", status: "locked", stars: 0, x: 150, y: 100 }
    ]
};

const api = {
    /**
     * Initialize Firestore with seed data if empty
     */
    async ensureInitialized() {
        try {
            console.log("Checking database connection...");
            const studentDoc = await getDoc(doc(db, "students", "hero_1"));
            if (!studentDoc.exists()) {
                console.log("Initializing Firebase with seed data...");
                // Seed student
                await setDoc(doc(db, "students", "hero_1"), INITIAL_DATA.student);
                
                // Seed villages via batch
                const batch = writeBatch(db);
                INITIAL_DATA.villages.forEach(v => {
                    const vRef = doc(db, "villages", v.id);
                    batch.set(vRef, v);
                });
                await batch.commit();
                console.log("Firebase initialized successfully.");
            }
        } catch (error) {
            console.error("Firebase Initialization Error:", error);
            // Don't throw, let the app try to work or show error
            if (error.code === 'permission-denied' || error.message.includes('disabled')) {
                alert("⚠️ خطأ في تهيئة Firebase: تأكد من تفعيل Cloud Firestore API في لوحة تحكم Firebase.");
            }
        }
    },

    async getUserData() {
        await this.ensureInitialized();
        const docRef = doc(db, "students", "hero_1");
        const docSnap = await getDoc(docRef);
        return docSnap.data();
    },

    async getVillages() {
        await this.ensureInitialized();
        const querySnapshot = await getDocs(collection(db, "villages"));
        const villages = [];
        querySnapshot.forEach((doc) => {
            villages.push(doc.data());
        });
        // Sort by ID to maintain map order
        return villages.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    },

    async updateUserProgress(xpToAdd) {
        const user = await this.getUserData();
        const newXp = user.xp + xpToAdd;
        const newLevel = Math.floor(newXp / 500) + 1;
        
        const docRef = doc(db, "students", "hero_1");
        await updateDoc(docRef, {
            xp: newXp,
            level: newLevel
        });
        
        return { ...user, xp: newXp, level: newLevel };
    },

    async updateVillageStatus(villageId, status, stars) {
        const docRef = doc(db, "villages", villageId.toString());
        await updateDoc(docRef, {
            status: status,
            stars: stars
        });
        
        return { id: villageId, status, stars };
    }
};

// Expose to window for traditional scripts (ui.js, main.js)
window.api = api;
export default api;
