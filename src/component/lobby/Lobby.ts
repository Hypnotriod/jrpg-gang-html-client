import { delay, inject, injectable, singleton } from 'tsyringe';
import { BUTTON_CREATE_ROOM, BUTTON_UNIT, ROOMS_CONTAINER } from '../../constants/Components';
import { RoomInfo } from '../../domain/domain';
import { CreateRoomRequestData, RequestType } from '../../dto/requests';
import { LobbyStatusData, Response, ResponseStatus } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';
import Room from './Room';

@injectable()
@singleton()
export default class Lobby extends Component implements ServerCommunicatorHandler {
    private readonly rooms: Map<number, Room> = new Map();

    @component(BUTTON_CREATE_ROOM, Button)
    private readonly createRoomButton: Button;
    @component(BUTTON_UNIT, Button)
    private readonly unitButton: Button;

    constructor(private readonly communicator: ServerCommunicatorService,
        @inject(delay(() => UnitConfigurator)) private readonly unitConfigurator: UnitConfigurator,
        private readonly gameState: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.hide();
        this.createRoomButton.disable();
        this.createRoomButton.onClick = target => this.onCreateRoom();
        this.unitButton.onClick = target => this.goToUnitConfig();
        this.communicator.subscribe([RequestType.LOBBY_STATUS], this);
    }

    protected goToUnitConfig(): void {
        this.hide();
        this.unitConfigurator.show();
    }

    public show(): void {
        this.communicator.sendMessage(RequestType.LOBBY_STATUS);
        super.show();
    }

    public handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        const roomInfos: RoomInfo[] = (response.data as LobbyStatusData).rooms;
        const isUserInRooms: boolean = this.gameState.isUserInRooms(roomInfos);
        this.updateRooms(roomInfos, isUserInRooms);
        this.updateState(isUserInRooms);
    }

    protected updateRooms(roomInfos: RoomInfo[], isUserInRooms: boolean): void {
        const roomIds: number[] = [];
        roomInfos.forEach(roomInfo => {
            const room = this.rooms.get(roomInfo.uid) || Room.createRoom(this, ROOMS_CONTAINER);
            this.rooms.set(roomInfo.uid, room!);
            room!.update(roomInfo, isUserInRooms);
            roomIds.push(roomInfo.uid);
        });
        this.rooms.forEach((room, uid) => {
            if (!roomIds.includes(uid)) {
                room.destroy();
                this.rooms.delete(uid);
            }
        });
    }

    protected updateState(isUserInRooms: boolean): void {
        if (isUserInRooms) {
            this.createRoomButton.disable();
            this.unitButton.disable();
        } else {
            this.createRoomButton.enable();
            this.unitButton.enable();
        }
    }

    protected onCreateRoom(): void {
        this.communicator.sendMessage(RequestType.CREATE_ROOM, {
            capacity: 4,
            scenarioUid: 0,
        } as CreateRoomRequestData);
    }
}
