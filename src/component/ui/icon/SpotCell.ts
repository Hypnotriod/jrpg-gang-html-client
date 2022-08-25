import { container } from 'tsyringe';
import { ICON } from '../../../constants/Components';
import { SPOT_CELL_DESIGN } from '../../../constants/Resources';
import { Unit } from '../../../domain/domain';
import ResourceLoaderService from '../../../service/ResourceLoaderService';
import Component from '../../Component';
import { component } from '../../decorator/decorator';
import Icon from './Icon';

export default class SpotCell extends Component {
    @component(ICON, Icon)
    protected readonly _icon: Icon;

    protected initialize(): void {
    }

    public set icon(value: string) {
        this._icon.icon = value;
    }

    public get icon(): string {
        return this._icon.icon;
    }

    public static createSpotCell(icon: string, parent: Component, containerId: string): SpotCell | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        const iconComponent: SpotCell = parent.create(containerId, SpotCell,
            { design: resourceLoader.get(SPOT_CELL_DESIGN), classList: ['item-icon-warpper'] })!;
        iconComponent.icon = icon;
        return iconComponent;
    }

    public update(data: Unit): void {
    }
}
