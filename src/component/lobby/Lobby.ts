import { convert } from 'html-to-text';
import { delay, inject, injectable, singleton } from 'tsyringe';
import { BUTTON_CONFIGURATOR, BUTTON_CREATE_ROOM_ADVANCED, BUTTON_CREATE_ROOM_EASY, BUTTON_CREATE_ROOM_MEDIUM, INPUT_LOBBY_CHAT_MESSAGE, LABEL_USERS_COUNT, LOBBY_CHAT, ROOMS_CONTAINER, SELECT_ROOMS_CONTAINER, UNIT_ICON, UNIT_INFO } from '../../constants/Components';
import { SCENARIO_IDS } from '../../constants/Configuration';
import { ChatMessage, ChatParticipant, ChatState, RoomInfo } from '../../domain/domain';
import { ChatMessageRequestData, CreateRoomRequestData, RequestType } from '../../dto/requests';
import { ChatMessageData, ChatParticipantData, ChatStateData, LobbyStatusData, Response, ResponseStatus, RoomStatusData, ServerStatusData } from '../../dto/responces';
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

@injectable()
@singleton()
export default class Lobby extends Component implements ServerCommunicatorHandler {
    @component(SELECT_ROOMS_CONTAINER, Container)
    private readonly selectRoomsSetcion: Container;
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

    private readonly rooms: Map<number, Room> = new Map();
    private chatState: ChatState;

    constructor(private readonly communicator: ServerCommunicatorService,
        @inject(delay(() => UnitConfigurator)) private readonly unitConfigurator: UnitConfigurator,
        private readonly state: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.hide();
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
            RequestType.LOBBY_CHAT_MESSAGE,
            RequestType.LOBBY_CHAT_STATE,
            RequestType.LOBBY_CHAT_PARTICIPANT,
        ], this);
        this.initChat();
    }

    protected initChat(): void {
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
        this.communicator.sendMessage(RequestType.LOBBY_STATUS);
        this.communicator.sendMessage(RequestType.LOBBY_CHAT_STATE);
        super.show();
    }

    public handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        switch (response.type) {
            case RequestType.SERVER_STATUS:
                this.onServerStatus(response.data as ServerStatusData);
                break;
            case RequestType.LOBBY_STATUS:
                this.onLobbyStatus(response.data as LobbyStatusData);
                break;
            case RequestType.ROOM_STATUS:
                if (!this.state.userState) { return; }
                this.onRoomStatus(response.data as RoomStatusData);
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
        const nickname = this.chatState.participants[message.from].nickname;
        const colorClass = message.from == this.state.userState.playerInfo.playerId ? 'light-green lighten-1' : 'light-blue lighten-1';
        this.chat.value =
            `<span class="${colorClass}">${nickname}</span><br>` +
            convert(message.message) + '<br>' +
            this.chat.value;
    }

    protected onServerStatus(data: ServerStatusData): void {
        this.state.usersNumber = data.usersNumber;
        this.updateUsersInfo();
    }

    protected onLobbyStatus(data: LobbyStatusData): void {
        this.state.rooms = data.rooms;
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
        isUserInRooms ? this.selectRoomsSetcion.hide() : this.selectRoomsSetcion.show();
        this.createRoomEasyButton.enabled = !isUserInRooms;
        this.createRoomMediumButton.enabled = !isUserInRooms;
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
