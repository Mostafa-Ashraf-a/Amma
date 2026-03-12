// Map and Phaser Integration
class MapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapScene' });
    }

    preload() {
        // No external assets to load! We will generate them in create() to bypass file:/// CORS limits
    }

    create() {
        // --- Generate Textures on the fly ---
        const g = this.add.graphics();
        
        // Generate Cloud 1
        g.fillStyle(0xFFFFFF, 0.9);
        g.fillCircle(30, 30, 20);
        g.fillCircle(60, 20, 25);
        g.fillCircle(90, 30, 20);
        g.fillCircle(50, 40, 20);
        g.generateTexture('cloud1', 120, 60);
        g.clear();

        // Generate Cloud 2
        g.fillStyle(0xE1F5FE, 0.7);
        g.fillCircle(30, 30, 20);
        g.fillCircle(60, 20, 25);
        g.fillCircle(90, 30, 20);
        g.generateTexture('cloud2', 120, 60);
        g.clear();

        // Generate Sparkle
        g.fillStyle(0xFFF59D, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('sparkle', 8, 8);
        g.destroy();

        // Create background locked to camera
        const bg = this.add.graphics();
        // Vertically gradient: Top = Light Blue, Bottom = Dark Blue
        // Syntax: fillGradientStyle(topLeft, topRight, bottomLeft, bottomRight, alphaTopLeft, alphaTopRight, alphaBottomLeft, alphaBottomRight)
        bg.fillGradientStyle(0x64B5F6, 0x64B5F6, 0x1A237E, 0x1A237E, 1, 1, 1, 1);
        bg.fillRect(0, 0, 2000, 4000); // Make it tall enough for all bounds
        bg.setScrollFactor(0); // Lock to camera view
        bg.setDepth(0); // Ensure background is at the back

        this.clouds = []; // Initialize empty array
        this.createClouds();

        // Wait for villages data from window.appData (passed from main.js)
        if (window.appData && window.appData.villages) {
            this.drawPathAndVillages(window.appData.villages);
        }
        
        // Setup Camera dragging for mobile feel
        // Initial bounds (will be updated when villages are drawn)
        const boundsW = this.sys.game.canvas.width || 400;
        const boundsH = this.sys.game.canvas.height || 800;
        this.cameras.main.setBounds(0, 0, boundsW, boundsH * 2);
        this.cameras.main.scrollY = (boundsH * 2) - boundsH;
        
        // Handle window resizing dynamically
        this.scale.on('resize', (gameSize) => {
            const width = gameSize.width;
            const height = gameSize.height;
            this.cameras.main.setSize(width, height);
            
            // Re-draw map to fit new dimensions
            if (window.appData && window.appData.villages) {
                // Clear all graphics and containers
                this.children.removeAll();
                this.clouds = [];
                // Re-create background
                const bg = this.add.graphics();
                // Vertically gradient: Top = Light Blue, Bottom = Dark Blue
                bg.fillGradientStyle(0x64B5F6, 0x64B5F6, 0x1A237E, 0x1A237E, 1, 1, 1, 1);
                bg.fillRect(0, 0, 2000, 4000); 
                bg.setScrollFactor(0);
                bg.setDepth(0); // Ensure background is at the very back
                
                // Re-create clouds
                this.createClouds();
                
                // Redraw villages
                this.drawPathAndVillages(window.appData.villages);
            }
        });
        
        // Drag scrolling logic
        let isDown = false;
        let startY = 0;
        let camStartY = 0;
        let velocityY = 0;

        this.input.on('pointerdown', (pointer) => {
            isDown = true;
            startY = pointer.y;
            camStartY = this.cameras.main.scrollY;
            velocityY = 0;
        });

        this.input.on('pointermove', (pointer) => {
            if (!isDown) return;
            const deltaY = startY - pointer.y;
            this.cameras.main.scrollY = camStartY + deltaY;
            velocityY = deltaY * 0.1; // Simple calculation for flick velocity
        });

        this.input.on('pointerup', () => { isDown = false; });
        this.input.on('pointerout', () => { isDown = false; });

        // Inertia scrolling on update
        this.events.on('update', () => {
            if (!isDown && Math.abs(velocityY) > 0.1) {
                this.cameras.main.scrollY += velocityY;
                velocityY *= 0.92; // Friction
            }
            
            // Move clouds horizontally in a continuous loop
            const screenW = this.sys.game.canvas.width || 400;
            const screenH = this.sys.game.canvas.height || 800;
            
            this.clouds.forEach(c => {
                if (c.sprite && c.sprite.active) {
                    c.sprite.x += c.speed;
                    // Since clouds have setScrollFactor(0), their X and Y are screen coordinates.
                    if (c.sprite.x > screenW + (c.sprite.width * c.sprite.scaleX)) {
                        c.sprite.x = - (c.sprite.width * c.sprite.scaleX);
                        // Respawn inside the visible height of the screen! Not the entire map bounds.
                        c.sprite.y = Phaser.Math.Between(-50, screenH + 50);
                    }
                }
            });
        });
    }

    createClouds() {
        // Add Parallax Clouds (Game-like depth)
        const mapWidth = this.sys.game.canvas.width || 400;
        const totalHeight = this.cameras.main.getBounds().height || 2000;
        
        for (let i = 0; i < 20; i++) {
            // By setting scrollFactor(0), clouds lock to the camera (screen coordinates)
            // Distribute them evenly within the visible screen area
            let x = Phaser.Math.Between(-100, mapWidth + 100);
            let y = Phaser.Math.Between(-100, this.sys.game.canvas.height + 100);
            let speed = Phaser.Math.FloatBetween(0.1, 0.4);
            let scale = Phaser.Math.FloatBetween(0.5, 1.5);
            let cloudKey = i % 2 === 0 ? 'cloud1' : 'cloud2';
            
            // By NOT setting ScrollFactor to 0 or <1, they will scroll naturally with the camera, 
            // but setting scrollFactor(speed+0.3) makes them move at different speeds than the camera (parallax).
            // But we want them to feel like a continuous background. Let's fix them to camera somewhat.
            let cloud = this.add.image(x, y, cloudKey).setScale(scale).setScrollFactor(0); 
            // setScrollFactor(0) means they stick to the screen and only move based on our update loop! 
            // This guarantees they never 'run out' as you scroll the massive path.
            
            cloud.setDepth(1); // Set depth above background
            cloud.setAlpha(0.6); // slight transparency makes it look nicer
            this.clouds.push({ sprite: cloud, speed: speed });
        }
    }

    drawPathAndVillages(villages) {
        const sortedVillages = [...villages].sort((a,b) => a.id - b.id);
        if(sortedVillages.length < 2) return;
        
        // Use standard dimensions if width/height is not fully caught on first frame
        const screenW = this.sys.game.canvas.width || 400;
        const screenH = this.sys.game.canvas.height || 800;
        const centerX = screenW / 2;
        
        // Dynamically calculate vertical spacing
        const verticalGap = 150; // Distance between each village
        const bottomPadding = 150; // Padding from bottom edge
        const topPadding = 150; // Padding from top edge
        const totalHeight = (sortedVillages.length * verticalGap) + bottomPadding + topPadding;

        
        // Update camera bounds to perfectly fit the generated map height
        this.cameras.main.setBounds(0, 0, screenW, totalHeight);
        
        sortedVillages.forEach((v, i) => {
            // Distribute on a zig-zag path dynamically based on screen width
            // e.g. Left -> Center -> Right -> Center -> Left
            // Offset from center by about 25% of screen width
            const offset = (screenW * 0.25);
            if (i % 2 === 0) {
                v.renderX = centerX - offset; // Left side
            } else {
                v.renderX = centerX + offset; // Right side
            }
            
            // Top village must be centered occasionally
            if (i === sortedVillages.length - 1) {
                v.renderX = centerX;
            }
            
            // Calculate dynamic Y (starting from bottom going up)
            v.renderY = totalHeight - bottomPadding - (i * verticalGap);
        });
        
        // Focus camera on the active village
        let activeIndex = sortedVillages.findIndex(v => v.status === 'unlocked');
        if (activeIndex === -1) activeIndex = 0;
        const targetScrollY = sortedVillages[activeIndex].renderY - (screenH / 2);
        this.cameras.main.scrollY = Phaser.Math.Clamp(targetScrollY, 0, totalHeight - screenH);

        // --- Draw Paths ---
        // Shadow path
        const shadowPathG = this.add.graphics();
        shadowPathG.lineStyle(24, 0x000000, 0.2); // Slightly thicker drop shadow
        
        // Solid base path (Track bed)
        const pathG = this.add.graphics();
        pathG.lineStyle(16, 0x4a5a80, 1); // Dark blueish gray base for the track
        
        const path = new Phaser.Curves.Path(sortedVillages[0].renderX, sortedVillages[0].renderY);
        
        for(let i = 1; i < sortedVillages.length; i++) {
            const p0 = sortedVillages[i-1];
            const p1 = sortedVillages[i];
            
            // Calculate bezier control points for a smooth sweeping curve
            const controlOffset = screenW * 0.45; // Wider curves to match reference
            
            const cp1x = p0.renderX > centerX ? p0.renderX + controlOffset : p0.renderX - controlOffset;
            const cp1y = p0.renderY - (p0.renderY - p1.renderY)/2;
            
            const cp2x = p1.renderX > centerX ? p1.renderX + controlOffset : p1.renderX - controlOffset;
            const cp2y = p1.renderY + (p0.renderY - p1.renderY)/2;
            
            path.cubicBezierTo(p1.renderX, p1.renderY, cp1x, cp1y, cp2x, cp2y);
        }
        
        // Draw shadow first, translation applied
        shadowPathG.y = 15;
        path.draw(shadowPathG);
        
        // Draw solid track bed
        path.draw(pathG);
        
        // Draw Track Notches (Railroad style)
        const trackG = this.add.graphics();
        
        // Get points along the path to draw the cross-lines for the track
        const points = path.getPoints(150); 
        
        // To draw perpendicular lines, we need the angle between points
        for(let i = 0; i < points.length - 1; i++) {
            let p1 = points[i];
            let p2 = points[i+1];
            
            // Calculate angle of the segment
            let angle = Phaser.Math.Angle.BetweenPoints(p1, p2);
            // Perpendicular angle (+90 degrees)
            let perpAngle = angle + (Math.PI / 2);
            
            // Width of the track line
            let lineWidth = 12; 
            
            // Points for the notch
            let nx1 = p1.x + Math.cos(perpAngle) * lineWidth;
            let ny1 = p1.y + Math.sin(perpAngle) * lineWidth;
            let nx2 = p1.x - Math.cos(perpAngle) * lineWidth;
            let ny2 = p1.y - Math.sin(perpAngle) * lineWidth;

            // Determine if active or locked
            let activeIndex = sortedVillages.findIndex(v => v.status === 'unlocked');
            if (activeIndex === -1) activeIndex = sortedVillages.length;
            let activeY = activeIndex < sortedVillages.length ? sortedVillages[activeIndex].renderY : -999;
            
            if (p1.y >= activeY) {
                // Completed/Active area - Bright Yellow notches
                trackG.lineStyle(3, 0xFFCA28, 1);
            } else {
                // Locked area - Gray/White transparent notches
                trackG.lineStyle(3, 0xB0BEC5, 0.5);
            }
            
            trackG.beginPath();
            trackG.moveTo(nx1, ny1);
            trackG.lineTo(nx2, ny2);
            trackG.strokePath();
        }

        // --- Draw Villages ---
        this.renderVillages3D(sortedVillages);
    }
    
    renderVillages3D(villages) {
        villages.forEach((v, index) => {
            let topColor, sideColor, bottomColor;
            let scale = 1;
            
            if(v.status === 'completed') {
                topColor = 0x66BB6A;   // Light Green
                sideColor = 0x388E3C;  // Dark Green
                bottomColor = 0x1B5E20;
            } else if (v.status === 'unlocked') {
                topColor = 0xFFCA28;   // Vibrant Yellow/Gold
                sideColor = 0xF57C00;  // Orange
                bottomColor = 0xE65100;
                scale = 1.15;
            } else {
                // Locked
                topColor = 0xB0BEC5;   // Light Gray (Top)
                sideColor = 0x90A4AE;  // Medium Gray (Side)
                bottomColor = 0x607D8B; // Dark Gray (Base)
                scale = 0.9;
            }
            
            const radiusX = 45 * scale;
            const radiusY = 25 * scale; // Oval for 3D perspective
            const height = 18 * scale; // The thickness of the 3D island
            
            // Island Group to hold pieces together for animation
            // Use dynamically calculated renderX and renderY
            const islandGroup = this.add.container(v.renderX, v.renderY);
            
            // 1. Drop Shadow
            const shadow = this.add.ellipse(0, height + 15, radiusX * 1.2, radiusY * 1.2, 0x000000, 0.3);
            islandGroup.add(shadow);
            
            // 2. Base/Bottom layer of island
            const baseCircle = this.add.ellipse(0, height, radiusX, radiusY, bottomColor, 1);
            islandGroup.add(baseCircle);
            
            // 3. Side connecting rect (To make it look like a solid 3D cylinder/island body)
            // It connects the center of top circle to the center of bottom circle
            const sideRect = this.add.rectangle(0, height/2, radiusX * 2, height, sideColor, 1);
            islandGroup.add(sideRect);
            
            // 4. Top layer
            const topCircle = this.add.ellipse(0, 0, radiusX, radiusY, topColor, 1);
            islandGroup.add(topCircle);
            
            // 5. Decorations / Patterns on top
            const innerCircle = this.add.ellipse(0, 0, radiusX * 0.7, radiusY * 0.7, 0xFFFFFF, 0.2);
            islandGroup.add(innerCircle);
            
            // Status Icons and Labels
            if (v.status === 'completed' && v.stars) {
                // Star Badge
                const starBox = this.add.graphics();
                starBox.fillStyle(0x000000, 0.5);
                starBox.fillRoundedRect(-30, -45, 60, 20, 10);
                islandGroup.add(starBox);
                
                const starsText = this.add.text(0, -35, '★'.repeat(v.stars), {
                    fontFamily: 'Arial', fontSize: '16px', color: '#FFD700', align: 'center'
                }).setOrigin(0.5);
                islandGroup.add(starsText);
                
                // Flag / Checkmark
                const checkText = this.add.text(0, -5, '✔', {
                    fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold', color: '#FFFFFF',
                    stroke: '#388E3C', strokeThickness: 4
                }).setOrigin(0.5);
                islandGroup.add(checkText);
            }
            
            // Popup Label (Game Style Floating Name)
            const labelBg = this.add.graphics();
            labelBg.fillStyle(0xFFFFFF, 1);
            labelBg.fillRoundedRect(-55, height + 20, 110, 28, 14);
            labelBg.lineStyle(3, sideColor, 1);
            labelBg.strokeRoundedRect(-55, height + 20, 110, 28, 14);
            islandGroup.add(labelBg);
            
            const nameText = this.add.text(0, height + 34, v.name, {
                fontFamily: 'Tajawal, Arial', fontSize: '13px', color: '#333333', fontStyle: 'bold'
            }).setOrigin(0.5);
            islandGroup.add(nameText);
            
            // Set Hit Area on the top circle for interaction
            topCircle.setInteractive({ cursor: 'pointer', hitArea: new Phaser.Geom.Ellipse(radiusX, radiusY, radiusX*2, radiusY*2), hitAreaCallback: Phaser.Geom.Ellipse.Contains });
            
            if (v.status !== 'locked') {
                // Click Event
                topCircle.on('pointerdown', () => {
                    // "Press" animation
                    this.tweens.add({ targets: islandGroup, y: v.renderY + 10, duration: 100, yoyo: true });
                    
                    if(window.appUI) {
                        setTimeout(() => window.appUI.openVillageScreen(v), 150);
                        
                        this.tweens.add({
                            targets: this.cameras.main,
                            scrollY: Phaser.Math.Clamp(v.renderY - this.cameras.main.centerY, 0, this.cameras.main.getBounds().height - this.cameras.main.height),
                            duration: 500, ease: 'Power2'
                        });
                    }
                });
                
                // Hover Event
                topCircle.on('pointerover', () => {
                    this.tweens.add({ targets: islandGroup, scaleX: 1.05, scaleY: 1.05, duration: 150 });
                });
                topCircle.on('pointerout', () => {
                    this.tweens.add({ targets: islandGroup, scaleX: 1, scaleY: 1, duration: 150 });
                });
                
                // Active Level Special Effects (Roblox / Mobile Game Feel)
                if (v.status === 'unlocked') {
                    // Floating Animation (Bobbing)
                    this.tweens.add({
                        targets: islandGroup,
                        y: v.renderY - 15,
                        duration: 1500,
                        ease: 'Sine.easeInOut',
                        yoyo: true,
                        repeat: -1
                    });
                    
                    // Shadow adjusts with bobbing
                    this.tweens.add({
                        targets: shadow,
                        scaleX: 0.8, scaleY: 0.8, alpha: 0.1,
                        duration: 1500, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
                    });

                    // Magic Sparkle Particles (Phaser 3.60+ syntax)
                    const emitter = this.add.particles(v.renderX, v.renderY, 'sparkle', {
                        speed: { min: -50, max: 50 },
                        angle: { min: 0, max: 360 },
                        scale: { start: 0.5, end: 0 },
                        alpha: { start: 1, end: 0 },
                        lifespan: 1500,
                        frequency: 300,
                        blendMode: 'ADD'
                    });

                    // Icon for active
                    const activeIcon = this.add.text(0, -15, '🗺️', {
                        fontSize: '28px'
                    }).setOrigin(0.5);
                    
                    // Spin/bounce the icon
                    this.tweens.add({
                        targets: activeIcon,
                        y: -25, rotation: 0.1, duration: 600, yoyo: true, repeat: -1, ease: 'Quad.easeOut'
                    });
                    islandGroup.add(activeIcon);
                }
            } else {
                // Locked State
                const lockIcon = this.add.text(0, -5, '🔒', {
                    fontSize: '24px', opacity: 0.8
                }).setOrigin(0.5);
                islandGroup.add(lockIcon);
                
                labelBg.setAlpha(0.6);
                nameText.setAlpha(0.6);
            }
        });
    }
}

const mapEngine = {
    game: null,

    init(villagesData) {
        window.appData = { villages: villagesData };
        window.appUI = typeof ui !== 'undefined' ? ui : null;

        const config = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: '100%',
            height: '100%',
            transparent: true,
            scene: MapScene,
            scale: {
                // Use RESIZE to let Phaser automatically fit the parent DOM element
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        this.game = new Phaser.Game(config);
    }
};
// Global Exposure
window.mapEngine = mapEngine;
export default mapEngine;
