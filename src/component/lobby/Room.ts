import { container, injectable } from 'tsyringe';
import { BUTTON_JOIN_ROOM, BUTTON_LEAVE_ROOM, BUTTON_START_GAME, PRFX_CONNECTION_STATUS, PRFX_USER_ICON, PRFX_USER_LEVEL, PRFX_USER_NAME, PRFX_USER_PLACEHOLDER } from '../../constants/Components';
import { ROOM_DESIGN } from '../../constants/Resources';
import { RoomInfo } from '../../domain/domain';
import { JoinGameRoomRequestData, RequestType } from '../../dto/requests';
import GameStateService from '../../service/GameStateService';
import ResourceLoaderService from '../../service/ResourceLoaderService';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Container from '../ui/container/Container';
import Icon from '../ui/icon/Icon';
import Label from '../ui/label/Label';
import { BASE_UNIT_DESCRIPTIONS, SCENARIO_IDS } from '../../constants/Configuration';
import ObjectDescription from '../ui/popup/ObjectDescription';

@injectable()
export default class Room extends Component {
    private readonly userPlaceholders: Container[] = [];
    private readonly userNameLabels: Label[] = [];
    private readonly userLevelLabels: Label[] = [];
    private readonly userConnectionStatusLabels: Label[] = [];
    private readonly userIcons: Icon[] = [];
    private _objectDescription: ObjectDescription;
    private _hireMercenaryCallback?: (roomUid: number) => void;

    @component(BUTTON_JOIN_ROOM, Button)
    private readonly joinRoomButton: Button;
    @component(BUTTON_LEAVE_ROOM, Button)
    private readonly leaveRoomButton: Button;
    @component(BUTTON_START_GAME, Button)
    private readonly startGameButton: Button;
    @component('dungeon_label', Label)
    private readonly dungeonLabel: Label;
    @component('hire_mercenary_placeholder', Container)
    private readonly hireMercenaryPlaceholder: Container;
    @component('button_hire_mercenary', Button)
    private readonly hireMercenaryButton: Button;
    @component('mercenary_icon', Icon)
    private readonly mercenaryIcon: Icon;

    public set objectDescription(value: ObjectDescription) {
        this._objectDescription = value;
    }

    private roomInfo: RoomInfo;

    constructor(private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService) {
        super();
    }

    public static createRoom(parent: Component, containerId: string): Room | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        return parent.create(containerId, Room, { design: resourceLoader.get(ROOM_DESIGN) });
    }

    public update(roomInfo: RoomInfo, isUserInRooms: boolean): void {
        this.roomInfo = roomInfo;

        this.userPlaceholders.forEach(p => p.hide());

        const clazz = this.state.userState.playerInfo.class;
        this.userPlaceholders[0].show();
        this.userNameLabels[0].value = roomInfo.host.nickname;
        this.userLevelLabels[0].value = `Level: ${roomInfo.host.level}`;
        this.userIcons[0].icon = roomInfo.host.code;
        this.userIcons[0].descriptionPopup = this._objectDescription;
        this.userIcons[0].description = { [clazz]: BASE_UNIT_DESCRIPTIONS[roomInfo.host.code]?.description };
        this.userConnectionStatusLabels[0].htmlValue = roomInfo.host.isOffline ?
            '<img src="./assets/icons/offline.png"/>' : '<img src="./assets/icons/online.png"/>';

        [...roomInfo.joinedUsers, ...roomInfo.mercenaries].forEach((user, i) => {
            const clazz = user.class;
            this.userPlaceholders[i + 1].show();
            this.userNameLabels[i + 1].value = user.nickname;
            this.userLevelLabels[i + 1].value = `Level: ${user.level}`;
            this.userIcons[i + 1].icon = user.code;
            this.userIcons[i + 1].descriptionPopup = this._objectDescription;
            this.userIcons[i + 1].description = { [clazz]: BASE_UNIT_DESCRIPTIONS[user.code]?.description };

            this.userConnectionStatusLabels[i + 1].htmlValue = !user.playerId ? '' : user.isOffline ?
                '<img src="./assets/icons/offline.png"/>' : '<img src="./assets/icons/online.png"/>';
        });

        switch (roomInfo.scenarioId) {
            case SCENARIO_IDS.EASY:
                (this.findChild('icon_room') as HTMLImageElement).src = './assets/icons/dungeon_01.png';
                this.dungeonLabel.htmlValue = '<span class="blue-text lighten-2">Forgotten Ruins</span>';
                break;
            case SCENARIO_IDS.MEDIUM:
                (this.findChild('icon_room') as HTMLImageElement).src = './assets/icons/dungeon_02.png';
                this.dungeonLabel.htmlValue = '<span class="green-text lighten-2">Cursed Swamp</span>';
                break;
            case SCENARIO_IDS.ADVANCED:
                (this.findChild('icon_room') as HTMLImageElement).src = './assets/icons/dungeon_03.png';
                this.dungeonLabel.htmlValue = '<span class="red-text lighten-2">Dragon\'s Lair</span>';
                break;
        }

        const isUserInRoom: boolean = this.state.isUserInRoom(roomInfo);
        const isUserHostOfRoom: boolean = this.state.isUserHostOfRoom(roomInfo);
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
        isUserHostOfRoom ? this.startGameButton.enable() : this.startGameButton.disable();

        if (!isUserHostOfRoom || roomInfo.mercenaries.length || roomInfo.mercenaries.length + roomInfo.joinedUsers.length >= roomInfo.capacity - 1) {
            this.hireMercenaryPlaceholder.hide();
        } else {
            this.hireMercenaryPlaceholder.show();
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

        this.mercenaryIcon.icon = 'person';

        this.hireMercenaryButton.onClick = target => this._hireMercenaryCallback?.(this.roomInfo.uid);
        this.mercenaryIcon.onClick = target => this._hireMercenaryCallback?.(this.roomInfo.uid);

        this.joinRoomButton.onClick = target => this.doJoinRoom();
        this.leaveRoomButton.onClick = target => this.doLeaveRoom();
        this.startGameButton.onClick = target => this.doStartGame();
    }

    public onHireMercenary(callback: (roomUid: number) => void): void {
        this._hireMercenaryCallback = callback;
    }

    public doStartGame(): void {
        this.communicator.sendMessage(RequestType.START_GAME);
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
        if (this.roomInfo.host.nickname === this.state.userState.playerInfo.nickname) {
            this.communicator.sendMessage(RequestType.DESTROY_ROOM);
        } else {
            this.communicator.sendMessage(RequestType.LEAVE_ROOM);
        }
    }
}
