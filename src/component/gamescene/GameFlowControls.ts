import { injectable, singleton } from 'tsyringe';
import { BUTTON_ABANDON, BUTTON_LEAVE, BUTTON_NEXT_BATTLE, BUTTON_NEXT_PHASE, BUTTON_SKIP, BUTTON_WAIT, ICON_BLEEDING, ICON_COLD, ICON_DRAIN, ICON_FIRE, ICON_HEALTH, ICON_LIGHTING, ICON_MANA, ICON_POISON, ICON_STAMINA, ICON_STRESSED_SM, LABEL_DUNGEON_NAME, LABEL_DUNGEON_STATE, LABEL_GAME_STATUS, LABEL_USERS_IN_GAME } from '../../constants/Components';
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
import { TipsPopup } from '../ui/popup/TipsPopup';
import Container from '../ui/container/Container';

@injectable()
@singleton()
export default class GameFlowControls extends GameBase {
    private readonly BAR_WIDTH: number = 110;

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

    @component(ICON_BLEEDING, Container)
    protected readonly _iconBleeding: Container;
    @component(ICON_POISON, Container)
    protected readonly _iconPoison: Container;
    @component(ICON_COLD, Container)
    protected readonly _iconCold: Container;
    @component(ICON_FIRE, Container)
    protected readonly _iconFire: Container;
    @component(ICON_LIGHTING, Container)
    protected readonly _iconLighting: Container;
    @component(ICON_HEALTH, Container)
    protected readonly _iconHealth: Container;
    @component(ICON_STAMINA, Container)
    protected readonly _iconStamina: Container;
    @component(ICON_MANA, Container)
    protected readonly _iconMana: Container;
    @component(ICON_DRAIN, Container)
    protected readonly _iconDrain: Container;
    @component(ICON_STRESSED_SM, Container)
    protected readonly _iconStressedSm: Container;
    @component('label_health', Label)
    private readonly labelHealth: Label;
    @component('label_stamina', Label)
    private readonly labelStamina: Label;
    @component('label_mana', Label)
    private readonly labelMana: Label;
    @component('label_stress', Label)
    private readonly labelStress: Label;
    @component('health_bar', Container)
    private readonly healthBar: Container;
    @component('stamina_bar', Container)
    private readonly staminaBar: Container;
    @component('mana_bar', Container)
    private readonly manaBar: Container;

    private onRetreateCallback?: () => void;
    private onLeaveCallback?: () => void;

    private nextPhaseTimeoutId: number;
    private nextPhaseTickerId: number = -1;
    private autoNextPhase: GamePhase = GamePhase.SCENARIO_COMPLETE;
    private autoNextPhaseInProgress: boolean = false;

    public set onRetreate(value: (() => void)) {
        this.onRetreateCallback = value;
    }

    public set onLeave(value: (() => void)) {
        this.onLeaveCallback = value;
    }

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService,
        private readonly tips: TipsPopup,
        private readonly actionService: ActionService) {
        super(state, actionService);
    }

    protected initialize(): void {
        this.nextPhaseButton.onClick = target => {
            this.onNextPhase();
        }
        this.nextBattleButton.onClick = target => {
            this.onNextPhase();
        }
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
        if (unit) {
            const healthTotal = this.actionService.baseAttributeTotalValue(unit, 'health').reduce((acc, v) => acc + v, 0);
            const staminaTotal = this.actionService.baseAttributeTotalValue(unit, 'stamina').reduce((acc, v) => acc + v, 0);
            const manaTotal = this.actionService.baseAttributeTotalValue(unit, 'mana').reduce((acc, v) => acc + v, 0);
            this.labelHealth.value = `HP: ${unit.state.health} / ${healthTotal}`;
            this.labelStamina.value = `SP: ${unit.state.stamina} / ${staminaTotal}`;
            this.labelMana.value = `MP: ${unit.state.mana} / ${manaTotal}`;
            this.labelStress.value = `STRESS: ${unit.state.stress ?? 0}`;
            if (unit.state.stress) {
                this.labelStress.view.classList.add('red-text');
                this.labelStress.view.classList.remove('grey-text');
            } else {
                this.labelStress.view.classList.add('grey-text');
                this.labelStress.view.classList.remove('red-text');
            }
            this.healthBar.width = Math.min(unit.state.health / (healthTotal || 1) * this.BAR_WIDTH, this.BAR_WIDTH);
            this.staminaBar.width = Math.min(unit.state.stamina / (staminaTotal || 1) * this.BAR_WIDTH, this.BAR_WIDTH);
            this.manaBar.width = Math.min(unit.state.mana / (manaTotal || 1) * this.BAR_WIDTH, this.BAR_WIDTH);
            unit.damage?.find(m => m.bleeding) ? this._iconBleeding.show() : this._iconBleeding.hide();
            unit.damage?.find(m => m.poison) ? this._iconPoison.show() : this._iconPoison.hide();
            unit.damage?.find(m => m.cold) ? this._iconCold.show() : this._iconCold.hide();
            unit.damage?.find(m => m.fire) ? this._iconFire.show() : this._iconFire.hide();
            unit.damage?.find(m => m.lightning) ? this._iconLighting.show() : this._iconLighting.hide();
            unit.damage?.find(m => m.manaDrain || m.exhaustion || m.fear || m.curse || m.madness) ? this._iconDrain.show() : this._iconDrain.hide();
            unit.modification?.find(m => m.baseAttributes?.health) ? this._iconHealth.show() : this._iconHealth.hide();
            unit.modification?.find(m => m.baseAttributes?.stamina) ? this._iconStamina.show() : this._iconStamina.hide();
            unit.modification?.find(m => m.baseAttributes?.mana) ? this._iconMana.show() : this._iconMana.hide();
            unit.state.stress ? this._iconStressedSm.show() : this._iconStressedSm.hide();
        }
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
                let timeout = this.state.gameState.phaseTimeout;
                if (timeout === undefined) {
                    this.resetnextPhaseTicker();
                    this.gameStatusLabel.value = `${this.nextPhaseDescription()}`;
                    return;
                }
                timeout = Math.max(timeout - 2, 0);
                const time = new Date(timeout * 1000).toISOString().slice(14, 19);
                this.gameStatusLabel.htmlValue = `${this.nextPhaseDescription()} <img src="./assets/icons/hourglass.png" style="height:20px; vertical-align: middle; padding-bottom: 4px;" />${time}`;
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
        if ([GamePhase.TAKE_ACTION_AI, GamePhase.RETREAT_ACTION].includes(this.state.gameState.nextPhase)) {
            timeout = 500;
        }
        if ([GamePhase.ACTION_COMPLETE].includes(this.state.gameState.nextPhase) &&
            (!this.state.gameState.unitActionResult || [ActionType.MOVE, ActionType.SKIP, ActionType.WAIT].includes(this.state.gameState.unitActionResult.action.action))) {
            timeout = 500;
        }
        timeout = Math.max(360, timeout / 2, timeout - this.communicator.ping);
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
