import { Action, ActionType, Position } from '../domain/domain';

export enum RequestType {
    JOIN = 'join',
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
    playerId?: string;
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
