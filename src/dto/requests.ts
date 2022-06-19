export enum RequestType {
    JOIN = 'join',
    LOBBY_STATUS = 'lobbyStatus',
    CREATE_ROOM = 'createRoom',
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
