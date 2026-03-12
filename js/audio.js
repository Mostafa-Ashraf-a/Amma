// Audio Management with Howler.js
const audioManager = {
    sounds: {},

    init() {
        this.sounds.click = new Howl({
            src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'],
            volume: 0.5
        });

        this.sounds.success = new Howl({
            src: ['https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'],
            volume: 0.7
        });

        this.sounds.bgMusic = new Howl({
            src: ['https://assets.mixkit.co/active_storage/sfx/135/135-preview.mp3'],
            volume: 0.1,
            loop: true
        });

        this.sounds.pop = new Howl({
            src: ['https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'],
            volume: 0.4
        });

        this.sounds.ting = new Howl({
            src: ['https://assets.mixkit.co/active_storage/sfx/2011/2011-preview.mp3'],
            volume: 0.4
        });

        this.sounds.error = new Howl({
            src: ['https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'], // A "boing" or fail sound
            volume: 0.5
        });
    },

    play(name) {
        if(this.sounds[name]) {
            this.sounds[name].play();
        }
    },
    
    startBgMusic() {
        // this.play('bgMusic'); 
        // Note: Browsers require user interaction before playing audio
    }
};
