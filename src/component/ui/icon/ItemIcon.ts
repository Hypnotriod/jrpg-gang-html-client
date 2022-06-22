import { container } from 'tsyringe';
import { ICON, LABEL_NAME, LABEL_QUANTITY } from '../../../constants/Components';
import { ITEM_ICON_DESIGN } from '../../../constants/Resources';
import { Ammunition, Disposable } from '../../../domain/domain';
import ResourceLoaderService from '../../../service/ResourceLoaderService';
import Component from '../../Component';
import { component } from '../../decorator/decorator';
import Label from '../label/Label';
import Icon from './Icon';

export default class ItemIcon extends Component {
    @component(ICON, Icon)
    protected readonly _icon: Icon;
    @component(LABEL_NAME, Label)
    protected readonly nameLabel: Label;
    @component(LABEL_QUANTITY, Label)
    protected readonly quantityLabel: Label;

    public static createItemIcon(icon: string, parent: Component, containerId: string): ItemIcon | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        const iconComponent: ItemIcon | null = parent.create(containerId, resourceLoader.get(ITEM_ICON_DESIGN), ItemIcon);
        if (iconComponent) {
            iconComponent.icon = icon;
            iconComponent.view.classList.add('item-icon-warpper');
        }
        return iconComponent;
    }

    public set icon(value: string) {
        this._icon.icon = value;
    }

    public get icon(): string {
        return this._icon.icon;
    }

    protected initialize(): void {
    }

    public update(data: Disposable | Ammunition): void {
        this.nameLabel.value = data.name;
        this._icon.icon = data.code;
        if (data.quantity !== undefined) {
            this.quantityLabel.show();
            this.quantityLabel.value = String(data.quantity);
        } else {
            this.quantityLabel.hide();
        }
    }
}
