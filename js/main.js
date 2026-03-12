// App Initialization and Entry Point
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Audio Manager
    audioManager.init();
    
    // 2. Fetch Data from API
    console.log("Fetching data from backend...");
    const userData = await api.getUserData();
    const villages = await api.getVillages();
    
    // 3. Initialize UI (Binds events, handles loading overlay, sets up GSAP)
    ui.init(userData);
    
    // 4. Initialize Map Engine (Draws the Phaser map and renders villages)
    mapEngine.init(villages);
    
    // Optional: Start background music on user's first interaction with the document
    // This is because modern browsers block auto-playing audio without user gesture
    document.body.addEventListener('click', () => {
        audioManager.startBgMusic();
    }, { once: true });
});
