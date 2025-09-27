import { delay, inject, injectable, singleton } from 'tsyringe';
import { BUTTON_CREATE_ROOM_EASY, BUTTON_CONFIGURATOR, LABEL_USERS_COUNT, ROOMS_CONTAINER, UNIT_ICON, UNIT_INFO, BUTTON_CREATE_ROOM_ADVANCED } from '../../constants/Components';
import { RoomInfo } from '../../domain/domain';
import { CreateRoomRequestData, RequestType } from '../../dto/requests';
import { LobbyStatusData, Response, ResponseStatus, RoomStatusData } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Container from '../ui/container/Container';
import Icon from '../ui/icon/Icon';
import Label from '../ui/label/Label';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';
import Room from './Room';

@injectable()
@singleton()
export default class Lobby extends Component implements ServerCommunicatorHandler {
    private readonly rooms: Map<number, Room> = new Map();

    @component(BUTTON_CREATE_ROOM_EASY, Button)
    private readonly createRoomEasyButton: Button;
    @component(BUTTON_CREATE_ROOM_ADVANCED, Button)
    private readonly createRoomAdvancedButton: Button;
    @component(BUTTON_CONFIGURATOR, Button)
    private readonly configuratorButton: Button;
    @component(UNIT_ICON, Icon)
    private readonly unitIcon: Icon;
    @component(UNIT_INFO, Container)
    private readonly unitInfo: Container;
    @component(LABEL_USERS_COUNT, Label)
    protected readonly usersCountLabel: Label;

    constructor(private readonly communicator: ServerCommunicatorService,
        // @ts-ignore
        @inject(delay(() => UnitConfigurator)) private readonly unitConfigurator: UnitConfigurator,
        private readonly state: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.hide();
        this.createRoomEasyButton.disable();
        this.createRoomEasyButton.onClick = target => this.onCreateRoom('easy-01');
        this.createRoomAdvancedButton.disable();
        this.createRoomAdvancedButton.onClick = target => this.onCreateRoom('advanced-01');
        this.configuratorButton.onClick = target => this.goToUnitConfig();
        this.communicator.subscribe([RequestType.LOBBY_STATUS, RequestType.ROOM_STATUS], this);
    }

    protected goToUnitConfig(): void {
        this.hide();
        this.communicator.sendMessage(RequestType.EXIT_LOBBY);
        this.unitConfigurator.show();
    }

    public show(): void {
        this.communicator.sendMessage(RequestType.LOBBY_STATUS);
        super.show();
    }

    public handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        switch (response.type) {
            case RequestType.LOBBY_STATUS:
                this.onLobbyStatus(response.data as LobbyStatusData);
                break;
            case RequestType.ROOM_STATUS:
                if (!this.state.userState) { return; }
                this.onRoomStatus(response.data as RoomStatusData);
                break;
        }

    }

    protected onLobbyStatus(data: LobbyStatusData): void {
        this.state.rooms = data.rooms;
        this.state.usersCount = data.usersCount;
        this.update();
    }

    protected onRoomStatus(data: RoomStatusData): void {
        const roomInfo: RoomInfo = data.room;
        this.state.rooms = this.state.rooms || [roomInfo];
        const oldRoomInfo = this.state.rooms.find(r => r.uid === roomInfo.uid);
        if (roomInfo.inactive) {
            this.state.rooms = this.state.rooms.filter(r => r.uid !== roomInfo.uid);
        } else if (!oldRoomInfo) {
            this.state.rooms.push(roomInfo);
        } else {
            oldRoomInfo.joinedUsers = roomInfo.joinedUsers;
            oldRoomInfo.host = roomInfo.host;
        }
        this.state.usersCount = data.usersCount;
        this.update();
    }

    protected update(): void {
        const isUserInRooms: boolean = this.state.isUserInRooms(this.state.rooms);
        this.usersCountLabel.value = `Users Number: ${this.state.usersCount}`;
        this.updateRooms(this.state.rooms, isUserInRooms);
        this.updateState(isUserInRooms);
        this.updateUnitInfo();
    }

    public handleConnectionLost(): void {
        this.hide();
    }

    protected updateUnitInfo(): void {
        this.unitIcon.icon = this.state.userState.playerInfo.class;
        this.unitInfo.value = this.state.userState.playerInfo.nickname;
    }

    protected updateRooms(roomInfos: RoomInfo[], isUserInRooms: boolean): void {
        const roomIds: number[] = roomInfos.map(roomInfo => this.updateRoom(roomInfo, isUserInRooms));
        this.rooms.forEach((room, uid) => {
            if (!roomIds.includes(uid)) {
                room.destroy();
                this.rooms.delete(uid);
            }
        });
    }

    protected updateRoom(roomInfo: RoomInfo, isUserInRooms: boolean): number {
        const room = this.rooms.get(roomInfo.uid) || Room.createRoom(this, ROOMS_CONTAINER);
        this.rooms.set(roomInfo.uid, room!);
        room!.update(roomInfo, isUserInRooms);
        return roomInfo.uid;
    }

    protected updateState(isUserInRooms: boolean): void {
        this.createRoomEasyButton.enabled = !isUserInRooms;
        this.createRoomAdvancedButton.enabled = !isUserInRooms;
        this.configuratorButton.enabled = !isUserInRooms;
    }

    protected onCreateRoom(scenarioId: string): void {
        this.communicator.sendMessage(RequestType.CREATE_ROOM, {
            capacity: 4,
            scenarioId, // todo: make room creation dialog
        } as CreateRoomRequestData);
    }
}
