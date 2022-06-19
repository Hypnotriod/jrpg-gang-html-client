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

export interface PlayerInfo {
    nickname: string;
    class: string;
    level: number;
}

export interface RoomInfo {
    uid: number;
    capacity: number;
    scenarioUid: number;
    joinedUsers: PlayerInfo[];
    host: PlayerInfo;
}

export interface LobbyStatusData {
    rooms: RoomInfo[];
    usersCount: number;
}

export interface Response {
    type: RequestType;
    id?: string;
    status: ResponseStatus;
    data: LobbyStatusData | any;
}
