import { singleton } from 'tsyringe';
import { GameEvent, GameShopStatus, PlayerInfo, RoomInfo, UnitRequirements } from '../domain/domain';
import { UserStateData } from '../dto/responces';

@singleton()
export default class GameStateService {
    private _userState: UserStateData;
    private _playerInfo: PlayerInfo;
    private _shopStatus: GameShopStatus;
    private _gameState: GameEvent;
    private _rooms: RoomInfo[];
    private _usersCount: number;

    public set playerInfo(value: PlayerInfo) {
        this._playerInfo = value;
    }

    public get playerInfo(): PlayerInfo {
        return this._playerInfo;
    }

    public set rooms(value: RoomInfo[]) {
        this._rooms = value;
    }

    public get rooms(): RoomInfo[] {
        return this._rooms;
    }

    public set usersCount(value: number) {
        this._usersCount = value;
    }

    public get usersCount(): number {
        return this._usersCount;
    }

    public set gameState(value: GameEvent) {
        this._gameState = value;
    }

    public get gameState(): GameEvent {
        return this._gameState;
    }

    public set shopStatus(value: GameShopStatus) {
        this._shopStatus = value;
    }

    public get shopStatus(): GameShopStatus {
        return this._shopStatus;
    }

    public set userState(value: UserStateData) {
        this._userState = value;
    }

    public get userState(): UserStateData {
        return this._userState;
    }

    public isUserInRooms(roomInfos: RoomInfo[]): boolean {
        return !!roomInfos.find(room => this.isUserInRoom(room));
    }

    public isUserInRoom(roomInfo: RoomInfo): boolean {
        return roomInfo.host.nickname === this.userState.playerInfo.nickname ||
            !!roomInfo.joinedUsers.find(u => u.nickname === this.userState.playerInfo.nickname);
    }

    public isUserHostOfRoom(roomInfo: RoomInfo): boolean {
        return roomInfo.host.nickname === this.userState.playerInfo.nickname;
    }

    public checkRequirements(required?: UnitRequirements) {
        if (!required) return true;
        const unit = this.userState.unit;
        return (!required.class || required.class === unit.class) &&
            (required.level ?? 0) <= unit.stats.progress.level &&
            this.checkAchievements(required.achievements) &&
            required.strength <= unit.stats.attributes.strength &&
            required.physique <= unit.stats.attributes.physique &&
            required.agility <= unit.stats.attributes.agility &&
            required.endurance <= unit.stats.attributes.endurance &&
            required.intelligence <= unit.stats.attributes.intelligence &&
            required.initiative <= unit.stats.attributes.initiative &&
            required.luck <= unit.stats.attributes.luck
    }

    public checkAchievements(required?: { [key: string]: number }) {
        const unit = this.userState.unit;
        if (!required || !unit.achievements) return true;
        return [...Object.keys(required)].every(k => required[k] <= unit.achievements[k]);
    }


}
