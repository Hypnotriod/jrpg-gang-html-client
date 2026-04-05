import { convert } from 'html-to-text';
import { injectable, singleton } from 'tsyringe';
import { ACHIEVEMENT_POPUP, BATTLEFIELD_CONTAINER, BOOTY_CONTAINER, GAME_FLOW_CONTROLS_CONTAINER as FLOW_CONTROLS_CONTAINER, GAME_CHAT, GAME_LOG, INPUT_GAME_CHAT_MESSAGE, ITEM_DESCRIPTION_POPUP, UNITS_QUEUE_CONTAINER, UNIT_ITEMS_CONTAINER } from '../../constants/Components';
import { ActionResultType, ActionType, ChatMessage, ChatState, GameEvent, GamePhase, GameUnit, ItemType } from '../../domain/domain';
import { ChatMessageRequestData, RequestType } from '../../dto/requests';
import { ChatMessageData, ChatStateData, GameActionData, GameNextPhaseData, GameStateData, PlayerInfoData, Response, ResponseStatus, UserStateData, UserStatus } from '../../dto/responces';
import ActionService from '../../service/ActionService';
import GameObjectRenderer from '../../service/GameObjectRenderer';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import { SoundName, SoundService } from '../../service/SoundService';
import { AchievementPopup } from '../achievements/AchievementPopup';
import { component } from '../decorator/decorator';
import TextInput from '../ui/input/TextInput';
import ObjectDescription from '../ui/popup/ObjectDescription';
import TextField from '../ui/textfield/TextField';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';
import GameBase from './GameBase';
import GameBattlefield from './GameBattlefield';
import GameBooty from './GameBooty';
import GameFlowControls from './GameFlowControls';
import GameUnitItems from './GameUnitItems';
import GameUnitsQueue from './GameUnitsQueue';

@injectable()
@singleton()
export default class GameScene extends GameBase implements ServerCommunicatorHandler {
    @component(GAME_LOG, TextField)
    private readonly gameLog: TextField;
    @component(GAME_CHAT, TextField)
    private readonly chat: TextField;
    @component(INPUT_GAME_CHAT_MESSAGE, TextInput)
    private readonly chatMessageInput: TextInput;
    @component(ITEM_DESCRIPTION_POPUP, ObjectDescription)
    private readonly objectDescription: ObjectDescription;
    @component(ACHIEVEMENT_POPUP, AchievementPopup)
    private readonly achievementPopup: AchievementPopup;
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
            RequestType.GAME_CHAT_MESSAGE,
            RequestType.GAME_CHAT_STATE,
        ], this);
        super.initialize();
        this.hide();
        this.objectDescription.hide();
        this.addHorizontalScroll(this.findChild(UNIT_ITEMS_CONTAINER)!, 78);
        this.unitItems.objectDescription = this.objectDescription;
        this.unitsQueue.objectDescription = this.objectDescription;
        this.battlefield.objectDescription = this.objectDescription;
        this.battlefield.unitItems = this.unitItems;
        this.initChat();
    }

    protected initChat(): void {
        this.chatMessageInput.onEnter = input => {
            this.communicator.sendMessage(RequestType.GAME_CHAT_MESSAGE, {
                message: input.value,
            } satisfies ChatMessageRequestData);
            input.value = '';
        };
        this.chatMessageInput.maxLength = 128;
    }

    public handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) {
            SoundService.play(SoundName.DENIED);
            return;
        }
        switch (response.type) {
            case RequestType.GAME_STATE:
                this.state.gameState = (response.data as GameStateData).gameState;
                this.handleGameState();
                this.communicator.sendMessage(RequestType.GAME_CHAT_STATE);
                break;
            case RequestType.GAME_ACTION:
            case RequestType.NEXT_GAME_PHASE:
                const corpsesNumber = this.state.gameState?.spot.battlefield.corpses?.length ?? 0;
                this.state.gameState = (response.data as GameActionData | GameNextPhaseData).actionResult;
                this.handleGameAction();
                if (corpsesNumber < (this.state.gameState?.spot.battlefield.corpses?.length ?? 0)) {
                    SoundService.play(SoundName.DEATH);
                }
                break;
            case RequestType.PLAYER_INFO:
                this.state.playerInfo = (response.data as PlayerInfoData).playerInfo;
                this.handlePlayerInfo();
                break;
            case RequestType.USER_STATUS:
                const status: UserStatus = (response.data as UserStateData).status;
                this.handleUserStatus(status);
                break;
            case RequestType.GAME_CHAT_MESSAGE:
                const message: ChatMessage = (response.data as ChatMessageData).message;
                this.addChatMessage(message);
                break;
            case RequestType.GAME_CHAT_STATE:
                const chatState: ChatState = (response.data as ChatStateData).chat;
                this.handleChatState(chatState);
                break;
        }
    }

    public override show(): void {
        this.communicator.sendMessage(RequestType.GAME_CHAT_STATE);
        super.show();
        this.unitItems.destroy();
        if (this.state.gameState?.nextPhase === GamePhase.PREPARE_UNIT) {
            SoundService.play(SoundName.DOOR);
            SoundService.play(SoundName.HORN, { delayMs: 700 });
        }
    }

    public handleConnectionLost(): void {
        this.hide();
        this.destroy();
    }

    public destroy(): void {
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
            SoundService.play(SoundName.DOOR);
            SoundService.play(SoundName.HORN, { delayMs: 700 });
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
        this.handleAchievements();
        this.handleGameActionSound();
    }

    private handleAchievements(): void {
        const achievements = this.state.gameState.unitActionResult?.result.achievements ??
            this.state.gameState.endRoundResult?.achievements ??
            this.state.gameState.spotCompleteResult?.achievements;
        if (!achievements) return;
        Object.keys(achievements)
            .filter(uid => this.isCurrentPlayerUnitId(Number(uid)))
            .forEach(uid => {
                Object.keys(achievements[Number(uid)]).forEach(code => this.achievementPopup.pop(code, this.playersUnit()));
            })
    }

    private handleGameActionSound(): void {
        const actionresult = this.state.gameState.unitActionResult?.result.result;
        const actionType = this.state.gameState.unitActionResult?.action.action;
        if (actionresult === ActionResultType.CANT_USE ||
            actionresult === ActionResultType.IS_BROKEN ||
            actionresult === ActionResultType.NOT_ALLOWED ||
            actionresult === ActionResultType.NOT_EUIPPED ||
            actionresult === ActionResultType.NOT_REACHABLE ||
            actionresult === ActionResultType.NO_AMMUNITION ||
            actionresult === ActionResultType.NOT_EMPTY ||
            actionresult === ActionResultType.NOT_ENOUGH_RESOURCES ||
            actionresult === ActionResultType.NOT_ENOUGH_SLOTS ||
            actionresult === ActionResultType.NOT_FOUND
        ) {
            SoundService.play(SoundName.DENIED);
            return;
        }
        if ((this.state.gameState.nextPhase === GamePhase.ACTION_COMPLETE ||
            this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) &&
            (actionType === ActionType.PLACE || actionType === ActionType.MOVE)
        ) {
            SoundService.play(SoundName.MOVE);
        }
        if (this.state.gameState.nextPhase !== this.state.gameState.phase &&
            (this.state.gameState.nextPhase === GamePhase.SPOT_COMPLETE ||
                this.state.gameState.nextPhase === GamePhase.SCENARIO_COMPLETE)
        ) {
            SoundService.play(SoundName.COMPLETE);
        }
        if (actionType === ActionType.EQUIP || actionType === ActionType.UNEQUIP) {
            SoundService.play(SoundName.EQUIP);
        }
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
        this.chat.value = '';
        this.chatState = chatState;
        this.chatState.messages.forEach(message => this.addChatMessage(message));
    }

    protected addChatMessage(message: ChatMessage): void {
        const nickname = this.chatState.participants[message.from].nickname;
        const colorClass = this.isCurrentPlayerId(message.from) ? 'light-green lighten-1' : 'light-blue lighten-1';
        this.chat.value =
            `<span class="${colorClass}">${nickname}</span><br>` +
            convert(message.message) + '<br>' +
            this.chat.value;
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
