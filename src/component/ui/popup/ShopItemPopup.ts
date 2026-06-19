import { injectable } from 'tsyringe';
import { ICON, LABEL_DESCRIPTION } from '../../../constants/Components';
import { Disposable, InventoryItem, ItemType, UnitBooty } from '../../../domain/domain';
import GameStateService from '../../../service/GameStateService';
import { component } from '../../decorator/decorator';
import Button from '../button/Button';
import Container from '../container/Container';
import Icon from '../icon/Icon';
import Label from '../label/Label';
import HSlider from '../slider/HSlider';
import ObjectDescription from './ObjectDescription';
import { SoundName, SoundService } from '../../../service/SoundService';
import GameObjectRenderer from '../../../service/GameObjectRenderer';

export enum ShopItemPopupMode {
    BUY,
    SELL,
}

@injectable()
export class ShopItemPopup extends Container {
    @component(ICON, Icon)
    protected readonly icon: Icon;
    @component(LABEL_DESCRIPTION, Label)
    protected readonly labelDescription: Label;
    @component('label_price', Label)
    protected readonly priceLabel: Label;
    @component('label_quantity', Label)
    protected readonly quantityLabel: Label;
    @component('slider_quantity', HSlider)
    protected readonly quantitySlider: HSlider;
    @component('button_yes', Button)
    protected readonly yesButton: Button;
    @component('button_no', Button)
    protected readonly noButton: Button;

    protected _shadow?: Container;
    protected slider: HTMLInputElement;
    protected _item: InventoryItem;
    protected _mode: ShopItemPopupMode = ShopItemPopupMode.BUY;
    protected quantity: number = 1;
    protected onYesCallback: ((quantity: number) => void) | null;

    constructor(
        private readonly state: GameStateService,
        private readonly renderer: GameObjectRenderer,
    ) {
        super();
    }

    protected initialize(): void {
        this.quantitySlider.onChange = () => {
            this.quantity = this.quantitySlider.value
            this.quantityLabel.value = `x${this.quantity}`;
            this.item = this._item;
            SoundService.play(SoundName.CLICK);
        }
        this.noButton.onClick = () => {
            this.hide();
        }
        this.yesButton.onClick = () => {
            this.hide();
            this.onYesCallback?.(this.quantity);
        }
    }

    public override show(): void {
        super.show();
        this._shadow?.show();
        this.quantitySlider.value = 1;
        if (this._mode === ShopItemPopupMode.BUY) {
            const booty = this.state.userState.unit.booty;
            const price: UnitBooty = {
                coins: this._item.price.coins,
                ruby: (this._item.price.ruby ?? 0)
            };
            this.quantitySlider.max = Math.floor(
                Math.min(
                    price.coins ? booty.coins / price.coins : 50,
                    price.ruby ? (booty.ruby ?? 0) / price.ruby : 50,
                )
            );
        } else if (this._item.type === ItemType.DISPOSABLE ||
            this._item.type === ItemType.AMMUNITION ||
            this._item.type === ItemType.PROVISION) {
            this.quantitySlider.max = (this._item as Disposable).quantity ?? 1;
        } else {
            this.quantitySlider.max = 1;
        }
    }

    public override hide(): void {
        super.hide();
        this._shadow?.hide();
    }

    public set onYes(value: ((quantity: number) => void) | null) {
        this.onYesCallback = value;
    }

    public set shadow(value: Container) {
        this._shadow = value;
    }

    public set descriptionPopup(value: ObjectDescription) {
        this.icon.descriptionPopup = value;
    }

    public set item(value: InventoryItem) {
        this.icon.description = value;
        this._item = value;
        this.icon.icon = this._item.code;
        if (this._item.type === ItemType.ARMOR ||
            this._item.type === ItemType.MAGIC ||
            this._item.type === ItemType.WEAPON) {
            this.quantitySlider.hide();
            this.quantityLabel.hide();
        } else {
            this.quantitySlider.show();
            this.quantityLabel.show();
        }
        this.labelDescription.htmlValue =
            this._mode === ShopItemPopupMode.BUY ?
                `Buy<span class="green-text lighten-4">${this._item.name}</span>?` :
                `Sell<span class="green-text lighten-4">${this._item.name}</span>?`;
        const price: UnitBooty =
            this.mode === ShopItemPopupMode.BUY ?
                {
                    coins: this._item.price.coins * this.quantity,
                    ruby: (this._item.price.ruby ?? 0) * this.quantity
                } :
                {
                    coins: (this._item as any).purchasePrice.coins * this.quantity,
                    ruby: ((this._item as any).purchasePrice.ruby ?? 0) * this.quantity
                };
        this.priceLabel.htmlValue = this.renderer.render(price);
    }

    public get mode(): ShopItemPopupMode {
        return this._mode;
    }

    public set mode(value: ShopItemPopupMode) {
        this._mode = value;
    }
}