import { container } from 'tsyringe';
import { LABEL_PRICE } from '../../../constants/Components';
import { SHOP_ITEM_ICON_DESIGN } from '../../../constants/Resources';
import { Ammunition, Disposable } from '../../../domain/domain';
import ResourceLoaderService from '../../../service/ResourceLoaderService';
import Component from '../../Component';
import { component } from '../../decorator/decorator';
import Label from '../label/Label';
import ItemIcon from './ItemIcon';

export default class ShopItemIcon extends ItemIcon {
    @component(LABEL_PRICE, Label)
    protected readonly priceLabel: Label;

    protected initialize(): void {
    }

    public static createShopItemIcon(icon: string, parent: Component, containerId: string): ShopItemIcon | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        const iconComponent: ShopItemIcon | null = parent.create(containerId, resourceLoader.get(SHOP_ITEM_ICON_DESIGN), ShopItemIcon);
        if (iconComponent) {
            iconComponent.icon = icon;
            iconComponent.view.classList.add('item-icon-warpper');
        }
        return iconComponent;
    }

    public update(data: Disposable | Ammunition): void {
        super.update(data);
        this.priceLabel.value = `$${data.price.coins}`;
    }
}
