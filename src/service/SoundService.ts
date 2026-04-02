import { Howl } from 'howler';

export enum SoundName {
    BUFF = 'buff',
    CLICK = 'click',
    DEATH = 'death',
    DENIED = 'denied',
    EQUIP = 'equip',
    HIT = 'hit',
    MISS = 'miss',
    MOVE = 'move',
    TREASURE = 'treasure',
    REPAIR = 'repair',
    STUNNED = 'stunned',
    HORN = 'horn',
    DOOR = 'door',
    COMPLETE = 'complete',
    BROOM = 'broom',
    WASHING = 'washing',
    BOOK = 'book',
    CLOCK_TICK = 'clock_tick',
    ACHIEVEMENT = 'achievement',
}

export const JOB_SOUND: { [key: string]: SoundName } = {
    'job-clean-01': SoundName.BROOM,
    'job-clean-02': SoundName.WASHING,
    'job-library-01': SoundName.BOOK,
}

export class SoundService {
    private static readonly sounds: { [Key in SoundName]?: Howl } = {};

    public static initialize(): void {
        SoundService.sounds[SoundName.BUFF] = new Howl({ src: ['assets/sounds/buff.mp3'] });
        SoundService.sounds[SoundName.CLICK] = new Howl({ src: ['assets/sounds/click.mp3'] });
        SoundService.sounds[SoundName.DEATH] = new Howl({ src: ['assets/sounds/death.mp3'] });
        SoundService.sounds[SoundName.DENIED] = new Howl({ src: ['assets/sounds/denied.mp3'] });
        SoundService.sounds[SoundName.EQUIP] = new Howl({ src: ['assets/sounds/equip.mp3'] });
        SoundService.sounds[SoundName.HIT] = new Howl({ src: ['assets/sounds/hit.mp3'] });
        SoundService.sounds[SoundName.MISS] = new Howl({ src: ['assets/sounds/miss.mp3'] });
        SoundService.sounds[SoundName.MOVE] = new Howl({ src: ['assets/sounds/move.mp3'] });
        SoundService.sounds[SoundName.TREASURE] = new Howl({ src: ['assets/sounds/treasure.mp3'] });
        SoundService.sounds[SoundName.REPAIR] = new Howl({ src: ['assets/sounds/repair.mp3'] });
        SoundService.sounds[SoundName.STUNNED] = new Howl({ src: ['assets/sounds/stunned.mp3'] });
        SoundService.sounds[SoundName.HORN] = new Howl({ src: ['assets/sounds/horn.mp3'] });
        SoundService.sounds[SoundName.DOOR] = new Howl({ src: ['assets/sounds/door.mp3'] });
        SoundService.sounds[SoundName.COMPLETE] = new Howl({ src: ['assets/sounds/complete.mp3'] });
        SoundService.sounds[SoundName.BROOM] = new Howl({ src: ['assets/sounds/broom.mp3'] });
        SoundService.sounds[SoundName.WASHING] = new Howl({ src: ['assets/sounds/washing.mp3'] });
        SoundService.sounds[SoundName.BOOK] = new Howl({ src: ['assets/sounds/book.mp3'] });
        SoundService.sounds[SoundName.CLOCK_TICK] = new Howl({ src: ['assets/sounds/clock_tick.mp3'] });
        SoundService.sounds[SoundName.ACHIEVEMENT] = new Howl({ src: ['assets/sounds/achievement.mp3'] });
    }

    public static play(name: SoundName, options?: { delayMs?: number, loop?: boolean; }): void {
        const sound = SoundService.sounds[name];
        if (!sound) return;
        sound.loop(options?.loop ?? false);
        if (options?.delayMs) {
            setTimeout(() => sound.play(), options.delayMs);
            return;
        }
        sound.play();
    }
}
