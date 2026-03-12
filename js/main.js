// App Initialization and Entry Point
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Audio Manager
    if (window.audioManager) window.audioManager.init();
    
    // 2. Fetch Data from API
    console.log("Fetching data from backend...");
    try {
        const userData = await window.api.getUserData();
        const villages = await window.api.getVillages();
        
        // 3. Initialize UI (Binds events, handles loading overlay, sets up GSAP)
        if (window.ui) window.ui.init(userData);
        
        // 4. Initialize Map Engine (Draws the Phaser map and renders villages)
        if (window.mapEngine) window.mapEngine.init(villages);
    } catch (error) {
        console.error("Initialization error:", error);
    }
    
    // Optional: Start background music on user's first interaction with the document
    document.body.addEventListener('click', () => {
        if (window.audioManager) window.audioManager.startBgMusic();
    }, { once: true });
});
