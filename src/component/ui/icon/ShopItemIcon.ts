import { LABEL_PRICE } from '../../../constants/Components';
import { Ammunition, Disposable } from '../../../domain/domain';
import { component } from '../../decorator/decorator';
import Label from '../label/Label';
import ItemIcon from './ItemIcon';

export default class ShopItemIcon extends ItemIcon {
    @component(LABEL_PRICE, Label)
    protected readonly priceLabel: Label;

    protected initialize(): void {
    }

    public update(data: Disposable | Ammunition): void {
        super.update(data);
        this.priceLabel.value = `Price: ${data.price.coins}`;
    }
}
