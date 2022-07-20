import { container, injectable } from 'tsyringe';
import { BUTTON_JOIN, BUTTON_JOIN_ROOM, BUTTON_LEAVE_ROOM, PRFX_CONNECTION_STATUS, PRFX_USER_ICON, PRFX_USER_LEVEL, PRFX_USER_NAME, PRFX_USER_PLACEHOLDER } from '../../constants/Components';
import { ROOM_DESIGN } from '../../constants/Resources';
import { RoomInfo } from '../../domain/domain';
import ResourceLoaderService from '../../service/ResourceLoaderService';
import Component from '../Component';
import Icon from '../ui/icon/Icon';
import Label from '../ui/label/Label';
import Container from '../ui/container/Container';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import { JoinGameRoomRequestData, RequestType } from '../../dto/requests';

@injectable()
export default class Room extends Component {
    private readonly userPlaceholders: Container[] = [];
    private readonly userNameLabels: Label[] = [];
    private readonly userLevelLabels: Label[] = [];
    private readonly userConnectionStatusLabels: Label[] = [];
    private readonly userIcons: Icon[] = [];

    @component(BUTTON_JOIN_ROOM, Button)
    private readonly joinRoomButton: Button;
    @component(BUTTON_LEAVE_ROOM, Button)
    private readonly leaveRoomButton: Button;

    private roomInfo: RoomInfo;

    constructor(private readonly communicator: ServerCommunicatorService,
        private readonly gameState: GameStateService) {
        super();
    }

    public static createRoom(parent: Component, containerId: string): Room | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        const component: Room | null = parent.create(containerId, resourceLoader.get(ROOM_DESIGN), Room);
        return component;
    }

    public update(roomInfo: RoomInfo, isUserInRooms: boolean): void {
        this.roomInfo = roomInfo;

        this.userPlaceholders.forEach(p => p.hide());

        this.userPlaceholders[0].show();
        this.userNameLabels[0].value = roomInfo.host.nickname;
        this.userLevelLabels[0].value = `Level: ${roomInfo.host.level}`;
        this.userIcons[0].icon = roomInfo.host.class;
        this.userConnectionStatusLabels[0].value = roomInfo.host.isOffline ? '⚫' : '🟢';

        roomInfo.joinedUsers.forEach((user, i) => {
            this.userPlaceholders[i + 1].show();
            this.userNameLabels[i + 1].value = user.nickname;
            this.userLevelLabels[i + 1].value = `Level: ${user.level}`;
            this.userIcons[i + 1].icon = user.class;
            this.userConnectionStatusLabels[i + 1].value = user.isOffline ? '⚫' : '🟢';
        });

        const isUserInRoom: boolean = this.gameState.isUserInRoom(roomInfo);
        if (isUserInRoom) {
            this.joinRoomButton.hide();
            this.leaveRoomButton.show();
        } else if (isUserInRooms) {
            this.joinRoomButton.show();
            this.leaveRoomButton.hide();
            this.joinRoomButton.disable();
        } else {
            this.joinRoomButton.show();
            this.leaveRoomButton.hide();
            this.joinRoomButton.enable();
        }
    }

    protected initialize(): void {
        for (let i = 1; i <= 4; i++) {
            this.userPlaceholders.push(this.instantiate(PRFX_USER_PLACEHOLDER + i, Container)!);
            this.userNameLabels.push(this.instantiate(PRFX_USER_NAME + i, Label)!);
            this.userLevelLabels.push(this.instantiate(PRFX_USER_LEVEL + i, Label)!);
            this.userConnectionStatusLabels.push(this.instantiate(PRFX_CONNECTION_STATUS + i, Label)!);
            this.userIcons.push(this.instantiate(PRFX_USER_ICON + i, Icon)!);

            this.userPlaceholders[i - 1].hide();
        }

        this.joinRoomButton.onClick = target => this.doJoinRoom();
        this.leaveRoomButton.onClick = target => this.doLeaveRoom();
    }

    public destroy(): void {
        this.joinRoomButton.destroy();
        this.leaveRoomButton.destroy();
        super.destroy();
    }

    protected doJoinRoom(): void {
        this.communicator.sendMessage(RequestType.JOIN_ROOM, { roomUid: this.roomInfo.uid } as JoinGameRoomRequestData);
    }

    protected doLeaveRoom(): void {
        if (this.roomInfo.host.nickname === this.gameState.userState.playerInfo.nickname) {
            this.communicator.sendMessage(RequestType.DESTROY_ROOM);
        } else {
            this.communicator.sendMessage(RequestType.LEAVE_ROOM);
        }
    }
}
