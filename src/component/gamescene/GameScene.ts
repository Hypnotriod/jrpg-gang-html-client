import { convert } from 'html-to-text';
import { injectable, singleton } from 'tsyringe';
import { ACHIEVEMENT_POPUP, BATTLEFIELD_CONTAINER, GAME_FLOW_CONTROLS_CONTAINER as FLOW_CONTROLS_CONTAINER, GAME_CHAT, GAME_LOG, INPUT_GAME_CHAT_MESSAGE, ITEM_DESCRIPTION_POPUP, LABEL_LOOT_COINS, LABEL_LOOT_RUBIES, UNITS_QUEUE_CONTAINER, UNIT_ITEMS_CONTAINER } from '../../constants/Components';
import { ActionResultType, ActionType, ChatMessage, ChatState, GameEvent, GamePhase, GameUnit, ItemType } from '../../domain/domain';
import { ChatMessageRequestData, RequestType } from '../../dto/requests';
import { ChatMessageData, ChatStateData, GameActionData, GameNextPhaseData, GameStateData, PlayerInfoData, Response, ResponseStatus, UserStateData, UserStatus } from '../../dto/responces';
import ActionService from '../../service/ActionService';
import GameObjectRenderer from '../../service/GameObjectRenderer';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import { SoundName, SoundService } from '../../service/SoundService';
import { AchievementPopup } from '../ui/popup/AchievementPopup';
import { component } from '../decorator/decorator';
import TextInput from '../ui/input/TextInput';
import Label from '../ui/label/Label';
import ObjectDescription from '../ui/popup/ObjectDescription';
import TextField from '../ui/textfield/TextField';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';
import GameBase from './GameBase';
import GameBattlefield from './GameBattlefield';
import GameFlowControls from './GameFlowControls';
import GameUnitItems from './GameUnitItems';
import GameUnitsQueue from './GameUnitsQueue';
import { DungeonLootPopup } from '../ui/popup/DungeonLootPopup';
import { LeaveDungeonPopup } from '../ui/popup/LeaveDungeonPopup';
import Container from '../ui/container/Container';

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
    @component(UNIT_ITEMS_CONTAINER, GameUnitItems)
    private readonly unitItems: GameUnitItems;
    @component(FLOW_CONTROLS_CONTAINER, GameFlowControls)
    private readonly flowControls: GameFlowControls;
    @component(BATTLEFIELD_CONTAINER, GameBattlefield)
    private readonly battlefield: GameBattlefield;
    @component(LABEL_LOOT_COINS, Label)
    protected readonly coinsLabel: Label;
    @component(LABEL_LOOT_RUBIES, Label)
    protected readonly rubiesLabel: Label;
    @component('dungeon_loot_popup', DungeonLootPopup)
    private readonly dungeonLootPopup: DungeonLootPopup;
    @component('leave_dungeon_popup', LeaveDungeonPopup)
    private readonly leaveDungeonPopup: LeaveDungeonPopup;
    @component('popup_shadow', Container)
    private readonly popupShadow: Container;
    @component('label_game_phase_info', Label)
    private readonly gamePhaseInfoLabel: Label;

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
        this.gameLog.autoScroll = true;
        this.leaveDungeonPopup.shadow = this.popupShadow;
        this.flowControls.onLeave = () => this.onLeaveGame();
        this.flowControls.onRetreate = () => this.onRetreatGame();
        this.initChat();
    }

    protected initChat(): void {
        this.chat.autoScroll = true;
        this.chatMessageInput.onEnter = input => {
            this.communicator.sendMessage(RequestType.GAME_CHAT_MESSAGE, {
                message: input.value,
            } satisfies ChatMessageRequestData);
            input.value = '';
        };
        this.chatMessageInput.maxLength = 128;
    }

    protected onRetreatGame(): void {
        this.leaveDungeonPopup.booty = undefined;
        this.leaveDungeonPopup.show();
        this.leaveDungeonPopup.onYes = () => {
            this.communicator.sendMessage(RequestType.LEAVE_GAME);
            this.communicator.sendMessage(RequestType.USER_STATUS);
            SoundService.play(SoundName.DOOR);
        }
    }

    protected onLeaveGame(): void {
        this.leaveDungeonPopup.booty = {
            coins: Math.round(this.state.gameState.state.booty.coins / this.allActors().length),
            ruby: Math.round((this.state.gameState.state.booty.ruby ?? 0) / this.allActors().length),
        };
        this.leaveDungeonPopup.show();
        this.leaveDungeonPopup.onYes = () => {
            this.communicator.sendMessage(RequestType.LEAVE_GAME);
            this.communicator.sendMessage(RequestType.USER_STATUS);
            SoundService.play(SoundName.DOOR);
            SoundService.play(SoundName.TREASURE, { delay: 0.2 });
        }
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
                this.updateGamePhaseInfo();
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
            SoundService.play(SoundName.BATTLE_START, { delay: 0.4 });
        }
        SoundService.play(SoundName.DRONE_CAVE, { skipIfPlaying: true, loop: true });
        SoundService.stop(SoundName.DRONE_MAIN, { fade: 0.2 });
    }

    public handleConnectionLost(): void {
        this.hide();
        this.destroy();
    }

    public destroy(): void {
        this.battlefield.destroy();
        this.gameLog.value = '';
        this.dungeonLootPopup.hide();
        this.leaveDungeonPopup.hide();
        this.flowControls.resetnextPhaseTicker();
    }

    protected handleGameState(): void {
        this.updatePlayerInfoFromGameState(this.state.gameState);
        this.unitItems.update(this.activeItemTypes(this.state.gameState.phase));
        this.battlefield.updateBattleField();
        this.unitsQueue.updateUnitsQueue();
        this.updateBooty();
        this.updateGamePhaseInfo();
        this.flowControls.update();
    }

    protected handleGameAction(): void {
        if (this.state.gameState.phase === GamePhase.SPOT_COMPLETE &&
            this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) {
            this.destroy();
            SoundService.play(SoundName.DOOR);
            SoundService.play(SoundName.BATTLE_START, { delay: 0.7 });
        }
        if ((this.state.gameState.nextPhase === GamePhase.SPOT_COMPLETE ||
            this.state.gameState.nextPhase === GamePhase.SCENARIO_COMPLETE) &&
            this.state.gameState.spotCompleteResult?.booty) {
            this.dungeonLootPopup.booty = this.state.gameState.spotCompleteResult.booty;
            this.dungeonLootPopup.show();
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
        this.updateBooty();
        this.updateGamePhaseInfo();
        this.flowControls.update();
        this.flowControls.timeoutAutoNextPhase();
        this.logAction();
        this.handleAchievements();
        this.handleGameActionSound();
    }

    protected updateBooty(): void {
        this.coinsLabel.value = String(this.state.gameState.state.booty.coins);
        this.rubiesLabel.value = String(this.state.gameState.state.booty.ruby ?? 0);
    }

    protected updateGamePhaseInfo(): void {
        const infoIcon = '<img src="./assets/icons/info.png" style="vertical-align: middle; padding-bottom: 4px;" />';
        if (this.playersUnit()?.isDead) {
            this.gamePhaseInfoLabel.htmlValue = `${infoIcon} You have been defeated.<br>
                No loot can be claimed. Press <span class="red-text">ABANDON</span> to return to the hub.`;
            return;
        }
        switch (this.state.gameState.nextPhase) {
            case GamePhase.PREPARE_UNIT:
                this.gamePhaseInfoLabel.htmlValue = `${infoIcon} Prepare for the battle.<br>
                Place your Character in a vacant spot. Equip your gear. No item can be used right now.<br>Press <span class="blue-text">READY</span> to begin the battle.`;
                break;
            case GamePhase.SPOT_COMPLETE:
                this.gamePhaseInfoLabel.htmlValue = `${infoIcon} Take a rest and prepare for the next battle.<br>
                Press <span class="green-text">I'M DONE</span> if you want to take your share and leave the dungeon.<br>
                Otherwise, consume the<span class="purple-text lighten-4">provision</span>to restore. Press <span class="orange-text">NEXT BATTLE</span> to get ready for more.`;
                break;
            case GamePhase.SCENARIO_COMPLETE:
                this.gamePhaseInfoLabel.htmlValue = `${infoIcon} The battle is over!<br>
                Congratulations! You have reached the end of the dungeon!<br>
                Press <span class="green-text">I'M DONE</span> to take your share and leave the dungeon.`;
                break;
            default:
                this.gamePhaseInfoLabel.htmlValue = `${infoIcon} The battle is taking turns.<br>
                Character movement costs<span class="orange-text">4</span>action points. Select a<span class="red-text">weapon</span>/<span class="purple-text">magic</span>/<span class="green-text">disposable</span>to attack the enemy.<br> 
                Select a<span class="green-text">disposable</span>/<span class="purple-text">magic</span>to recover / buff yourself or an ally. Changing gear costs<span class="orange-text">no</span>action points.`;
                break;
        }
    }

    private handleAchievements(): void {
        const unit = this.playersUnit();
        const achievements = this.state.gameState.unitActionResult?.result.achievements ??
            this.state.gameState.endRoundResult?.achievements ??
            this.state.gameState.spotCompleteResult?.achievements;
        if (!achievements || !unit) return;
        Object.keys(achievements)
            .filter(uid => this.isCurrentPlayerUnitId(Number(uid)))
            .forEach(uid => {
                Object.keys(achievements[Number(uid)]).forEach(code => this.achievementPopup.pop(code, unit));
            })
    }

    private handleGameActionSound(): void {
        const actionresult = this.state.gameState.unitActionResult?.result.result;
        const actionType = this.state.gameState.unitActionResult?.action.action;
        if (this.state.gameState.unitActionResult?.result.drop ||
            this.state.gameState.endRoundResult?.drop
        ) {
            SoundService.play(SoundName.TREASURE, { delay: 0.2 });
        }
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
        const unit = this.playersUnit();
        if (!unit || unit.isDead) return [];
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
        const date = new Date(message.timestamp);
        const nickname = this.chatState.participants[message.from].nickname;
        const colorClass = this.isCurrentPlayerId(message.from) ? 'light-green lighten-1' : 'light-blue lighten-1';
        this.chat.value +=
            `<span class="${colorClass}" >${nickname}</span><span class="grey-text" style="font-size: 13px;">${date.toLocaleTimeString()}</span><br>` +
            convert(message.message) + '<br>';
    }

    protected logAction(): void {
        const head = '<div style="font-size: 12px;">';
        if (this.state.gameState.unitActionResult) {
            const unit: GameUnit = this.findUnitByUid(this.state.gameState.unitActionResult.action.uid!)!;
            const name: string = this.getUnitName(unit);
            this.gameLog.value +=
                (this.gameLog.value === '' ? '' : '<hr>') +
                head +
                this.renderer.header(name, 33) +
                this.renderer.render(this.distinguishUnitActionResult(this.state.gameState.unitActionResult)) +
                '</div>';
        }
        if (this.state.gameState.endRoundResult) {
            this.gameLog.value +=
                head +
                (this.gameLog.value === '' ? '' : '<hr>') +
                this.renderer.header('End Round result', 33) +
                this.renderer.render(this.distinguishEndRoundResult(this.state.gameState.endRoundResult)) +
                '</div>';
        }
        if (this.state.gameState.spotCompleteResult) {
            this.gameLog.value +=
                head +
                (this.gameLog.value === '' ? '' : '<hr>') +
                this.renderer.header('End Battle result', 33) +
                this.renderer.render(this.distinguishSpotCompleteResultResult(this.state.gameState.spotCompleteResult)) +
                '</div>';
        }
    }

    protected updatePlayerInfoFromGameState(gameState: GameEvent): void {
        if (!this.state.playerInfo) { return; }
        this.state.playerInfo = gameState.players.filter(player => player.nickname === this.state.playerInfo.nickname)[0];
    }
}
