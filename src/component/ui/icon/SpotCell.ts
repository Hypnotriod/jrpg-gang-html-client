import { container, injectable } from 'tsyringe';
import { HEALTH_BAR, ICON, ICON_BLEEDING, ICON_CURRENT, ICON_EFFECT, ICON_EXPERIENCE, ICON_FIRE, ICON_HIT, ICON_LIGHTING, ICON_MISSED, ICON_POISON, ICON_COLD, ICON_STUNNED, LABEL_ACTION_POINTS, LABEL_EXP, LABEL_HIT_HP, LABEL_TURN_ORDER, MANA_BAR, STAMINA_BAR, ICON_HEALTH, ICON_STAMINA, ICON_MANA, ICON_TARGET, LABEL_HIT_CHANCE, ICON_UNREACHABLE, ICON_FOOD, ICON_NO_STAMINA, LABEL_CRITICAL_HIT, ICON_HIT_COLD, ICON_HIT_FIRE, ICON_HIT_LIGHTING, ICON_HIT_POISON, ICON_HIT_DRAIN, ICON_DRAIN } from '../../../constants/Components';
import { SPOT_CELL_DESIGN, SPOT_CELL_QEUE_DESIGN } from '../../../constants/Resources';
import { ActionRange, ActionResult, Ammunition, Cell, DamageImpact, GamePhase, GameUnit, GameUnitFaction, Item, ItemType, Magic, Position, Provision, UnitBaseAttributes, UnitModificationImpact, Weapon } from '../../../domain/domain';
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
import { SoundName, SoundService } from '../../../service/SoundService';

@injectable()
export default class SpotCell extends Component {
    @component(ICON, Icon)
    protected readonly _icon: Icon;
    @component(ICON_STUNNED, Container)
    protected readonly _iconStunned: Container;
    @component(ICON_NO_STAMINA, Container)
    protected readonly _iconNoStamina: Container;
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
    @component(ICON_CURRENT, Container)
    protected readonly _iconCurrent: Container;
    @component(ICON_EFFECT, Container)
    protected readonly _iconEffect: Container;
    @component(ICON_FOOD, Container)
    protected readonly _iconFood: Container;
    @component(ICON_HIT, Container)
    protected readonly _iconHit: Container;
    @component(ICON_HIT_COLD, Container)
    protected readonly _iconHitCold: Container;
    @component(ICON_HIT_FIRE, Container)
    protected readonly _iconHitFire: Container;
    @component(ICON_HIT_LIGHTING, Container)
    protected readonly _iconHitLighting: Container;
    @component(ICON_HIT_POISON, Container)
    protected readonly _iconHitPoison: Container;
    @component(ICON_HIT_DRAIN, Container)
    protected readonly _iconHitDrain: Container;
    @component(ICON_MISSED, Container)
    protected readonly _iconMissed: Container;
    @component(ICON_TARGET, Container)
    protected readonly _iconTarget: Container;
    @component(ICON_UNREACHABLE, Container)
    protected readonly _iconUnreachable: Container;
    @component(ICON_EXPERIENCE, Container)
    protected readonly _iconExperience: Container;
    @component(LABEL_HIT_HP, Label)
    protected readonly hitHpLabel: Label;
    @component(LABEL_CRITICAL_HIT, Label)
    protected readonly hitCriticalLabel: Label;
    @component(LABEL_HIT_CHANCE, Label)
    protected readonly hitChanceLabel: Label;
    @component(LABEL_EXP, Label)
    protected readonly expLabel: Label;
    @component(LABEL_TURN_ORDER, Label)
    protected readonly turnOrderLabel: Label;
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
    private _hover: boolean = false;
    private _hint?: string | undefined;

    public displayActionChance: boolean = false;
    public barWidth: number = 64;

    private stunnedSoundPlayed: boolean = false;
    private actionResultTimeoutId: number;

    public get hint(): string | undefined {
        return this._hint;
    }

    public set hint(value: string | undefined) {
        this._hint = value;
        if (this._hover) {
            this.onHover();
        }
    }

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
        this.hideActionResultIcons();
    }

    protected onHover(): void {
        this._hover = true;
        if (this._unit) {
            this.displayActionChance && this.showActionChance();
            this._descriptionPopup.data = {
                name: this._unit.playerInfo?.nickname || this._unit.name,
                code: this._unit.code,
                unitUid: this._unit.uid,
                state: this._unit.state,
                damage: this._unit.damage,
                stats: this._unit.stats,
                modification: this._unit.modification,
                inventory: this._unit.inventory,
                description: this._unit.description,
                hint: this._hint,
            };
            this._descriptionPopup.show();
            return;
        }
        if (this._icon.enabled) {
            this._descriptionPopup.data = { hint: 'Click to move here' };
            this._descriptionPopup.show();
            return;
        }
    }

    protected onLeave(): void {
        this._hover = false;
        this._descriptionPopup.hide();
        this._iconTarget.hide();
        this._iconUnreachable.hide();
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

    public static createQueueSpotCell(parent: Component, containerOrContainerId: HTMLElement | string): SpotCell | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        const iconComponent: SpotCell = parent.create(containerOrContainerId, SpotCell,
            { design: resourceLoader.get(SPOT_CELL_QEUE_DESIGN), classList: ['item-icon-warpper-small'] })!;
        iconComponent.barWidth = 46;
        return iconComponent;
    }

    protected hideAll(): void {
        this._iconStunned.hide();
        this._iconNoStamina.hide();
        this._iconBleeding.hide();
        this._iconPoison.hide();
        this._iconCold.hide();
        this._iconFire.hide();
        this._iconLighting.hide();
        this._iconHealth.hide();
        this._iconStamina.hide();
        this._iconMana.hide();
        this._iconDrain.hide();
        this._iconTarget.hide();
        this._iconUnreachable.hide();
        this._iconExperience.hide();
        this.hitChanceLabel.hide();
        this.expLabel.hide();
        this.turnOrderLabel.hide();
        this.healthBar.hide();
        this.staminaBar.hide();
        this.manaBar.hide();
        this.actionPointsLabel.hide();
        this._iconCurrent.hide();
        this._icon.deactivate();
    }

    protected hideActionResultIcons(): void {
        this._iconFood.hide();
        this._iconMissed.hide();
        this._iconHit.hide();
        this._iconHitCold.hide();
        this._iconHitFire.hide();
        this._iconHitLighting.hide();
        this._iconHitPoison.hide();
        this._iconHitDrain.hide();
        this._iconEffect.hide();
        this._iconExperience.hide();
        this.expLabel.hide();
        this.hitHpLabel.hide();
        this.hitCriticalLabel.hide();
    }

    public showActionChance() {
        this._hint = undefined;
        if (!this._unit || !this._hover) { return; }
        let chance = 0;
        let reachable = false;
        const gamePhase = this.state.gameState.nextPhase;
        const chosenItem = this.unitItems.chosenItem;
        const hintRequirenments = (actor: GameUnit, useCost?: UnitBaseAttributes) => {
            if (actor.state.stamina < (useCost?.stamina ?? 0)) {
                this._hint = '!Not enough stamina';
            } else if (actor.state.mana < (useCost?.mana ?? 0)) {
                this._hint = '!Not enough mana';
            } else if (actor.state.actionPoints < (useCost?.actionPoints ?? 0)) {
                this._hint = '!Not enough action points';
            }
        }
        if (this.unitItems.isCurrentUnitTurn() && gamePhase === GamePhase.TAKE_ACTION || gamePhase === GamePhase.SPOT_COMPLETE) {
            if (!chosenItem) {
                this._hint = '!No item selected';
            } else {
                const actor = this.unitItems.playersUnit();
                if (!actor || actor.isDead) return;
                const damage = (chosenItem as Magic).damage;
                const modification = (chosenItem as Magic).modification;
                const recovery = (chosenItem as Provision).recovery;
                const range = (chosenItem as Magic).range ?? { x: 0, y: 0 };
                const useCost = (chosenItem as Magic).useCost;
                reachable = this.canReach(actor.position, this, range);
                if (damage && actor.faction !== this._unit.faction) {
                    chance = this.actionService.attackChance(damage, actor, this._unit);
                    this._hint = !reachable ? '!Can\'t reach' : 'Click to attack';
                    if (chosenItem.type === ItemType.WEAPON) {
                        const weapon = chosenItem as Weapon;
                        if (!weapon.equipped) {
                            this._hint = '!Not equipped';
                        } else if (weapon.ammunitionKind && !actor.inventory.ammunition?.some(a => a.equipped && a.kind === weapon.ammunitionKind)) {
                            this._hint = '!No ammunition';
                        }
                    }
                    hintRequirenments(actor, useCost);
                }
                if (modification && actor.faction === this._unit.faction) {
                    chance = this.actionService.modificationChance(modification, actor);
                    this._hint = !reachable ? '!Can\'t reach' : 'Click to use';
                    hintRequirenments(actor, useCost);
                }
                if (recovery && gamePhase === GamePhase.SPOT_COMPLETE) {
                    this._hint = 'Click to consume';
                }
            }
        }
        if (!chance) return;
        this.hitChanceLabel.value = `${chance}%`;
        reachable && this._iconTarget.show();
        !reachable && this._iconUnreachable.show();
        reachable && this.hitChanceLabel.show();
    }

    public getAttackChance(impact: DamageImpact[]): number {
        const actor = this.unitItems.playersUnit()!;
        return this.actionService.attackChance(impact, actor, this._unit!);
    }

    public getModificationChance(impact: UnitModificationImpact[]): number {
        const actor = this.unitItems.playersUnit()!;
        return this.actionService.modificationChance(impact, actor);
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
        this._icon.activate();
    }

    public unchoose(): void {
        this.actionPointsLabel.hide();
        this._iconCurrent.hide();
        this._icon.deactivate();
    }

    public updateWithUnit(unit: GameUnit, isActive: boolean, forceDisable: boolean = false): void {
        this.hideAll();
        if (!this.stunnedSoundPlayed && unit.state.isStunned && !forceDisable) {
            SoundService.play(SoundName.STUNNED);
            this.stunnedSoundPlayed = true;
        } else if (!unit.state.isStunned) {
            this.stunnedSoundPlayed = false;
        }
        this._unit = unit;
        this._unit.state.isStunned ? this._iconStunned.show() : this._iconStunned.hide();
        this._unit.state.stamina === 0 && this._unit.state.isStunned !== true && this._unit.isDead !== true ? this._iconNoStamina.show() : this._iconNoStamina.hide();
        this._unit.damage?.find(m => m.bleeding) ? this._iconBleeding.show() : this._iconBleeding.hide();
        this._unit.damage?.find(m => m.poison) ? this._iconPoison.show() : this._iconPoison.hide();
        this._unit.damage?.find(m => m.cold) ? this._iconCold.show() : this._iconCold.hide();
        this._unit.damage?.find(m => m.fire) ? this._iconFire.show() : this._iconFire.hide();
        this._unit.damage?.find(m => m.lightning) ? this._iconLighting.show() : this._iconLighting.hide();
        this._unit.damage?.find(m => m.manaDrain || m.exhaustion || m.fear || m.curse || m.madness) ? this._iconDrain.show() : this._iconDrain.hide();
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
        const healthTotal = this.actionService.baseAttributeTotalValue(unit, 'health').reduce((acc, v) => acc + v, 0);
        const staminaTotal = this.actionService.baseAttributeTotalValue(unit, 'stamina').reduce((acc, v) => acc + v, 0);
        const manaTotal = this.actionService.baseAttributeTotalValue(unit, 'mana').reduce((acc, v) => acc + v, 0);
        this.healthBar.width = Math.min(this._unit.state.health / (healthTotal || 1) * this.barWidth, this.barWidth);
        this.staminaBar.width = Math.min(this._unit.state.stamina / (staminaTotal || 1) * this.barWidth, this.barWidth);
        this.manaBar.width = Math.min(this._unit.state.mana / (manaTotal || 1) * this.barWidth, this.barWidth);
        if (this._hover) {
            this.onHover();
        }
    }

    public updateWithTurnOrder(order: number): void {
        this.turnOrderLabel.value = String(order);
        order ? this.turnOrderLabel.show() : this.turnOrderLabel.hide();
    }

    public updateWithCorpse(corpse: GameUnit): void {
        this.hideAll();
        this._icon.icon = 'tomb';
        if (this._hover) {
            this.onLeave();
        }
    }

    public updateWithActionResult(result: ActionResult, targetUid: number, item?: Item, ammo?: Ammunition,): void {
        if (this._unit) {
            this.turnOrderLabel.show();
            this.healthBar.show();
            this.staminaBar.show();
            this.manaBar.show();
        }
        this._unit?.state.isStunned ? this._iconStunned.show() : this._iconStunned.hide();
        this._unit?.state.stamina === 0 && this._unit?.state.isStunned !== true && this._unit?.isDead !== true ? this._iconNoStamina.show() : this._iconNoStamina.hide();
        if (!this.actionService.hasEffect(result, targetUid)) {
            this.onActionResultIcon();
            SoundService.play(SoundName.MISS);
            this._iconMissed.show();
        } else if (this.actionService.hasDamage(result, targetUid)) {
            this.onActionResultIcon();
            const weaponImpact: DamageImpact[] | undefined = (item as Weapon | undefined)?.damage?.filter(d => !d.duration);
            const ammoImpact: DamageImpact[] | undefined = ammo?.damage?.filter(d => !d.duration);
            const itemPhysicalDamage =
                (weaponImpact ? this.actionService.physicalDamage(weaponImpact) : 0) +
                (ammoImpact ? this.actionService.physicalDamage(ammoImpact) : 0);
            const impact = [...(weaponImpact ?? []), ...(ammoImpact ?? []), ...(result.instantDamage?.[targetUid] ?? []), ...(result.temporalDamage?.[targetUid] ?? [])];
            const actualPhysicalDamage = this.actionService.physicalInstantDamageOnTarget(result, targetUid);
            const withFire = impact?.some(d => d.fire);
            const withCold = impact?.some(d => d.cold);
            const withLightning = impact?.some(d => d.lightning);
            const withPoison = impact?.some(d => d.poison);
            const withDrain = impact?.some(d => d.fear || d.curse || d.madness || d.exhaustion || d.manaDrain);
            if (withFire) {
                SoundService.play(SoundName.FIREBALL);
                this._iconHitFire.show();
            } else if (withCold) {
                SoundService.play(SoundName.ICE);
                this._iconHitCold.show();
            } else if (withLightning) {
                SoundService.play(SoundName.LIGHTNING);
                this._iconHitLighting.show();
            } else if (withPoison) {
                SoundService.play(SoundName.POISON);
                this._iconHitPoison.show();
            } else if (withDrain && !itemPhysicalDamage) {
                SoundService.play(SoundName.DEBUFF);
                this._iconHitDrain.show();
            } else {
                SoundService.play(SoundName.HIT);
                this._iconHit.show();
            }
            this.hitHpLabel.show();
            this.hitHpLabel.value = withDrain && !itemPhysicalDamage ? '' : `${actualPhysicalDamage}HP`;
            this.actionService.hasCriticalDamage(result, targetUid) && this.hitCriticalLabel.show();
        } else if (this.actionService.hasRecovery(result, targetUid)) {
            this.onActionResultIcon();
            const gamePhase = this.state.gameState.nextPhase;
            if (gamePhase === GamePhase.SPOT_COMPLETE || gamePhase === GamePhase.SCENARIO_COMPLETE) {
                SoundService.play(SoundName.FOOD);
                this._iconFood.show();
            } else {
                SoundService.play(SoundName.BUFF);
                this._iconEffect.show();
            }
        }
    }

    private onActionResultIcon(): void {
        this.hideActionResultIcons();
        clearInterval(this.actionResultTimeoutId);
        this.actionResultTimeoutId = window.setTimeout(() => this.hideActionResultIcons(), 1100);
    }

    public updateWithExperience(experience: number): void {
        this.onActionResultIcon();
        this.expLabel.value = `+${experience}XP`;
        this.expLabel.show();
        this._iconExperience.show();
    }

    protected canReach(p1: Position, p2: Position, r: ActionRange): boolean {
        if (!r.maximumX && !r.maximumY && !r.minimumX && !r.minimumY && !r.radius) return true;
        const minimum = Math.abs(p1.x - p2.x) >= (r.minimumX ?? 0) && Math.abs(p1.y - p2.y) >= (r.minimumY ?? 0);
        const maximum = Math.abs(p1.x - p2.x) <= (r.maximumX ?? 0) && Math.abs(p1.y - p2.y) <= (r.maximumY ?? 0);
        return minimum && maximum;
    }
}
