import { Action, EmploymentStatus, GameEvent, GameShop, GameUnit, PlayerInfo, RoomInfo, UnitBooty } from '../domain/domain';
import { RequestType } from './requests';

export const KEY_SESSION_ID: string = 'sessionId';
export const KEY_IS_NEW_PLAYER: string = 'isNewPlayer';
export const KEY_TOKEN: string = 'token';
export const VALUE_TRUE: string = 'true';
export const VALUE_FALSE: string = 'false';

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
    AT_JOB = 'atJob',
}

export interface UserStateData {
    sessionId: string;
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

export interface JobStatusData {
    employment: EmploymentStatus;
}

export interface CompleteJobData {
    reward: UnitBooty;
}

export interface Response {
    type: RequestType;
    id?: string;
    status: ResponseStatus;
    data: LobbyStatusData | UserStateData | ShopStateData | GameStateData | PlayerInfoData |
    GameNextPhaseData | GameActionData | RoomStatusData | JobStatusData | CompleteJobData;
}
