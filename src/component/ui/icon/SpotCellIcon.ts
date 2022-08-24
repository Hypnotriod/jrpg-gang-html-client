import { container } from 'tsyringe';
import { ICON } from '../../../constants/Components';
import { SPOT_CELL_DESIGN } from '../../../constants/Resources';
import { Unit } from '../../../domain/domain';
import ResourceLoaderService from '../../../service/ResourceLoaderService';
import Component from '../../Component';
import { component } from '../../decorator/decorator';
import Icon from './Icon';

export default class SpotCellIcon extends Component {
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

    public static createSpotCellIcon(icon: string, parent: Component, containerId: string): SpotCellIcon | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        const iconComponent: SpotCellIcon | null = parent.create(containerId, resourceLoader.get(SPOT_CELL_DESIGN), SpotCellIcon);
        if (iconComponent) {
            iconComponent.icon = icon;
            iconComponent.view.classList.add('item-icon-warpper');
        }
        return iconComponent;
    }

    public update(data: Unit): void {
    }
}
