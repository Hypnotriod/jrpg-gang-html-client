import { injectable, singleton } from 'tsyringe';
import { BATTLEFIELD_CONTAINER, BOOTY_CONTAINER, BUTTON_TAB_GAME_CHAT, BUTTON_TAB_GAME_LOG, GAME_FLOW_CONTROLS_CONTAINER as FLOW_CONTROLS_CONTAINER, GAME_CHAT, GAME_LOG, INPUT_GAME_CHAT_MESSAGE, ITEM_DESCRIPTION_POPUP, UNITS_QUEUE_CONTAINER, UNIT_ITEMS_CONTAINER } from '../../constants/Components';
import { ChatMessage, ChatState, GameEvent, GamePhase, GameUnit, ItemType } from '../../domain/domain';
import { ChatMessageRequestData, RequestType } from '../../dto/requests';
import { ChatMessageData, ChatStateData, GameActionData, GameNextPhaseData, GameStateData, PlayerInfoData, Response, ResponseStatus, UserStateData, UserStatus } from '../../dto/responces';
import ActionService from '../../service/ActionService';
import GameObjectRenderer from '../../service/GameObjectRenderer';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import { component } from '../decorator/decorator';
import ObjectDescription from '../ui/popup/ObjectDescription';
import TextField from '../ui/textfield/TextField';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';
import GameBase from './GameBase';
import GameBattlefield from './GameBattlefield';
import GameBooty from './GameBooty';
import GameFlowControls from './GameFlowControls';
import GameUnitItems from './GameUnitItems';
import GameUnitsQueue from './GameUnitsQueue';
import Button from '../ui/button/Button';
import TextInput from '../ui/input/TextInput';

@injectable()
@singleton()
export default class GameScene extends GameBase implements ServerCommunicatorHandler {
    @component(GAME_LOG, TextField)
    private readonly gameLog: TextField;
    @component(GAME_CHAT, TextField)
    private readonly gameChat: TextField;
    @component(INPUT_GAME_CHAT_MESSAGE, TextInput)
    private readonly chatMessageInput: TextInput;
    @component(BUTTON_TAB_GAME_CHAT, Button)
    private readonly buttonGameChat: Button;
    @component(BUTTON_TAB_GAME_LOG, Button)
    private readonly buttonGameLog: Button;
    @component(ITEM_DESCRIPTION_POPUP, ObjectDescription)
    private readonly objectDescription: ObjectDescription;
    @component(UNITS_QUEUE_CONTAINER, GameUnitsQueue)
    private readonly unitsQueue: GameUnitsQueue;
    @component(BOOTY_CONTAINER, GameBooty)
    private readonly booty: GameBooty;
    @component(UNIT_ITEMS_CONTAINER, GameUnitItems)
    private readonly unitItems: GameUnitItems;
    @component(FLOW_CONTROLS_CONTAINER, GameFlowControls)
    private readonly flowControls: GameFlowControls;
    @component(BATTLEFIELD_CONTAINER, GameBattlefield)
    private readonly battlefield: GameBattlefield;

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly configurator: UnitConfigurator,
        private readonly renderer: GameObjectRenderer,
        private readonly state: GameStateService,
        private readonly actionService: ActionService) {
        super(state, actionService);
    }

    protected initialize(): void {
        this.communicator.subscribe([
            RequestType.GAME_STATE,
            RequestType.USER_STATUS,
            RequestType.NEXT_GAME_PHASE,
            RequestType.GAME_ACTION,
            RequestType.PLAYER_INFO,
            RequestType.CHAT_MESSAGE,
            RequestType.CHAT_STATE,
        ], this);
        super.initialize();
        this.hide();
        this.objectDescription.hide();
        this.addHorizontalScroll(this.findChild(UNIT_ITEMS_CONTAINER)!, 78);
        this.unitItems.objectDescription = this.objectDescription;
        this.unitsQueue.objectDescription = this.objectDescription;
        this.battlefield.objectDescription = this.objectDescription;
        this.battlefield.unitItems = this.unitItems;
        this.initGameChat();
    }

    protected initGameChat(): void {
        this.buttonGameChat.onClick = _ => {
            this.gameChat.show();
            this.gameLog.hide();
            this.chatMessageInput.show();
            this.buttonGameChat.disable();
            this.buttonGameLog.enable();
        };
        this.buttonGameLog.onClick = _ => {
            this.gameLog.show();
            this.gameChat.hide();
            this.chatMessageInput.hide();
            this.buttonGameChat.enable();
            this.buttonGameLog.disable();
        };
        this.chatMessageInput.onEnter = input => {
            this.communicator.sendMessage(RequestType.CHAT_MESSAGE, {
                message: input.value,
            } satisfies ChatMessageRequestData);
            input.value = '';
        };
        this.chatMessageInput.maxLength = 128;
        this.buttonGameChat.disable();
    }

    public handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        switch (response.type) {
            case RequestType.GAME_STATE:
                this.state.gameState = (response.data as GameStateData).gameState;
                this.handleGameState();
                this.communicator.sendMessage(RequestType.CHAT_STATE);
                break;
            case RequestType.GAME_ACTION:
            case RequestType.NEXT_GAME_PHASE:
                this.state.gameState = (response.data as GameActionData | GameNextPhaseData).actionResult;
                this.handleGameAction();
                break;
            case RequestType.PLAYER_INFO:
                this.state.playerInfo = (response.data as PlayerInfoData).playerInfo;
                this.handlePlayerInfo();
                break;
            case RequestType.USER_STATUS:
                const status: UserStatus = (response.data as UserStateData).status;
                this.handleUserStatus(status);
                break;
            case RequestType.CHAT_MESSAGE:
                const message: ChatMessage = (response.data as ChatMessageData).message;
                this.addChatMessage(message);
                break;
            case RequestType.CHAT_STATE:
                const chatState: ChatState = (response.data as ChatStateData).chat;
                this.handleChatState(chatState);
                break;
        }
    }

    public override show(): void {
        this.communicator.sendMessage(RequestType.CHAT_STATE);
        super.show();
    }

    public handleConnectionLost(): void {
        this.hide();
        this.destroy();
    }

    public destroy(): void {
        this.unitItems.destroy();
        this.battlefield.destroy();
        this.gameLog.value = '';
    }

    protected handleGameState(): void {
        this.updatePlayerInfoFromGameState(this.state.gameState);
        this.unitItems.update(this.activeItemTypes(this.state.gameState.phase));
        this.battlefield.updateBattleField();
        this.unitsQueue.updateUnitsQueue();
        this.booty.update();
        this.flowControls.update();
    }

    protected handleGameAction(): void {
        if (this.state.gameState.phase === GamePhase.SPOT_COMPLETE &&
            this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) {
            this.destroy();
        }
        this.updatePlayerInfoFromGameState(this.state.gameState);
        this.unitItems.update(this.activeItemTypes(this.state.gameState.nextPhase));
        this.unitsQueue.updateUnitsQueue();
        if (this.state.gameState.phase !== GamePhase.ACTION_COMPLETE ||
            this.state.gameState.phase !== this.state.gameState.nextPhase) {
            this.battlefield.updateBattleField();
            this.battlefield.updateActionTargets();
            this.battlefield.updateWithExperience();
        }
        this.booty.update();
        this.flowControls.update();
        this.flowControls.timeoutAutoNextPhase();
        this.logAction();
    }

    protected handlePlayerInfo(): void {
        this.unitItems.update(this.activeItemTypes(this.state.gameState.nextPhase));
        this.battlefield.updateBattleField();
        this.flowControls.update();
        this.flowControls.timeoutAutoNextPhase();
    }

    protected activeItemTypes(phase: GamePhase): ItemType[] {
        if (phase === GamePhase.PREPARE_UNIT) {
            return [ItemType.AMMUNITION, ItemType.ARMOR, ItemType.WEAPON];
        }
        if (phase === GamePhase.TAKE_ACTION && this.isCurrentUnitTurn()) {
            return [ItemType.AMMUNITION, ItemType.ARMOR, ItemType.WEAPON, ItemType.DISPOSABLE, ItemType.MAGIC];
        }
        if (phase === GamePhase.SPOT_COMPLETE) {
            return [ItemType.AMMUNITION, ItemType.ARMOR, ItemType.WEAPON, ItemType.PROVISION];
        }
        return [];
    }

    protected handleUserStatus(status: UserStatus): void {
        if (status !== UserStatus.IN_GAME && this.visible) {
            this.destroy();
            this.hide();
            this.configurator.show();
        }
    }

    protected handleChatState(chatState: ChatState): void {
        this.gameChat.value = '';
        this.chatState = chatState;
        this.chatState.messages.forEach(message => this.addChatMessage(message));
    }

    protected addChatMessage(message: ChatMessage): void {
        const nickname = this.chatState.participants[message.from].nickname;
        this.gameChat.value =
            (this.isCurrentPlayerId(message.from) ?
                `<span class="light-green lighten-1">${nickname}:</span><br>` :
                `<span class="light-blue lighten-1">${nickname}:</span><br>`) +
            message.message.replace(/(<([^>]+)>)/ig, '') + '<br>' +
            this.gameChat.value;
    }

    protected logAction(): void {
        if (this.state.gameState.unitActionResult) {
            const unit: GameUnit = this.findUnitByUid(this.state.gameState.unitActionResult.action.uid!);
            const name: string = this.getUnitName(unit);
            this.gameLog.value =
                this.renderer.header(name, 2) + '<br>' +
                this.renderer.render(this.distinguishUnitActionResult(this.state.gameState.unitActionResult)) +
                '--------------------<br>' + this.gameLog.value;
        }
        if (this.state.gameState.endRoundResult) {
            this.gameLog.value =
                this.renderer.header('End Round result', 2) + '<br>' +
                this.renderer.render(this.distinguishEndRoundResult(this.state.gameState.endRoundResult)) +
                '--------------------<br>' + this.gameLog.value;
        }
        if (this.state.gameState.spotCompleteResult) {
            this.gameLog.value =
                this.renderer.header('End Battle result', 2) + '<br>' +
                this.renderer.render(this.distinguishSpotCompleteResultResult(this.state.gameState.spotCompleteResult)) +
                '--------------------<br>' + this.gameLog.value;
        }
    }

    protected updatePlayerInfoFromGameState(gameState: GameEvent): void {
        if (!this.state.playerInfo) { return; }
        this.state.playerInfo = gameState.players.filter(player => player.nickname === this.state.playerInfo.nickname)[0];
    }
}
