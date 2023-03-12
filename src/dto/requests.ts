import { Action, ActionType, Position } from '../domain/domain';

export enum RequestType {
    JOIN = 'join',
    LEAVE = 'leave',
    CREATE_ROOM = 'createRoom',
    DESTROY_ROOM = 'destroyRoom',
    ENTER_LOBBY = 'enterLobby',
    EXIT_LOBBY = 'exitLobby',
    JOIN_ROOM = 'joinRoom',
    LEAVE_ROOM = 'leaveRoom',
    LOBBY_STATUS = 'lobbyStatus',
    ROOM_STATUS = 'roomStatus',
    CONFIGURATION_ACTION = 'configuratorAction',
    USER_STATUS = 'userStatus',
    SHOP_STATUS = 'shopStatus',
    SHOP_ACTION = 'shopAction',
    START_GAME = 'startGame',
    LEAVE_GAME = 'leaveGame',
    GAME_ACTION = 'gameAction',
    NEXT_GAME_PHASE = 'nextGamePhase',
    GAME_STATE = 'gameState',
    PLAYER_INFO = 'playerInfo',
    APPLY_FOR_A_JOB = 'applyForAJob',
    QUIT_JOB = 'quitJob',
    COMPLETE_JOB = 'completeJob',
    JOBS_STATUS = 'jobsStatus',
}

export interface Request {
    type: RequestType;
    id: string;
    data?: RequestData;
}

export interface RequestData {
}

export interface JoinRequestData extends RequestData {
    token?: string;
    nickname?: string;
    sessionId?: string;
    class?: string;
}
export interface CreateRoomRequestData extends RequestData {
    capacity: number;
    scenarioId: string;
}

export interface JoinGameRoomRequestData extends RequestData {
    roomUid: number;
}

export interface ActionRequestData extends Action, RequestData {
}

export interface NextGamePhaseData extends RequestData {
    isReady: boolean;
}

export interface ApplyForAJobRequestData extends RequestData {
    code: string;
}
