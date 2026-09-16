import { injectable, singleton } from 'tsyringe';
import GameStateService from './GameStateService';

@singleton()
@injectable()
export class StorageService {
    constructor(
        private readonly state: GameStateService) {
    }

    public getItem(key: string): string | null {
        const playerInfo = this.state.userState.playerInfo;
        return playerInfo.isGuest ?
            sessionStorage.getItem(key) :
            localStorage.getItem(`${playerInfo.nickname}:${key}`);
    }

    public setItem(key: string, value: string): void {
        const playerInfo = this.state.userState.playerInfo;
        playerInfo.isGuest ?
            sessionStorage.setItem(key, value) :
            localStorage.setItem(`${playerInfo.nickname}:${key}`, value);
    }
}