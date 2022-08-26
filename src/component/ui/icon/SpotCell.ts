import { container } from 'tsyringe';
import { ICON } from '../../../constants/Components';
import { SPOT_CELL_DESIGN } from '../../../constants/Resources';
import { Cell, GameUnit, GameUnitFaction } from '../../../domain/domain';
import ResourceLoaderService from '../../../service/ResourceLoaderService';
import Component from '../../Component';
import { component } from '../../decorator/decorator';
import Icon from './Icon';

export default class SpotCell extends Component {
    @component(ICON, Icon)
    protected readonly _icon: Icon;

    private _x: number;
    private _y: number;

    protected initialize(): void {
        this._icon.onHover = t => this.onHover();
        this._icon.onLeave = t => this.onLeave();
    }

    protected onHover(): void {
        // this._descriptionPopup.data = this._data;
        // this._descriptionPopup.show();
    }

    protected onLeave(): void {
        // this._descriptionPopup.hide();
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
    }

    public updateWithUnit(unit: GameUnit): void {
        this.icon = unit.playerInfo ? unit.playerInfo.class! : unit.code!;
    }
}
