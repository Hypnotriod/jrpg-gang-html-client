import { container } from 'tsyringe';
import { ICON, LABEL_NAME, LABEL_QUANTITY } from '../../../constants/Components';
import { ITEM_ICON_DESIGN } from '../../../constants/Resources';
import { Ammunition, Disposable, Equipment } from '../../../domain/domain';
import ResourceLoaderService from '../../../service/ResourceLoaderService';
import Component from '../../Component';
import { component } from '../../decorator/decorator';
import Label from '../label/Label';
import ObjectDescription from '../popup/ObjectDescription';
import Icon from './Icon';

export default class ItemIcon extends Component {
    @component(ICON, Icon)
    protected readonly _icon: Icon;
    @component(LABEL_NAME, Label)
    protected readonly nameLabel: Label;
    @component(LABEL_QUANTITY, Label)
    protected readonly quantityLabel: Label | null;

    private _data: Disposable | Ammunition;
    private _descriptionPopup: ObjectDescription;

    public destroy(): void {
        this._icon.destroy();
        this.nameLabel.destroy();
        this.quantityLabel?.destroy();
        super.destroy();
    }

    public static createItemIcon(icon: string, parent: Component, containerId: string): ItemIcon | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        const iconComponent: ItemIcon = parent.create(containerId, ItemIcon,
            { design: resourceLoader.get(ITEM_ICON_DESIGN), classList: ['item-icon-warpper'] })!;
        iconComponent.icon = icon;
        return iconComponent;
    }

    public set icon(value: string) {
        this._icon.icon = value;
    }

    public get icon(): string {
        return this._icon.icon;
    }

    protected initialize(): void {
        this._icon.onHover = t => this.onHover();
        this._icon.onLeave = t => this.onLeave();
    }

    protected onHover(): void {
        this._descriptionPopup.data = this._data;
        this._descriptionPopup.show();
    }

    protected onLeave(): void {
        this._descriptionPopup.hide();
    }

    public set onClick(callback: (target: ItemIcon) => void) {
        this._icon.onClick = t => callback(this);
    }

    public set descriptionPopup(value: ObjectDescription) {
        this._descriptionPopup = value;
    }

    public get descriptionPopup(): ObjectDescription {
        return this._descriptionPopup;
    }

    public select(): void {
        this._icon.select();
    }

    public unselect(): void {
        this._icon.unselect();
    }

    public get selected(): boolean {
        return this._icon.selected;
    }

    public choose(): void {
        this._icon.choose();
    }

    public unchoose(): void {
        this._icon.unchoose();
    }

    public get choosed(): boolean {
        return this._icon.choosed;
    }

    public update(data: Disposable | Ammunition | Equipment): void {
        this._data = data;
        this.nameLabel.value = data.name;
        this._icon.icon = data.code;
        (data as Equipment).equipped ? this.select() : this.unselect();
        if (!this.quantityLabel) { return; }
        if ((data as Ammunition).quantity !== undefined) {
            this.quantityLabel.show();
            this.quantityLabel.value = String((data as Ammunition).quantity);
        } else {
            this.quantityLabel.hide();
        }
    }

    public get data(): Disposable | Ammunition | Equipment {
        return this._data;
    }
}
