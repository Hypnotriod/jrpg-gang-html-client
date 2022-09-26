import { Action, AtionType, Position } from '../domain/domain';

export enum RequestType {
    JOIN = 'join',
    CREATE_ROOM = 'createRoom',
    DESTROY_ROOM = 'destroyRoom',
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
    id: string;
    type: RequestType;
    data?: RequestData;
}

export interface RequestData {
}

export interface JoinRequestData extends RequestData {
    nickname: string;
    userId: string;
    class: string;
}
export interface CreateRoomRequestData extends RequestData {
    capacity: number;
    scenarioId: string;
}

export interface JoinGameRoomRequestData extends RequestData {
    roomUid: number;
}

export interface GameActionRequestData extends Action, RequestData {
}

export interface ActionData extends RequestData {
    action: AtionType;
    uid?: number;
    targetUid?: number;
    itemUid?: number;
    quantity?: number;
    position?: Position;
}
