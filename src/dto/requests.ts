import { Position } from '../domain/domain';

export enum RequestType {
    JOIN = 'join',
    CREATE_ROOM = 'createRoom',
    DESTROY_ROOM = 'destroyRoom',
    JOIN_ROOM = 'joinRoom',
    LEAVE_ROOM = 'leaveRoom',
    LOBBY_STATUS = 'lobbyStatus',
    CONFIGURATION_ACTION = 'configuratorAction',
    USER_STATUS = 'userStatus',
    SHOP_STATUS = 'shopStatus',
    SHOP_ACTION = 'shopAction',
    START_GAME = 'startGame',
    HAME_ACTION = 'gameAction',
    NEXT_GAME_PHASE = 'nextGamePhase',
    GAME_STATE = 'gameState',
}

export enum AtionType {
    USE = 'use',
    EQUIP = 'equip',
    UNEQUIP = 'unequip',
    PLACE = 'place',
    MOVE = 'move',
    BUY = 'buy',
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
    class: string;
}
export interface CreateRoomRequestData extends RequestData {
    capacity: number;
    scenarioUid: number;
}

export interface JoinGameRoomRequestData extends RequestData {
    roomUid: number;
}

export interface ActionData extends RequestData {
    action: AtionType;
    uid?: number;
    targetUid?: number;
    itemUid?: number;
    quantity?: number;
    position?: Position;
}
