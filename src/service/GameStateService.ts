import { singleton } from 'tsyringe';
import { GameEvent, PlayerInfo, RoomInfo } from '../domain/domain';
import { UserStateData } from '../dto/responces';

@singleton()
export default class GameStateService {
    private _userState: UserStateData;
    private _playerInfo: PlayerInfo;
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
}
