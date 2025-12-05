import { container, injectable } from 'tsyringe';
import { HEALTH_BAR, ICON, ICON_BLEEDING, ICON_CURRENT, ICON_EFFECT, ICON_EXPERIENCE, ICON_FIRE, ICON_HIT, ICON_LIGHTING, ICON_MISSED, ICON_POISON, ICON_COLD, ICON_STUNNED, LABEL_ACTION_POINTS, LABEL_EXP, LABEL_HIT_HP, LABEL_ID, MANA_BAR, STAMINA_BAR, ICON_HEALTH, ICON_STAMINA, ICON_MANA, ICON_TARGET, LABEL_HIT_CHANCE } from '../../../constants/Components';
import { SPOT_CELL_DESIGN } from '../../../constants/Resources';
import { ActionResult, Cell, DamageImpact, GamePhase, GameUnit, GameUnitFaction, Magic, UnitModificationImpact } from '../../../domain/domain';
import ActionService from '../../../service/ActionService';
import ResourceLoaderService from '../../../service/ResourceLoaderService';
import Component from '../../Component';
import { component } from '../../decorator/decorator';
import Container from '../container/Container';
import Label from '../label/Label';
import ObjectDescription from '../popup/ObjectDescription';
import Icon from './Icon';
import GameUnitItems from '../../gamescene/GameUnitItems';
import GameStateService from '../../../service/GameStateService';

@injectable()
export default class SpotCell extends Component {
    @component(ICON, Icon)
    protected readonly _icon: Icon;
    @component(ICON_STUNNED, Container)
    protected readonly _iconStunned: Container;
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
    @component(ICON_CURRENT, Container)
    protected readonly _iconCurrent: Container;
    @component(ICON_EFFECT, Container)
    protected readonly _iconEffect: Container;
    @component(ICON_HIT, Container)
    protected readonly _iconHit: Container;
    @component(ICON_MISSED, Container)
    protected readonly _iconMissed: Container;
    @component(ICON_TARGET, Container)
    protected readonly _iconTarget: Container;
    @component(ICON_EXPERIENCE, Container)
    protected readonly _iconExperience: Container;
    @component(LABEL_HIT_HP, Label)
    protected readonly hitHpLabel: Label;
    @component(LABEL_HIT_CHANCE, Label)
    protected readonly hitChanceLabel: Label;
    @component(LABEL_EXP, Label)
    protected readonly expLabel: Label;
    @component(LABEL_ID, Label)
    protected readonly idLabel: Label;
    @component(LABEL_ACTION_POINTS, Label)
    protected readonly actionPointsLabel: Label;
    @component(HEALTH_BAR, Container)
    protected readonly healthBar: Container;
    @component(STAMINA_BAR, Container)
    protected readonly staminaBar: Container;
    @component(MANA_BAR, Container)
    protected readonly manaBar: Container;

    private _descriptionPopup: ObjectDescription;
    private _unit: GameUnit | undefined;
    private _x: number;
    private _y: number;

    public displayActionChance: boolean = false;

    constructor(
        private readonly actionService: ActionService,
        private readonly state: GameStateService,
        private readonly unitItems: GameUnitItems,
    ) {
        super();
    }

    protected initialize(): void {
        this._icon.onHover = t => this.onHover();
        this._icon.onLeave = t => this.onLeave();
        this.hideAll();
    }

    protected onHover(): void {
        if (!this._unit) { return; }
        this._descriptionPopup.data = {
            name: this._unit.playerInfo?.nickname || this._unit.name,
            code: this._unit.code,
            unitUid: this._unit.uid,
            state: this._unit.state,
            damage: this._unit.damage,
            stats: this._unit.stats,
            modification: this._unit.modification,
        };
        this._descriptionPopup.show();

        if (!this.displayActionChance) return;
        const gamePhase: string = this.state.gameState.nextPhase;
        if (this.unitItems.chosenItem && this.unitItems.isCurrentUnitTurn() && gamePhase === GamePhase.TAKE_ACTION) {
            const actor = this.unitItems.currentActor();
            const damage = (this.unitItems.chosenItem as Magic).damage;
            const modification = (this.unitItems.chosenItem as Magic).modification;
            damage && actor.faction !== this._unit.faction && this.showActionChance(this.getAttackChance(damage));
            modification && actor.faction === this._unit.faction && this.showActionChance(this.getModificationChance(modification));
        }
    }

    protected onLeave(): void {
        this._descriptionPopup.hide();
        this._iconTarget.hide();
        this.hitChanceLabel.hide();
    }

    public set descriptionPopup(value: ObjectDescription) {
        this._descriptionPopup = value;
    }

    public get descriptionPopup(): ObjectDescription {
        return this._descriptionPopup;
    }

    public set onClick(callback: (target: SpotCell) => void) {
        this._icon.onClick = t => callback(this);
    }

    public set icon(value: string) {
        this._icon.icon = value;
    }

    public get icon(): string {
        return this._icon.icon;
    }

    public get x(): number {
        return this._x;
    }

    public set x(value: number) {
        this._x = value;
    }

    public get y(): number {
        return this._y;
    }

    public set y(value: number) {
        this._y = value;
    }

    public get unit(): GameUnit | undefined {
        return this._unit;
    }

    public static createSpotCell(parent: Component, containerOrContainerId: HTMLElement | string): SpotCell | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        const iconComponent: SpotCell = parent.create(containerOrContainerId, SpotCell,
            { design: resourceLoader.get(SPOT_CELL_DESIGN), classList: ['item-icon-warpper'] })!;
        return iconComponent;
    }

    protected hideAll(): void {
        this._iconStunned.hide();
        this._iconBleeding.hide();
        this._iconPoison.hide();
        this._iconCold.hide();
        this._iconFire.hide();
        this._iconLighting.hide();
        this._iconHealth.hide();
        this._iconStamina.hide();
        this._iconMana.hide();
        this._iconEffect.hide();
        this._iconHit.hide();
        this._iconMissed.hide();
        this._iconTarget.hide();
        this._iconExperience.hide();
        this.hitHpLabel.hide();
        this.hitChanceLabel.hide();
        this.expLabel.hide();
        this.idLabel.hide();
        this.healthBar.hide();
        this.staminaBar.hide();
        this.manaBar.hide();
        this.actionPointsLabel.hide();
        this._iconCurrent.hide();
    }

    public showActionChance(chance: number) {
        this.hitChanceLabel.value = `${chance}%`;
        this._iconTarget.show();
        this.hitChanceLabel.show();
    }

    public getAttackChance(impact: DamageImpact[]): number {
        const actor = this.unitItems.currentActor();
        let chance = 100;
        if (impact[0]?.chance) {
            chance = impact[0].chance;
            chance += this._unit!.state.isStunned
                ? (actor.stats.attributes.agility - actor.state.stress) - (this._unit!.stats.attributes.agility - this._unit!.state.stress)
                : (actor.stats.attributes.agility - actor.state.stress) + this._unit!.state.stress;
        }
        return chance;
    }

    public getModificationChance(impact: UnitModificationImpact[]): number {
        const actor = this.unitItems.currentActor();
        let chance = 100;
        if (impact[0]?.chance) {
            chance = impact[0].chance;
            chance += (actor.stats.attributes.intelligence - actor.state.stress);
        }
        return chance;
    }

    public updateWithCell(cell: Cell, isActive: boolean): void {
        this.hideAll();
        this.icon = cell.code;
        if (cell.factions.includes(GameUnitFaction.PARTY) && isActive) {
            this._icon.enable();
        } else {
            this._icon.disable();
        }
        this._unit = undefined;
    }

    public choose(actionPoints: number): void {
        this.actionPointsLabel.value = String(actionPoints);
        actionPoints ? this.actionPointsLabel.show() : this.actionPointsLabel.hide();
        this._iconCurrent.show();
    }

    public unchoose(): void {
        this.actionPointsLabel.hide();
        this._iconCurrent.hide();
    }

    public updateWithUnit(unit: GameUnit, isActive: boolean, forceDisable: boolean = false): void {
        this.hideAll();
        this.idLabel.show();
        this.idLabel.value = String(unit.uid);
        this._unit = unit;
        this._unit.state.isStunned ? this._iconStunned.show() : this._iconStunned.hide();
        this._unit.damage?.find(m => m.bleeding) ? this._iconBleeding.show() : this._iconBleeding.hide();
        this._unit.damage?.find(m => m.poison) ? this._iconPoison.show() : this._iconPoison.hide();
        this._unit.damage?.find(m => m.cold) ? this._iconCold.show() : this._iconCold.hide();
        this._unit.damage?.find(m => m.fire) ? this._iconFire.show() : this._iconFire.hide();
        this._unit.damage?.find(m => m.lightning) ? this._iconLighting.show() : this._iconLighting.hide();
        this._unit.modification?.find(m => m.baseAttributes?.health) ? this._iconHealth.show() : this._iconHealth.hide();
        this._unit.modification?.find(m => m.baseAttributes?.stamina) ? this._iconStamina.show() : this._iconStamina.hide();
        this._unit.modification?.find(m => m.baseAttributes?.mana) ? this._iconMana.show() : this._iconMana.hide();
        this.icon = this._unit.playerInfo ? this._unit.playerInfo.class! : this._unit.code!;
        if ((this._unit.faction === GameUnitFaction.ENEMY || this._unit.faction === GameUnitFaction.PARTY) && isActive) {
            this._icon.enable();
        } else if (forceDisable) {
            this._icon.disable();
        }
        this.healthBar.show();
        this.staminaBar.show();
        this.manaBar.show();
        this.healthBar.width = this._unit.state.health / (this._unit.stats.baseAttributes.health || 1) * 64;
        this.staminaBar.width = this._unit.state.stamina / (this._unit.stats.baseAttributes.stamina || 1) * 64;
        this.manaBar.width = this._unit.state.mana / (this._unit.stats.baseAttributes.mana || 1) * 64;
    }

    public updateWithCorpse(corpse: GameUnit): void {
        this.hideAll();
        this._icon.icon = 'tomb';
    }

    public updateWithActionResult(result: ActionResult, targetUid: number): void {
        this.hideAll();
        if (this._unit) {
            this.idLabel.show();
            this.healthBar.show();
            this.staminaBar.show();
            this.manaBar.show();
        }
        this._unit?.state.isStunned ? this._iconStunned.show() : this._iconStunned.hide();
        if (!this.actionService.hasEffect(result, targetUid)) {
            this._iconMissed.show();
        } else if (this.actionService.hasDamage(result, targetUid)) {
            this._iconHit.show();
            this.hitHpLabel.show();
            this.hitHpLabel.value = this.actionService.physicalInstantDamage(result, targetUid) + 'HP';
        } else if (this.actionService.hasRecovery(result, targetUid)) {
            this._iconEffect.show();
        }
    }

    public updateWithExperience(experience: number): void {
        this.expLabel.value = `+${experience}XP`;
        this.expLabel.show();
        this._iconExperience.show();
    }
}
