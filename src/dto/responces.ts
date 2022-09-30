import { Action, GameEvent, GameShop, GameUnit, PlayerInfo, RoomInfo } from '../domain/domain';
import { RequestType } from './requests';

export enum ResponseStatus {
    OK = 'ok',
    FAILED = 'failed',
    ERROR = 'error',
    MALFORMED = 'malformed',
    UNSUPPORTED = 'unsupported',
    NOT_ALLOWED = 'notAllowed',
    NOT_FOUND = 'notFound',
    ALREADY_EXISTS = 'alreadyExists',
}

export enum UserStatus {
    JOINED = 'joined',
    IN_LOBBY = 'inLobby',
    IN_ROOM = 'inRoom',
    IN_GAME = 'inGame',
}

export interface UserStateData {
    userId: string;
    playerInfo: PlayerInfo;
    unit: GameUnit;
    status: UserStatus;
}

export interface ShopStateData {
    shop: GameShop;
}

export interface LobbyStatusData {
    rooms: RoomInfo[];
    usersCount: number;
}

export interface RoomStatusData {
    room: RoomInfo;
    usersCount: number;
}

export interface GameStateData {
    gameState: GameEvent;
}

export interface PlayerInfoData {
    playerInfo: PlayerInfo;
}

export interface GameNextPhaseData {
    actionResult: GameEvent;
}

export interface GameActionData {
    action: Action;
    actionResult: GameEvent;
}

export interface Response {
    type: RequestType;
    id?: string;
    status: ResponseStatus;
    data: LobbyStatusData | UserStateData | ShopStateData | GameStateData | PlayerInfoData |
    GameNextPhaseData | GameActionData | RoomStatusData;
}
