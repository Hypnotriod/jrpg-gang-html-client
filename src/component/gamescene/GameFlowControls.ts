import { injectable, singleton } from 'tsyringe';
import { BUTTON_LEAVE, BUTTON_NEXT_PHASE, BUTTON_RETREAT, BUTTON_SKIP, BUTTON_WAIT, CHECKBOX_AUTO, LABEL_DUNGEON_STATE, LABEL_GAME_STATUS } from '../../constants/Components';
import { ActionType, GamePhase, GameUnit, PlayerInfo } from '../../domain/domain';
import { ActionRequestData, NextGamePhaseData, RequestType } from '../../dto/requests';
import ActionService from '../../service/ActionService';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Checkbox from '../ui/checkbox/Checkbox';
import Label from '../ui/label/Label';
import GameBase from './GameBase';

@injectable()
@singleton()
export default class GameFlowControls extends GameBase {
    @component(LABEL_GAME_STATUS, Label)
    private readonly gameStatusLabel: Label;
    @component(LABEL_DUNGEON_STATE, Label)
    private readonly dungeonStateLabel: Label;
    @component(BUTTON_NEXT_PHASE, Button)
    private readonly nextPhaseButton: Button;
    @component(BUTTON_WAIT, Button)
    private readonly waitButton: Button;
    @component(BUTTON_SKIP, Button)
    private readonly skipButton: Button;
    @component(BUTTON_RETREAT, Button)
    private readonly retreatButton: Button;
    @component(BUTTON_LEAVE, Button)
    private readonly leaveButton: Button;
    @component(CHECKBOX_AUTO, Checkbox)
    private readonly autoCheckbox: Checkbox;

    private nextPhaseTimeoutId: NodeJS.Timeout;
    private nextPhaseLabelTimeoutId: NodeJS.Timeout;
    private autoNextPhaseInProgress: boolean = false;

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService,
        private readonly actionService: ActionService) {
        super(state, actionService);
    }

    protected initialize(): void {
        this.nextPhaseButton.onClick = target => this.onNextPhase();
        this.waitButton.onClick = target => this.onWait();
        this.retreatButton.onClick = target => this.onLeaveGameClick();
        this.leaveButton.onClick = target => this.onLeaveGameClick();
        this.skipButton.onClick = target => this.onSkipButtonClick();
        this.autoCheckbox.onChange = target => this.timeoutAutoNextPhase();
        this.autoCheckbox.checked = true;
    }

    public update(): void {
        this.dungeonStateLabel.value = `Dungeon Level: ${this.state.gameState.state.spotNumber} / ${this.state.gameState.state.spotsTotal}`;
        this.updatenextPhaseLabel();
        const gamePhase: string = this.state.gameState.nextPhase;
        switch (gamePhase) {
            case GamePhase.SCENARIO_COMPLETE:
            case GamePhase.SPOT_COMPLETE:
                this.leaveButton.show();
                this.retreatButton.hide();
                break;
            default:
                this.leaveButton.hide();
                this.retreatButton.show();
                break;
        }
        switch (gamePhase) {
            case GamePhase.READY_FOR_START_ROUND:
            case GamePhase.PREPARE_UNIT:
            case GamePhase.MAKE_MOVE_OR_ACTION_AI:
            case GamePhase.MAKE_ACTION_AI:
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
                this.isCurrentUnitTurn() ? this.skipButton.show() : this.skipButton.hide();
                this.isCurrentUnitTurn() && !this.currentUnit()?.state.waitingOrder ? this.waitButton.show() : this.waitButton.hide();
                break;
        }
    }

    protected updatenextPhaseLabel(): void {
        clearTimeout(this.nextPhaseLabelTimeoutId);
        const gamePhase: string = this.state.gameState.nextPhase;
        switch (gamePhase) {
            case GamePhase.PREPARE_UNIT:
            case GamePhase.MAKE_MOVE_OR_ACTION:
            case GamePhase.MAKE_ACTION:
            case GamePhase.SPOT_COMPLETE:
            case GamePhase.SCENARIO_COMPLETE:
                let timeout: number = this.state.gameState.phaseTimeout || 0;
                timeout = Math.max(timeout - 2, 0);
                this.gameStatusLabel.value = `${this.state.gameState.nextPhase} (${timeout})`;
                if (this.state.gameState.phaseTimeout) {
                    this.state.gameState.phaseTimeout--;
                    this.nextPhaseLabelTimeoutId = setTimeout(() => this.updatenextPhaseLabel(), 1000);
                }
                break;
            default:
                this.gameStatusLabel.value = `${this.state.gameState.nextPhase}`;
                break;
        }
    }

    protected updateNextPhaseButtonVisibility(): void {
        const allDead: boolean = this.allActors().every(actor => actor.isDead);
        const playerInfo: PlayerInfo | undefined = this.state.playerInfo;
        !allDead && playerInfo && !playerInfo.isReady ? this.nextPhaseButton.show() : this.nextPhaseButton.hide();
    }

    public timeoutAutoNextPhase(): void {
        if (!this.checkAutoNextPhaseConditions()) { return; }
        this.clearAutoNextPhase();
        if (this.state.userState.playerInfo.isReady) { return; }
        this.autoNextPhaseInProgress = true;
        this.nextPhaseTimeoutId = setTimeout(() => this.callAutoNextPhase(), 1500);
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

    protected onLeaveGameClick(): void {
        this.communicator.sendMessage(RequestType.LEAVE_GAME);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected checkAutoNextPhaseConditions(): boolean {
        if (this.state.gameState.spot.battlefield.units?.every(unit => unit.isDead)) { return false; }
        const unit: GameUnit = this.currentActor();
        if (!unit || this.autoNextPhaseInProgress) { return false; }
        if (!this.autoCheckbox.checked || !this.nextPhaseButton.visible ||
            (this.state.gameState.nextPhase === GamePhase.SPOT_COMPLETE ||
                this.state.gameState.nextPhase === GamePhase.SCENARIO_COMPLETE ||
                this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) && !unit.isDead) {
            return false;
        }
        return true;
    }
}
