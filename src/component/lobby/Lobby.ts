import { injectable, singleton } from 'tsyringe';
import { BUTTON_CREATE_ROOM, ROOMS_CONTAINER } from '../../constants/Components';
import { RoomInfo } from '../../domain/domain';
import { RequestType } from '../../dto/requests';
import { LobbyStatusData, Response, ResponseStatus } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Room from './Room';

@injectable()
@singleton()
export default class Lobby extends Component implements ServerCommunicatorHandler {
    private readonly rooms: Map<number, Room> = new Map();

    @component(BUTTON_CREATE_ROOM, Button)
    private readonly createRoomButton: Button;

    constructor(private readonly communicator: ServerCommunicatorService,
        private readonly gameState: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.hide();
        this.communicator.subscribe([RequestType.LOBBY_STATUS], this);
    }

    public show(): void {
        this.communicator.sendMessage(RequestType.LOBBY_STATUS);
        super.show();
    }

    handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        const roomInfos: RoomInfo[] = (response.data as LobbyStatusData).rooms;
        const roomIds: number[] = [];
        roomInfos.forEach(roomInfo => {
            const room = this.rooms.get(roomInfo.uid) || Room.createRoom(this, ROOMS_CONTAINER);
            this.rooms.set(roomInfo.uid, room!);
            room!.update(roomInfo);
            roomIds.push(roomInfo.uid);
        });
        this.rooms.forEach((room, uid) => {
            if (!roomIds.includes(uid)) {
                room.destroy();
            }
        });
    }
}
