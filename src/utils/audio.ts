
// Gestione percorsi per locale vs GitHub Pages
const baseUrl = import.meta.env.BASE_URL;

const SOUNDS = {
    CARD_PLAY: `${baseUrl}assets/sounds/carddrop2-92718.mp3`,
    CARD_DRAW: `${baseUrl}assets/sounds/pageturn-102978.mp3`,
};

class AudioManager {
    private static instance: AudioManager;
    private muted: boolean = false;
    private audioCache: Map<string, HTMLAudioElement> = new Map();

    private constructor() {
        // Il valore iniziale viene settato da App.tsx leggendo localStorage
    }

    static getInstance() {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    setMuted(muted: boolean) {
        this.muted = muted;
    }

    play(soundKey: keyof typeof SOUNDS) {
        if (this.muted) return;

        try {
            let audio = this.audioCache.get(soundKey);
            if (!audio) {
                audio = new Audio(SOUNDS[soundKey]);
                this.audioCache.set(soundKey, audio);
            }

            // Reset e play (permette di sovrapporre suoni o ripartire subito)
            audio.currentTime = 0;
            audio.play().catch(e => console.warn("Audio play blocked by browser policy:", e));
        } catch (error) {
            console.error("Error playing sound:", error);
        }
    }
}

export const audioManager = AudioManager.getInstance();
