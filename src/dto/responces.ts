import { GameShop, GameUnit, PlayerInfo, RoomInfo } from '../domain/domain';
import { RequestType } from './requests';

export enum ResponseStatus {
    OK = 'ok',
    FAILED = 'failed',
    ERROR = 'error',
    MAILFORMED = 'mailformed',
    UNSUPPORTED = 'unsupported',
    NOT_ALLOWED = 'notAllowed',
    NOT_FOUND = 'notFound',
    ALREADY_EXISTS = 'alreadyExists',
}

export enum UserStatus {
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

export interface Response {
    type: RequestType;
    id?: string;
    status: ResponseStatus;
    data: LobbyStatusData | UserStateData | ShopStateData;
}
