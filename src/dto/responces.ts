import { GameUnit, RoomInfo } from '../domain/domain';
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

export interface UserStateData {
    userId: string;
    userNickname: string;
    unit: GameUnit;
}

export interface LobbyStatusData {
    rooms: RoomInfo[];
    usersCount: number;
}

export interface Response {
    type: RequestType;
    id?: string;
    status: ResponseStatus;
    data: LobbyStatusData | UserStateData | any;
}
