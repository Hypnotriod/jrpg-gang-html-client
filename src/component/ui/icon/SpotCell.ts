import { container, injectable } from 'tsyringe';
import { ICON, ICON_EFFECT, ICON_HIT, ICON_MISSED, ICON_STUNNED } from '../../../constants/Components';
import { SPOT_CELL_DESIGN } from '../../../constants/Resources';
import { ActionResult, ActionType, Cell, GameUnit, GameUnitFaction } from '../../../domain/domain';
import ActionService from '../../../service/ActionService';
import ResourceLoaderService from '../../../service/ResourceLoaderService';
import Component from '../../Component';
import { component } from '../../decorator/decorator';
import Container from '../container/Container';
import ObjectDescription from '../popup/ObjectDescription';
import Icon from './Icon';

@injectable()
export default class SpotCell extends Component {
    @component(ICON, Icon)
    protected readonly _icon: Icon;
    @component(ICON_STUNNED, Icon)
    protected readonly _iconStunned: Icon;
    @component(ICON_EFFECT, Container)
    protected readonly _iconEffect: Container;
    @component(ICON_HIT, Container)
    protected readonly _iconHit: Container;
    @component(ICON_MISSED, Container)
    protected readonly _iconMissed: Container;

    private _descriptionPopup: ObjectDescription;
    private _unit: GameUnit | undefined;
    private _x: number;
    private _y: number;

    constructor(private readonly actionService: ActionService) {
        super();
    }

    protected initialize(): void {
        this._icon.onHover = t => this.onHover();
        this._icon.onLeave = t => this.onLeave();
        this._iconStunned.hide();
        this._iconEffect.hide();
        this._iconHit.hide();
        this._iconMissed.hide();
    }

    protected onHover(): void {
        if (!this._unit) { return; }
        this._descriptionPopup.data = {
            name: this._unit.playerInfo?.nickname || this._unit.name,
            unitUid: this._unit.uid,
            state: this._unit.state,
            damage: this._unit.damage,
            stats: this._unit.stats,
            modification: this._unit.modification,
        };
        this._descriptionPopup.show();
    }

    protected onLeave(): void {
        this._descriptionPopup.hide();
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

    public static createSpotCell(parent: Component, containerId: string): SpotCell | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        const iconComponent: SpotCell = parent.create(containerId, SpotCell,
            { design: resourceLoader.get(SPOT_CELL_DESIGN), classList: ['item-icon-warpper'] })!;
        return iconComponent;
    }

    public updateWithCell(cell: Cell): void {
        this.icon = cell.code;
        if (cell.factions.includes(GameUnitFaction.PARTY)) {
            this._icon.enable();
        } else {
            this._icon.disable();
        }
        this._iconStunned.hide();
        this._iconEffect.hide();
        this._iconHit.hide();
        this._iconMissed.hide();
        this._unit = undefined;
    }

    public updateWithUnit(unit: GameUnit): void {
        this._unit = unit;
        unit.state.isStunned ? this._iconStunned.show() : this._iconStunned.hide();
        this.icon = unit.playerInfo ? unit.playerInfo.class! : unit.code!;
        if (unit.faction === GameUnitFaction.ENEMY) {
            this._icon.enable();
        }
        this._iconEffect.hide();
        this._iconHit.hide();
        this._iconMissed.hide();
    }

    public updateWithCorpse(corpse: GameUnit): void {
        this._icon.icon = 'tomb';
        this._iconEffect.hide();
        this._iconHit.hide();
        this._iconMissed.hide();
    }

    public updateWithActionResult(result: ActionResult): void {
        this._iconEffect.hide();
        this._iconHit.hide();
        this._iconMissed.hide();
        if (!this.actionService.hasEffect(result)) {
            this._iconMissed.show();
        } else if (this.actionService.hasDamage(result)) {
            this._iconHit.show();
        } else if (this.actionService.hasRecovery(result)) {
            this._iconEffect.show();
        }
    }
}
