import { convert } from 'html-to-text';
import { delay, inject, injectable, singleton } from 'tsyringe';
import { BUTTON_CONFIGURATOR, BUTTON_CREATE_ROOM_ADVANCED, BUTTON_CREATE_ROOM_EASY, BUTTON_CREATE_ROOM_MEDIUM, INPUT_LOBBY_CHAT_MESSAGE, ITEM_DESCRIPTION_POPUP, LABEL_USERS_COUNT, LOBBY_CHAT, ROOMS_CONTAINER, UNIT_BOOTY, UNIT_ICON, UNIT_INFO } from '../../constants/Components';
import { BASE_UNIT_DESCRIPTIONS, SCENARIO_IDS } from '../../constants/Configuration';
import { ChatMessage, ChatParticipant, ChatState, RoomInfo, UnitBooty } from '../../domain/domain';
import { ChatMessageRequestData, CreateRoomRequestData, RequestType } from '../../dto/requests';
import { ChatMessageData, ChatParticipantData, ChatStateData, LobbyStatusData, MercenariesStatusData, Response, ResponseStatus, RoomStatusData, ServerStatusData, UserStateData } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Container from '../ui/container/Container';
import Icon from '../ui/icon/Icon';
import TextInput from '../ui/input/TextInput';
import Label from '../ui/label/Label';
import TextField from '../ui/textfield/TextField';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';
import Room from './Room';
import ObjectDescription from '../ui/popup/ObjectDescription';
import { SoundName, SoundService } from '../../service/SoundService';
import MercenariesPopup from './MercenariesPopup';

@injectable()
@singleton()
export default class Lobby extends Component implements ServerCommunicatorHandler {
    @component(ROOMS_CONTAINER, Container)
    private readonly roomsContainer: Container;
    @component(BUTTON_CREATE_ROOM_EASY, Button)
    private readonly createRoomEasyButton: Button;
    @component(BUTTON_CREATE_ROOM_MEDIUM, Button)
    private readonly createRoomMediumButton: Button;
    @component(BUTTON_CREATE_ROOM_ADVANCED, Button)
    private readonly createRoomAdvancedButton: Button;
    @component(BUTTON_CONFIGURATOR, Button)
    private readonly configuratorButton: Button;
    @component(UNIT_ICON, Icon)
    private readonly unitIcon: Icon;
    @component(UNIT_INFO, Container)
    private readonly unitInfo: Container;
    @component(LABEL_USERS_COUNT, Label)
    private readonly usersCountLabel: Label;
    @component(LOBBY_CHAT, TextField)
    private readonly chat: TextField;
    @component(INPUT_LOBBY_CHAT_MESSAGE, TextInput)
    private readonly chatMessageInput: TextInput;
    @component(ITEM_DESCRIPTION_POPUP, ObjectDescription)
    private readonly objectDescription: ObjectDescription;
    @component('popup_shadow', Container)
    private readonly popupShadow: Container;
    @component('mercenaries_popup', MercenariesPopup)
    private readonly mercenariesPopup: MercenariesPopup;
    @component(UNIT_BOOTY, Label)
    private readonly unitBooty: Label;

    private readonly rooms: Map<number, Room> = new Map();
    private chatState: ChatState;

    constructor(private readonly communicator: ServerCommunicatorService,
        @inject(delay(() => UnitConfigurator)) private readonly unitConfigurator: UnitConfigurator,
        private readonly state: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.hide();
        this.objectDescription.hide();
        this.unitIcon.descriptionPopup = this.objectDescription;
        this.createRoomEasyButton.disable();
        this.createRoomEasyButton.onClick = target => this.onCreateRoom(SCENARIO_IDS.EASY);
        this.createRoomMediumButton.disable();
        this.createRoomMediumButton.onClick = target => this.onCreateRoom(SCENARIO_IDS.MEDIUM);
        this.createRoomAdvancedButton.disable();
        this.createRoomAdvancedButton.onClick = target => this.onCreateRoom(SCENARIO_IDS.ADVANCED);
        this.configuratorButton.onClick = target => this.goToUnitConfig();
        this.communicator.subscribe([
            RequestType.SERVER_STATUS,
            RequestType.LOBBY_STATUS,
            RequestType.ROOM_STATUS,
            RequestType.JOIN_ROOM,
            RequestType.USER_STATUS,
            RequestType.MERCENARIES_STATUS,
            RequestType.HIRE_MERCENARY,
            RequestType.LOBBY_CHAT_MESSAGE,
            RequestType.LOBBY_CHAT_STATE,
            RequestType.LOBBY_CHAT_PARTICIPANT,
        ], this);
        this.initChat();
        this.mercenariesPopup.shadow = this.popupShadow;
        this.mercenariesPopup.descriptionPopup = this.objectDescription;
    }

    protected initChat(): void {
        this.chat.autoScroll = true;
        this.chatMessageInput.onEnter = input => {
            this.communicator.sendMessage(RequestType.LOBBY_CHAT_MESSAGE, {
                message: input.value,
            } satisfies ChatMessageRequestData);
            input.value = '';
        };
        this.chatMessageInput.maxLength = 128;
    }

    protected goToUnitConfig(): void {
        this.hide();
        this.communicator.sendMessage(RequestType.EXIT_LOBBY);
        this.unitConfigurator.show();
    }

    public show(): void {
        this.communicator.sendMessage(RequestType.SERVER_STATUS);
        this.communicator.sendMessage(RequestType.MERCENARIES_STATUS);
        this.communicator.sendMessage(RequestType.LOBBY_CHAT_STATE);
        this.communicator.sendMessage(RequestType.LOBBY_STATUS);
        SoundService.play(SoundName.DRONE_MAIN, { skipIfPlaying: true, loop: true });
    }

    public handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        switch (response.type) {
            case RequestType.SERVER_STATUS:
                this.onServerStatus(response.data as ServerStatusData);
                break;
            case RequestType.LOBBY_STATUS:
                super.show();
                this.onLobbyStatus(response.data as LobbyStatusData);
                this.updateBooty();
                break;
            case RequestType.USER_STATUS:
                this.state.userState = response.data as UserStateData;
                this.updateBooty();
                break;
            case RequestType.MERCENARIES_STATUS:
                this.onMercenariesStatus(response.data as MercenariesStatusData);
                break;
            case RequestType.HIRE_MERCENARY:
                this.onRoomStatus(response.data as RoomStatusData);
                this.communicator.sendMessage(RequestType.USER_STATUS);
                this.communicator.sendMessage(RequestType.MERCENARIES_STATUS);
                SoundService.play(SoundName.TREASURE);
                break;
            case RequestType.ROOM_STATUS:
                if (!this.state.userState) { return; }
                this.onRoomStatus(response.data as RoomStatusData);
                break;
            case RequestType.JOIN_ROOM:
                this.roomsContainer.scrollTo({ top: 0 });
                break;
            case RequestType.LOBBY_CHAT_MESSAGE:
                const message: ChatMessage = (response.data as ChatMessageData).message;
                this.addChatMessage(message);
                break;
            case RequestType.LOBBY_CHAT_STATE:
                const chatState: ChatState = (response.data as ChatStateData).chat;
                this.handleChatState(chatState);
                break;
            case RequestType.LOBBY_CHAT_PARTICIPANT:
                const { playerId, participant } = (response.data as ChatParticipantData);
                this.handleChatparticipant(playerId, participant);
                break;
        }
    }

    protected updateBooty(): void {
        const bt: UnitBooty = this.state.userState.unit.booty;
        this.unitBooty.htmlValue = `${this.keyValueIcon('coin', bt.coins)}
                                    ${this.keyValueIcon('ruby', bt.ruby)}<br>`;
    }

    protected keyValueIcon(icon: string, value?: number): string {
        return `<img src="./assets/icons/${icon}.png" style="vertical-align: middle; padding-bottom: 4px; width: 12px;" /> ${value || 0}`;
    }

    protected handleChatparticipant(playerId: string, participant: ChatParticipant): void {
        if (!this.chatState) return;
        this.chatState.participants[playerId] = participant;
        this.updateUsersInfo();
    }

    protected handleChatState(chatState: ChatState): void {
        this.chat.value = '';
        this.chatState = chatState;
        this.chatState.messages.forEach(message => this.addChatMessage(message));
        this.updateUsersInfo();
    }

    protected addChatMessage(message: ChatMessage): void {
        const date = new Date(message.timestamp);
        const nickname = this.chatState.participants[message.from].nickname;
        const colorClass = message.from == this.state.userState.playerInfo.playerId ? 'light-green lighten-1' : 'light-blue lighten-1';
        this.chat.value +=
            `<span class="${colorClass}" style="font-size: 13px;">${nickname}</span><span class="grey-text" style="font-size: 11px;">${date.toLocaleTimeString()}</span><br>` +
            `<span style="font-size: 13px;">${convert(message.message)}<br>`;
    }

    protected onServerStatus(data: ServerStatusData): void {
        this.state.usersNumber = data.usersNumber;
        this.updateUsersInfo();
    }

    protected onLobbyStatus(data: LobbyStatusData): void {
        this.state.rooms = data.rooms;
        this.update();
    }

    protected onMercenariesStatus(data: MercenariesStatusData): void {
        this.mercenariesPopup.update(data.mercenaries.mercenaries);
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
            oldRoomInfo.mercenaries = roomInfo.mercenaries;
            oldRoomInfo.host = roomInfo.host;
        }
        this.update();
    }

    protected update(): void {
        const isUserInRooms: boolean = this.state.isUserInRooms(this.state.rooms);
        this.updateRooms(this.state.rooms, isUserInRooms);
        this.updateState(isUserInRooms);
        this.updateUnitInfo();
        this.updateUsersInfo();
    }

    protected updateUsersInfo(): void {
        if (!this.chatState) return;
        const inLobby = Object.keys(this.chatState.participants)
            .map(k => this.chatState.participants[k])
            .filter(p => p.unavailable !== true)
            .map(p => `<span class="green-text text-lighten-2">${p.nickname}</span>`);
        this.usersCountLabel.htmlValue =
            `<span class="orange-text text-lighten-1">Players online:</span> ${this.state.usersNumber ?? 0}<br>
            <span class="orange-text text-lighten-1">Players in lobby:</span> ${inLobby.length} ${inLobby.join(',')}`;
    }

    public handleConnectionLost(): void {
        this.hide();
    }

    protected updateUnitInfo(): void {
        const clazz = this.state.userState.playerInfo.class;
        this.unitIcon.icon = clazz
        this.unitInfo.value = this.state.userState.playerInfo.nickname;
        this.unitIcon.description = { [clazz]: BASE_UNIT_DESCRIPTIONS[clazz].description };
    }

    protected updateRooms(roomInfos: RoomInfo[], isUserInRooms: boolean): void {
        if (isUserInRooms) {
            this.rooms.forEach((room, uid) => {
                room.destroy();
                this.rooms.delete(uid);
            });
            const playerId = this.state.userState.playerInfo.playerId;
            const roomInInfo = roomInfos.find(r => r.host.playerId === playerId || r.joinedUsers.some(u => u.playerId === playerId))!;
            roomInfos = [roomInInfo, ...roomInfos.filter(r => r !== roomInInfo)];
        }
        const roomIds: number[] = roomInfos.map(roomInfo => this.updateRoom(roomInfo, isUserInRooms));
        this.rooms.forEach((room, uid) => {
            if (!roomIds.includes(uid)) {
                room.destroy();
                this.rooms.delete(uid);
            }
        });
    }

    protected updateRoom(roomInfo: RoomInfo, isUserInRooms: boolean): number {
        const room = this.rooms.get(roomInfo.uid) || Room.createRoom(this, ROOMS_CONTAINER)!;
        room.objectDescription = this.objectDescription;
        this.rooms.set(roomInfo.uid, room!);
        room.update(roomInfo, isUserInRooms);
        room.onHireMercenary((roomUid) => this.onHireMercenary(roomUid));
        return roomInfo.uid;
    }

    protected updateState(isUserInRooms: boolean): void {
        this.createRoomEasyButton.enabled = !isUserInRooms;
        this.createRoomMediumButton.enabled = !isUserInRooms;
        this.createRoomAdvancedButton.enabled = !isUserInRooms;
        this.configuratorButton.enabled = !isUserInRooms;
    }

    protected onCreateRoom(scenarioId: string): void {
        this.roomsContainer.scrollTo({ top: 0 });
        this.communicator.sendMessage(RequestType.CREATE_ROOM, {
            capacity: 4,
            scenarioId, // todo: make room creation dialog
        } as CreateRoomRequestData);
    }

    protected onHireMercenary(roomUid: number): void {
        this.mercenariesPopup.show();
        this.mercenariesPopup.roomUid = roomUid;
    }
}
