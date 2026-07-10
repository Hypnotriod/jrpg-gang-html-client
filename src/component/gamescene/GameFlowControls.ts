import { injectable, singleton } from 'tsyringe';
import { BUTTON_ABANDON, BUTTON_LEAVE, BUTTON_NEXT_BATTLE, BUTTON_NEXT_PHASE, BUTTON_SKIP, BUTTON_WAIT, LABEL_DUNGEON_NAME, LABEL_DUNGEON_STATE, LABEL_GAME_STATUS, LABEL_USERS_IN_GAME } from '../../constants/Components';
import { ActionType, GamePhase, GameUnitFaction, PlayerInfo } from '../../domain/domain';
import { ActionRequestData, NextGamePhaseData, RequestType } from '../../dto/requests';
import ActionService from '../../service/ActionService';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import { SoundName, SoundService } from '../../service/SoundService';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Label from '../ui/label/Label';
import GameBase from './GameBase';

@injectable()
@singleton()
export default class GameFlowControls extends GameBase {
    @component(LABEL_GAME_STATUS, Label)
    private readonly gameStatusLabel: Label;
    @component(LABEL_DUNGEON_NAME, Label)
    private readonly dungeonNameLabel: Label;
    @component(LABEL_USERS_IN_GAME, Label)
    private readonly usersInGameLabel: Label;
    @component(LABEL_DUNGEON_STATE, Label)
    private readonly dungeonStateLabel: Label;
    @component(BUTTON_NEXT_PHASE, Button)
    private readonly nextPhaseButton: Button;
    @component(BUTTON_NEXT_BATTLE, Button)
    private readonly nextBattleButton: Button;
    @component(BUTTON_WAIT, Button)
    private readonly waitButton: Button;
    @component(BUTTON_SKIP, Button)
    private readonly skipButton: Button;
    @component(BUTTON_ABANDON, Button)
    private readonly retreatButton: Button;
    @component(BUTTON_LEAVE, Button)
    private readonly leaveButton: Button;

    private onRetreateCallback?: () => void;
    private onLeaveCallback?: () => void;

    private nextPhaseTimeoutId: number;
    private nextPhaseTickerId: number = -1;
    private autoNextPhase: GamePhase = GamePhase.SCENARIO_COMPLETE;
    private autoNextPhaseInProgress: boolean = false;
    private usersInGame: number = 0;

    public set onRetreate(value: (() => void)) {
        this.onRetreateCallback = value;
    }

    public set onLeave(value: (() => void)) {
        this.onLeaveCallback = value;
    }

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService,
        private readonly actionService: ActionService) {
        super(state, actionService);
    }

    protected initialize(): void {
        this.nextPhaseButton.onClick = target => this.onNextPhase();
        this.nextBattleButton.onClick = target => this.onNextPhase();
        this.waitButton.onClick = target => this.onWait();
        this.retreatButton.onClick = target => this.onRetreatGameClick();
        this.leaveButton.onClick = target => this.onLeaveGameClick();
        this.skipButton.onClick = target => this.onSkipButtonClick();
    }

    public update(): void {
        this.dungeonNameLabel.value = this.state.gameState.spot.name;
        this.dungeonStateLabel.value = `Dungeon Level: ${this.state.gameState.state.spotNumber} / ${this.state.gameState.state.spotsTotal}`;
        this.updatenextPhaseLabel();
        this.updateusersInGame();
        const unit = this.playersUnit();
        if (!unit || unit.isDead) {
            this.retreatButton.show();
            this.skipButton.hide();
            this.waitButton.hide();
            this.leaveButton.hide();
            this.nextPhaseButton.hide();
            this.nextBattleButton.hide();
            return;
        }
        const gamePhase: string = this.state.gameState.nextPhase;
        if ((gamePhase === GamePhase.SPOT_COMPLETE || gamePhase === GamePhase.SCENARIO_COMPLETE) && !unit.playerInfo?.isReady) {
            this.leaveButton.show();
            this.retreatButton.hide();
        } else {
            this.leaveButton.hide();
            this.retreatButton.show();
        }
        switch (gamePhase) {
            case GamePhase.READY_FOR_START_ROUND:
            case GamePhase.PREPARE_UNIT:
            case GamePhase.TAKE_ACTION_AI:
            case GamePhase.ACTION_COMPLETE:
            case GamePhase.BEFORE_SPOT_COMPLETE:
            case GamePhase.RETREAT_ACTION:
            case GamePhase.SPOT_COMPLETE:
            case GamePhase.SCENARIO_COMPLETE:
                this.updateNextPhaseButtonVisibility();
                this.skipButton.hide();
                this.waitButton.hide();
                break;
            default:
                this.nextPhaseButton.hide();
                this.nextBattleButton.hide();
                this.isCurrentUnitTurn() ? this.skipButton.show() : this.skipButton.hide();
                this.isCurrentUnitTurn() &&
                    !this.currentUnit()?.state.waitingOrder &&
                    this.state.gameState.state.activeUnitsQueue.length > 1 ?
                    this.waitButton.show() : this.waitButton.hide();
                break;
        }
    }

    protected updateusersInGame(): void {
        if (this.usersInGame > this.state.gameState.players.length) {
            SoundService.play(SoundName.DOOR);
        }
        this.usersInGame = this.state.gameState.players.length;
        this.usersInGameLabel.htmlValue =
            this.state.gameState.players.map(p => {
                const unit = this.findUnitByUid(p.unitUid!);
                const online = p.isOffline ?
                    '<img src="./assets/icons/offline.png" style="height: 12px;"/>' : '<img src="./assets/icons/online.png" style="height: 12px;"/>';
                if (!unit || unit.isDead) {
                    return `<span class="grey-text text-lighten-2">${online} ${p.nickname}</span>`;
                }
                return `<span class="green-text text-lighten-2">${online} ${p.nickname}</span>`;
            }).join(', ');
    }

    protected updatenextPhaseLabel(fromTickInterval: boolean = false): void {
        const gamePhase: string = this.state.gameState.nextPhase;
        switch (gamePhase) {
            case GamePhase.PREPARE_UNIT:
            case GamePhase.TAKE_ACTION:
            case GamePhase.SPOT_COMPLETE:
                let timeout: number = this.state.gameState.phaseTimeout || 0;
                timeout = Math.max(timeout - 2, 0);
                this.gameStatusLabel.htmlValue = `${this.nextPhaseDescription()} <img src="./assets/icons/hourglass.png" style="vertical-align: middle; padding-bottom: 4px;" />${timeout}`;
                if (fromTickInterval && timeout <= 10) {
                    SoundService.play(SoundName.CLOCK_TICK);
                }
                if (this.state.gameState.phaseTimeout) {
                    this.state.gameState.phaseTimeout--;
                    if (this.nextPhaseTickerId === -1) {
                        clearTimeout(this.nextPhaseTickerId);
                        this.nextPhaseTickerId = window.setInterval(() => this.updatenextPhaseLabel(true), 1000);
                    }
                }
                break;
            default:
                this.resetnextPhaseTicker();
                this.gameStatusLabel.value = `${this.nextPhaseDescription()}`;
                break;
        }
    }

    protected nextPhaseDescription(): string {
        switch (this.state.gameState.nextPhase) {
            case GamePhase.PREPARE_UNIT:
                return this.state.playerInfo?.isReady ? 'Wait for another player' : 'Prepare for the battle';
            case GamePhase.ACTION_COMPLETE:
                return 'Action complete';
            case GamePhase.TAKE_ACTION:
                return this.isCurrentUnitTurn() ? 'Take your action' : 'Wait for the player action';
            case GamePhase.TAKE_ACTION_AI:
                return this.currentUnit()?.faction === GameUnitFaction.PARTY ? 'Wait for the mercenary action' : 'Wait for the monster action';
            case GamePhase.READY_FOR_START_ROUND:
                return 'Next round';
            case GamePhase.SPOT_COMPLETE:
                return this.state.playerInfo?.isReady ? 'Wait for another player' : 'Prepare for the next battle or leave';
            case GamePhase.SCENARIO_COMPLETE:
                return 'The dungeon is clear';
            case GamePhase.RETREAT_ACTION:
                return 'Unit is running away';
            case GamePhase.BEFORE_SPOT_COMPLETE:
                return 'All monsters are defeated';
        }
    }

    protected updateNextPhaseButtonVisibility(): void {
        const allDead: boolean = this.allActors().every(actor => actor.isDead);
        const playerInfo: PlayerInfo | undefined = this.state.playerInfo;
        const battleComplete = this.state.gameState.nextPhase === GamePhase.SPOT_COMPLETE;
        const scenarioComplete = this.state.gameState.nextPhase === GamePhase.SCENARIO_COMPLETE;
        const show = !allDead && playerInfo && !playerInfo.isReady && !scenarioComplete &&
            (this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT ||
                this.state.gameState.nextPhase === GamePhase.SPOT_COMPLETE ||
                this.state.gameState.nextPhase === GamePhase.SCENARIO_COMPLETE);
        show && !battleComplete ? this.nextPhaseButton.show() : this.nextPhaseButton.hide();
        show && battleComplete ? this.nextBattleButton.show() : this.nextBattleButton.hide();
    }

    public resetnextPhaseTicker(): void {
        clearTimeout(this.nextPhaseTickerId);
        this.nextPhaseTickerId = -1;
        SoundService.stop(SoundName.CLOCK_TICK);
    }

    public timeoutAutoNextPhase(): void {
        if (this.autoNextPhase !== this.state.gameState.nextPhase) {
            this.clearAutoNextPhase();
        } else {
            return;
        }
        this.autoNextPhase = this.state.gameState.nextPhase;
        if (!this.checkAutoNextPhaseConditions() || this.state.userState.playerInfo.isReady) {
            this.clearAutoNextPhase();
            return;
        }
        if (this.autoNextPhaseInProgress) { return; }
        this.autoNextPhaseInProgress = true;
        let timeout = 1100;
        if ([GamePhase.TAKE_ACTION_AI].includes(this.state.gameState.nextPhase)) {
            timeout = 500;
        }
        if ([GamePhase.ACTION_COMPLETE].includes(this.state.gameState.nextPhase) &&
            (!this.state.gameState.unitActionResult || [ActionType.MOVE, ActionType.SKIP].includes(this.state.gameState.unitActionResult.action.action))) {
            timeout = 500;
        }
        this.nextPhaseTimeoutId = window.setTimeout(() => this.callAutoNextPhase(), timeout);
    }

    protected onNextPhase(): void {
        this.clearAutoNextPhase();
        this.communicator.sendMessage(RequestType.NEXT_GAME_PHASE, {
            isReady: true,
        } as NextGamePhaseData);
    }

    protected onWait(): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: ActionType.WAIT,
        } as ActionRequestData);
    }

    protected onSkipButtonClick(): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: ActionType.SKIP,
        } as ActionRequestData);
    }


    protected callAutoNextPhase(): void {
        this.clearAutoNextPhase();
        if (!this.checkAutoNextPhaseConditions()) { return; }
        this.onNextPhase();
    }

    protected clearAutoNextPhase(): void {
        clearTimeout(this.nextPhaseTimeoutId);
        this.autoNextPhaseInProgress = false;
    }

    protected onRetreatGameClick(): void {
        this.onRetreateCallback?.();
    }

    protected onLeaveGameClick(): void {
        this.onLeaveCallback?.();
    }

    protected checkAutoNextPhaseConditions(): boolean {
        if (this.state.gameState.spot.battlefield.units?.every(unit => unit.isDead)) { return false; }
        const unit = this.playersUnit();
        if (!unit || unit.isDead) { return false; }
        if (this.state.gameState.nextPhase === GamePhase.TAKE_ACTION) {
            return false;
        }
        if ((this.state.gameState.nextPhase === GamePhase.SPOT_COMPLETE ||
            this.state.gameState.nextPhase === GamePhase.SCENARIO_COMPLETE ||
            this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT)) {
            return false;
        }
        return true;
    }
}
