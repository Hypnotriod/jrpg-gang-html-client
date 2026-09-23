import { container, injectable } from 'tsyringe';
import { HEALTH_BAR, ICON, ICON_BLEEDING, ICON_CURRENT, ICON_EFFECT, ICON_EXPERIENCE, ICON_FIRE, ICON_HIT, ICON_LIGHTING, ICON_MISSED, ICON_POISON, ICON_COLD, ICON_STUNNED, LABEL_ACTION_POINTS, LABEL_EXP, LABEL_HIT_HP, LABEL_TURN_ORDER, MANA_BAR, STAMINA_BAR, ICON_HEALTH, ICON_STAMINA, ICON_MANA, ICON_TARGET, LABEL_HIT_CHANCE, ICON_UNREACHABLE, ICON_FOOD, ICON_NO_STAMINA, LABEL_CRITICAL_HIT, ICON_HIT_COLD, ICON_HIT_FIRE, ICON_HIT_LIGHTING, ICON_HIT_POISON, ICON_HIT_DRAIN, ICON_DRAIN, ICON_STRESSED, LABEL_CRITICAL_MISS, ICON_READY, ICON_GEAR_CHANGE, LABEL_SKIP, LABEL_WAIT, ICON_STRESSED_SM } from '../../../constants/Components';
import { SPOT_CELL_DESIGN, SPOT_CELL_QEUE_DESIGN } from '../../../constants/Resources';
import { ActionRange, ActionResult, Ammunition, Cell, DamageImpact, GamePhase, GameUnit, GameUnitActionResult, GameUnitFaction, Item, ItemType, Magic, Position, Provision, UnitBaseAttributes, UnitModificationImpact, Weapon } from '../../../domain/domain';
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
    @component(ICON_STRESSED, Container)
    protected readonly _iconStressed: Container;
    @component(ICON_READY, Container)
    protected readonly _iconReady: Container;
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
    @component(ICON_CURRENT, Container)
    protected readonly _iconCurrent: Container;
    @component(ICON_EFFECT, Container)
    protected readonly _iconEffect: Container;
    @component(ICON_FOOD, Container)
    protected readonly _iconFood: Container;
    @component(ICON_GEAR_CHANGE, Container)
    protected readonly _iconGearChange: Container;
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
    @component('label_missed', Container)
    protected readonly _labelMissed: Container;
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
    @component(LABEL_CRITICAL_MISS, Label)
    protected readonly missCriticalLabel: Label;
    @component(LABEL_SKIP, Label)
    protected readonly skipLabel: Label;
    @component(LABEL_WAIT, Label)
    protected readonly waitLabel: Label;
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
                stats: this._unit.stats,
                damage: this.combineDamageImpactObjects(this._unit.damage),
                modification: this.combineModificationImpactObjects(this._unit.modification),
                inventory: this._unit.inventory,
                description: this._unit.description,
                hint: this._hint,
            };
            this._descriptionPopup.show({ stickTo: this.getBoundingRect(), timeoutMs: 500 });
            return;
        }
        if (this._icon.enabled) {
            this._descriptionPopup.data = { hint: 'Click to move here' };
            this._descriptionPopup.show({ stickTo: this.getBoundingRect(), timeoutMs: 500 });
            return;
        }
    }

    protected combineDamageImpactObjects(damage?: DamageImpact[]): DamageImpact[] | undefined {
        if (!damage) return undefined;
        return [damage.reduce((acc, d) => {
            return ({
                bleeding: (acc.bleeding ?? 0) + (d.bleeding ?? 0),
                cold: (acc.cold ?? 0) + (d.cold ?? 0),
                crushing: (acc.crushing ?? 0) + (d.crushing ?? 0),
                curse: (acc.curse ?? 0) + (d.curse ?? 0),
                cutting: (acc.cutting ?? 0) + (d.cutting ?? 0),
                exhaustion: (acc.exhaustion ?? 0) + (d.exhaustion ?? 0),
                fear: (acc.fear ?? 0) + (d.fear ?? 0),
                fire: (acc.fire ?? 0) + (d.fire ?? 0),
                lightning: (acc.lightning ?? 0) + (d.lightning ?? 0),
                madness: (acc.madness ?? 0) + (d.madness ?? 0),
                manaDrain: (acc.manaDrain ?? 0) + (d.manaDrain ?? 0),
                poison: (acc.poison ?? 0) + (d.poison ?? 0),
                stabbing: (acc.stabbing ?? 0) + (d.stabbing ?? 0),
                duration: Math.max(acc.duration ?? 0, d.duration ?? 0),
            } as DamageImpact);
        }, {} as DamageImpact)];
    }

    protected combineModificationImpactObjects(modification?: UnitModificationImpact[]): UnitModificationImpact[] | undefined {
        if (!modification) return undefined;
        return [modification.reduce((acc, d) => {
            return ({
                recovery: {
                    health: (acc.recovery?.health ?? 0) + (d.recovery?.health ?? 0),
                    stamina: (acc.recovery?.stamina ?? 0) + (d.recovery?.stamina ?? 0),
                    mana: (acc.recovery?.mana ?? 0) + (d.recovery?.mana ?? 0),
                    actionPoints: (acc.recovery?.actionPoints ?? 0) + (d.recovery?.actionPoints ?? 0),

                    bleeding: (acc.recovery?.bleeding ?? 0) + (d.recovery?.bleeding ?? 0),
                    cold: (acc.recovery?.cold ?? 0) + (d.recovery?.cold ?? 0),
                    crushing: (acc.recovery?.crushing ?? 0) + (d.recovery?.crushing ?? 0),
                    curse: (acc.recovery?.curse ?? 0) + (d.recovery?.curse ?? 0),
                    cutting: (acc.recovery?.cutting ?? 0) + (d.recovery?.cutting ?? 0),
                    exhaustion: (acc.recovery?.exhaustion ?? 0) + (d.recovery?.exhaustion ?? 0),
                    fear: (acc.recovery?.fear ?? 0) + (d.recovery?.fear ?? 0),
                    fire: (acc.recovery?.fire ?? 0) + (d.recovery?.fire ?? 0),
                    lightning: (acc.recovery?.lightning ?? 0) + (d.recovery?.lightning ?? 0),
                    madness: (acc.recovery?.madness ?? 0) + (d.recovery?.madness ?? 0),
                    manaDrain: (acc.recovery?.manaDrain ?? 0) + (d.recovery?.manaDrain ?? 0),
                    poison: (acc.recovery?.poison ?? 0) + (d.recovery?.poison ?? 0),
                    stabbing: (acc.recovery?.stabbing ?? 0) + (d.recovery?.stabbing ?? 0),
                },
                damage: {
                    bleeding: (acc.damage?.bleeding ?? 0) + (d.damage?.bleeding ?? 0),
                    cold: (acc.damage?.cold ?? 0) + (d.damage?.cold ?? 0),
                    crushing: (acc.damage?.crushing ?? 0) + (d.damage?.crushing ?? 0),
                    curse: (acc.damage?.curse ?? 0) + (d.damage?.curse ?? 0),
                    cutting: (acc.damage?.cutting ?? 0) + (d.damage?.cutting ?? 0),
                    exhaustion: (acc.damage?.exhaustion ?? 0) + (d.damage?.exhaustion ?? 0),
                    fear: (acc.damage?.fear ?? 0) + (d.damage?.fear ?? 0),
                    fire: (acc.damage?.fire ?? 0) + (d.damage?.fire ?? 0),
                    lightning: (acc.damage?.lightning ?? 0) + (d.damage?.lightning ?? 0),
                    madness: (acc.damage?.madness ?? 0) + (d.damage?.madness ?? 0),
                    manaDrain: (acc.damage?.manaDrain ?? 0) + (d.damage?.manaDrain ?? 0),
                    poison: (acc.damage?.poison ?? 0) + (d.damage?.poison ?? 0),
                    stabbing: (acc.damage?.stabbing ?? 0) + (d.damage?.stabbing ?? 0),
                },
                resistance: {
                    bleeding: (acc.resistance?.bleeding ?? 0) + (d.resistance?.bleeding ?? 0),
                    cold: (acc.resistance?.cold ?? 0) + (d.resistance?.cold ?? 0),
                    crushing: (acc.resistance?.crushing ?? 0) + (d.resistance?.crushing ?? 0),
                    curse: (acc.resistance?.curse ?? 0) + (d.resistance?.curse ?? 0),
                    cutting: (acc.resistance?.cutting ?? 0) + (d.resistance?.cutting ?? 0),
                    exhaustion: (acc.resistance?.exhaustion ?? 0) + (d.resistance?.exhaustion ?? 0),
                    fear: (acc.resistance?.fear ?? 0) + (d.resistance?.fear ?? 0),
                    fire: (acc.resistance?.fire ?? 0) + (d.resistance?.fire ?? 0),
                    lightning: (acc.resistance?.lightning ?? 0) + (d.resistance?.lightning ?? 0),
                    madness: (acc.resistance?.madness ?? 0) + (d.resistance?.madness ?? 0),
                    manaDrain: (acc.resistance?.manaDrain ?? 0) + (d.resistance?.manaDrain ?? 0),
                    poison: (acc.resistance?.poison ?? 0) + (d.resistance?.poison ?? 0),
                    stabbing: (acc.resistance?.stabbing ?? 0) + (d.resistance?.stabbing ?? 0),
                },
                baseAttributes: {
                    health: (acc.baseAttributes?.health ?? 0) + (d.baseAttributes?.health ?? 0),
                    stamina: (acc.baseAttributes?.stamina ?? 0) + (d.baseAttributes?.stamina ?? 0),
                    mana: (acc.baseAttributes?.mana ?? 0) + (d.baseAttributes?.mana ?? 0),
                    actionPoints: (acc.baseAttributes?.actionPoints ?? 0) + (d.baseAttributes?.actionPoints ?? 0),
                },
                attributes: {
                    agility: (acc.attributes?.agility ?? 0) + (d.attributes?.agility ?? 0),
                    endurance: (acc.attributes?.endurance ?? 0) + (d.attributes?.endurance ?? 0),
                    initiative: (acc.attributes?.initiative ?? 0) + (d.attributes?.initiative ?? 0),
                    intelligence: (acc.attributes?.intelligence ?? 0) + (d.attributes?.intelligence ?? 0),
                    physique: (acc.attributes?.physique ?? 0) + (d.attributes?.physique ?? 0),
                    strength: (acc.attributes?.strength ?? 0) + (d.attributes?.strength ?? 0),
                    luck: (acc.attributes?.luck ?? 0) + (d.attributes?.luck ?? 0),
                },
                duration: Math.max(acc.duration ?? 0, d.duration ?? 0),
            } as UnitModificationImpact);
        }, {} as UnitModificationImpact)];
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
        this._iconStressed.hide();
        this._iconReady.hide();
        this._iconBleeding.hide();
        this._iconPoison.hide();
        this._iconCold.hide();
        this._iconFire.hide();
        this._iconLighting.hide();
        this._iconHealth.hide();
        this._iconStamina.hide();
        this._iconMana.hide();
        this._iconDrain.hide();
        this._iconStressedSm.hide();
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
        this._iconGearChange.hide();
        this._iconMissed.hide();
        this._labelMissed.hide();
        this._iconHit.hide();
        this._iconHitCold.hide();
        this._iconHitFire.hide();
        this._iconHitLighting.hide();
        this._iconHitPoison.hide();
        this._iconHitDrain.hide();
        this._iconEffect.hide();
        this._iconExperience.hide();
        this._iconStressed.hide();
        this._iconReady.hide();
        this.expLabel.hide();
        this.hitHpLabel.hide();
        this.hitCriticalLabel.hide();
        this.missCriticalLabel.hide();
        this.skipLabel.hide();
        this.waitLabel.hide();
    }

    public showActionChance() {
        this._hint = undefined;
        if (!this._unit || !this._hover) { return; }
        let chance = 0;
        let reachable = false;
        const gamePhase = this.state.gameState.nextPhase;
        const chosenItem = this.unitItems.chosenItem;
        const hintRequirements = (actor: GameUnit, useCost?: UnitBaseAttributes) => {
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
                    hintRequirements(actor, useCost);
                }
                if (modification && actor.faction === this._unit.faction) {
                    chance = this.actionService.modificationChance(modification, actor);
                    this._hint = !reachable ? '!Can\'t reach' : 'Click to use';
                    hintRequirements(actor, useCost);
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
        this._unit.state.stress ? this._iconStressedSm.show() : this._iconStressedSm.hide();
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

    public updateReady(isReady: boolean) {
        isReady ? this._iconReady.show() : this._iconReady.hide();
    }

    public onRetreat(): void {
        this.onActionResultIcon();
        this._iconStressed.show();
        SoundService.play(SoundName.DEBUFF);
    }

    public onSkip(): void {
        this.onActionResultIcon(500);
        this.skipLabel.show();
    }

    public onWait(): void {
        this.onActionResultIcon(500);
        this.waitLabel.show();
    }

    public updateWithTurnOrder(order: number, isPlayer: boolean): void {
        this.turnOrderLabel.value = String(order);
        if (isPlayer) {
            this.turnOrderLabel.view.classList.remove('grey');
            this.turnOrderLabel.view.classList.add('green');
        } else {
            this.turnOrderLabel.view.classList.add('grey');
            this.turnOrderLabel.view.classList.remove('green');
        }
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
            this._labelMissed.show();
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
            this.shake();
            this.hitHpLabel.show();
            this.hitHpLabel.value = withDrain && !itemPhysicalDamage ? '' : `${actualPhysicalDamage}HP`;
            if (this.actionService.hasCriticalMissDamage(result, targetUid)) {
                this.missCriticalLabel.show();
            } else if (this.actionService.hasCriticalDamage(result, targetUid)) {
                this.hitCriticalLabel.show();
            }
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

    public async shake(): Promise<void> {
        await this._icon.shake();
    }

    public async bounce(direction: 'left' | 'right' | 'up'): Promise<void> {
        await this._icon.bounce(direction);
    }

    public changeGear(code: string): void {
        (this._iconGearChange.view as HTMLImageElement).src = `./assets/icons/${code}.png`;
        this.hideActionResultIcons();
        this._iconGearChange.show();
        this.actionResultTimeoutId = window.setTimeout(() => this.hideActionResultIcons(), 500);
    }

    public onUnitLeft(): void {
        this.hideActionResultIcons();
        SoundService.play(SoundName.DOOR);
        const icon = this.icon;
        this.icon = 'door-open';
        clearInterval(this.actionResultTimeoutId);
        this.actionResultTimeoutId = window.setTimeout(() => (this.icon = icon), 800);
    }

    private onActionResultIcon(timeoutms: number = 1100): void {
        this.hideActionResultIcons();
        clearInterval(this.actionResultTimeoutId);
        this.actionResultTimeoutId = window.setTimeout(() => this.hideActionResultIcons(), timeoutms);
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
