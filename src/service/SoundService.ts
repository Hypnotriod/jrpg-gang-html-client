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
}

export class SoundService {
    private static readonly private: { [Key in SoundName]?: HTMLAudioElement } = {};
    private static ready: boolean = false;

    public static initialize(): void {
        SoundService.private[SoundName.BUFF] = new Audio('assets/sounds/buff.mp3');
        SoundService.private[SoundName.CLICK] = new Audio('assets/sounds/click.mp3');
        SoundService.private[SoundName.DEATH] = new Audio('assets/sounds/death.mp3');
        SoundService.private[SoundName.DENIED] = new Audio('assets/sounds/denied.mp3');
        SoundService.private[SoundName.EQUIP] = new Audio('assets/sounds/equip.mp3');
        SoundService.private[SoundName.HIT] = new Audio('assets/sounds/hit.mp3');
        SoundService.private[SoundName.MISS] = new Audio('assets/sounds/miss.mp3');
        SoundService.private[SoundName.MOVE] = new Audio('assets/sounds/move.mp3');
        SoundService.private[SoundName.TREASURE] = new Audio('assets/sounds/treasure.mp3');
        SoundService.private[SoundName.REPAIR] = new Audio('assets/sounds/repair.mp3');
        SoundService.private[SoundName.STUNNED] = new Audio('assets/sounds/stunned.mp3');
        SoundService.private[SoundName.HORN] = new Audio('assets/sounds/horn.mp3');
        SoundService.private[SoundName.DOOR] = new Audio('assets/sounds/door.mp3');
        SoundService.private[SoundName.COMPLETE] = new Audio('assets/sounds/complete.mp3');

        window.document.addEventListener('mousedown', () => (SoundService.ready = true));
    }

    public static play(name: SoundName, options?: { delayMs?: number }): void {
        const sound = SoundService.private[name];
        if (!SoundService.ready || !sound) return;
        const onCanPlayThrough = () => {
            sound.removeEventListener('canplaythrough', onCanPlayThrough);
            sound.play();
        }
        setTimeout(() => {
            sound.currentTime = 0;
            if (sound.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
                sound.play();
            } else {
                sound.addEventListener('canplaythrough', onCanPlayThrough, false);
            }
        }, options?.delayMs ?? 0);
    }
}
