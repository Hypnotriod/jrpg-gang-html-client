import { injectable, singleton } from 'tsyringe';
import { BUTTON_LEAVE_GAME, BUTTON_NEXT_PHASE, BUTTON_SKIP, CHECKBOX_AUTO, LABEL_GAME_STATUS } from '../../constants/Components';
import { ActionType, GamePhase, GameUnit, PlayerInfo } from '../../domain/domain';
import { ActionData, NextGamePhaseData, RequestType } from '../../dto/requests';
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
    @component(BUTTON_NEXT_PHASE, Button)
    private readonly nextPhaseButton: Button;
    @component(BUTTON_SKIP, Button)
    private readonly skipButton: Button;
    @component(BUTTON_LEAVE_GAME, Button)
    private readonly leaveGameButton: Button;
    @component(CHECKBOX_AUTO, Checkbox)
    private readonly autoCheckbox: Checkbox;

    private nextPhaseTimeoutId: NodeJS.Timeout;
    private autoNextPhaseInProgress: boolean = false;

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService,
        private readonly actionService: ActionService) {
        super(state, actionService);
    }

    protected initialize(): void {
        this.nextPhaseButton.onClick = target => this.onNextPhase();
        this.leaveGameButton.onClick = target => this.onLeaveGameClick();
        this.skipButton.onClick = target => this.onSkipButtonClick();
        this.autoCheckbox.onChange = target => this.timeoutAutoNextPhase();
        this.autoCheckbox.checked = true;
    }

    public update(): void {
        this.gameStatusLabel.value = `${this.state.gameState.nextPhase}`;
        const gamePhase: string = this.state.gameState.nextPhase;
        switch (gamePhase) {
            case GamePhase.READY_FOR_START_ROUND:
            case GamePhase.PREPARE_UNIT:
            case GamePhase.MAKE_MOVE_OR_ACTION_AI:
            case GamePhase.MAKE_ACTION_AI:
            case GamePhase.ACTION_COMPLETE:
            case GamePhase.RETREAT_ACTION:
            case GamePhase.BATTLE_COMPLETE:
                this.updateNextPhaseButtonVisibility();
                this.skipButton.hide();
                break;
            default:
                this.nextPhaseButton.hide();
                this.isCurrentUnitTurn() ? this.skipButton.show() : this.skipButton.hide();
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

    protected onSkipButtonClick(): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: ActionType.SKIP,
        } as ActionData);
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
            (this.state.gameState.nextPhase === GamePhase.BATTLE_COMPLETE ||
                this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) && !unit.isDead) {
            return false;
        }
        return true;
    }
}
