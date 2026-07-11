import { container } from 'tsyringe';
import { ICON, ICON_BROKEN, ICON_CANT_USE, ICON_CURRENT, LABEL_ACTION_POINTS, LABEL_NAME, LABEL_QUANTITY } from '../../../constants/Components';
import { ITEM_ICON_DESIGN } from '../../../constants/Resources';
import { Ammunition, Equipment, EquipmentSlot, GamePhase, GameUnit, InventoryItem, ItemType, Weapon } from '../../../domain/domain';
import ResourceLoaderService from '../../../service/ResourceLoaderService';
import Component from '../../Component';
import { component } from '../../decorator/decorator';
import Label from '../label/Label';
import ObjectDescription from '../popup/ObjectDescription';
import Icon from './Icon';
import Container from '../container/Container';
import GameStateService from '../../../service/GameStateService';

export default class ItemIcon extends Component {
    @component(ICON, Icon)
    protected readonly _icon: Icon;
    @component(LABEL_NAME, Label)
    protected readonly nameLabel: Label;
    @component(LABEL_QUANTITY, Label)
    protected readonly quantityLabel: Label | null;
    @component(ICON_CURRENT, Container)
    protected readonly iconCurrent: Container;
    @component(ICON_CANT_USE, Container)
    protected readonly iconCantUse: Container;
    @component('icon_slot', Container)
    protected readonly iconSlot: Container;
    @component(ICON_BROKEN, Container)
    protected readonly iconBroken: Container;
    @component(LABEL_ACTION_POINTS, Label)
    protected readonly actionPointsLabel: Label;

    private _data: InventoryItem;
    private _unit: GameUnit | undefined;
    private _hint?: string | undefined;
    private _hover: boolean = false;
    private _descriptionPopup: ObjectDescription;
    private _isShopItem: boolean = false;

    public get isShopItem(): boolean {
        return this._isShopItem;
    }
    public set isShopItem(value: boolean) {
        this._isShopItem = value;
    }

    public get hint(): string | undefined {
        return this._hint;
    }

    public set hint(value: string | undefined) {
        this._hint = value;
        if (this._hover) {
            this.onHover();
        }
    }

    public destroy(): void {
        this._icon.destroy();
        this.nameLabel.destroy();
        this.quantityLabel?.destroy();
        super.destroy();
    }

    public static createItemIcon(icon: string, parent: Component, containerId: string | undefined = undefined): ItemIcon | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        const iconComponent: ItemIcon = parent.create(containerId || parent.view, ItemIcon,
            { design: resourceLoader.get(ITEM_ICON_DESIGN), classList: ['item-icon-warpper'] })!;
        iconComponent.icon = icon;
        return iconComponent;
    }

    public set unit(value: GameUnit | undefined) {
        this._unit = value;
    }

    public get unit(): GameUnit | undefined {
        return this._unit;
    }

    public set icon(value: string) {
        this._icon.icon = value;
    }

    public get icon(): string {
        return this._icon.icon;
    }

    public get usable(): boolean {
        return !this.iconBroken.visible && !this.iconCantUse.visible;
    }

    public override enable(): void {
        this._icon.enable();
    }

    public override disable(): void {
        this._icon.disable();
    }

    public get enabled(): boolean {
        return this._icon.enabled;
    }

    protected initialize(): void {
        this._icon.onHover = t => this.onHover();
        this._icon.onLeave = t => this.onLeave();
        this.iconCantUse?.hide();
        this.iconBroken?.hide();
        this.iconCurrent?.hide();
        this.actionPointsLabel?.hide();
    }

    protected onHover(): void {
        this._hover = true;
        if (!this._descriptionPopup || !this._data) { return; }
        this._descriptionPopup.isShopItem = this._isShopItem;
        this._descriptionPopup.unit = this._unit;
        this._descriptionPopup.data = { ...this._data, hint: this._hint };
        this._descriptionPopup.show();
    }

    protected onLeave(): void {
        this._hover = false;
        if (!this._descriptionPopup || !this._data) { return; }
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

    public select(state?: GameStateService): void {
        this._icon.select(this.chosenEquipped(state));
    }

    public unselect(): void {
        this._icon.unselect();
    }

    public get selected(): boolean {
        return this._icon.selected;
    }

    public choose(state?: GameStateService): void {
        this._icon.choose(this.chosenEquipped(state));
    }

    public unchoose(): void {
        this._icon.unchoose();
    }

    public cantUse() {
        this.iconCantUse?.show();
    }

    public canUse() {
        this.iconCantUse?.hide();
    }

    public get chosen(): boolean {
        return this._icon.chosen;
    }

    private chosenEquipped(state?: GameStateService): boolean {
        const nextPhase = state?.gameState?.nextPhase;
        if (nextPhase === GamePhase.PREPARE_UNIT || nextPhase === GamePhase.SPOT_COMPLETE || nextPhase === GamePhase.SCENARIO_COMPLETE) {
            return false;
        }
        return this.data?.type === ItemType.MAGIC ||
            this.data?.type === ItemType.DISPOSABLE ||
            this.data?.type === ItemType.PROVISION ||
            (this.data as Equipment)?.equipped;
    }

    public update(data: InventoryItem, state: GameStateService): void {
        this._data = data;
        this.name = data.name;
        this.icon = data.code;
        const asEquipment = data as Equipment;
        asEquipment.equipped ? this.select(state) : this.unselect();
        const isBroken = (asEquipment.wearout || -1) >= (asEquipment.durability || 0);
        isBroken ? this.iconBroken?.show() : this.iconBroken?.hide();
        isBroken && this.unselect();
        const cantuse = !state.checkRequirements(asEquipment.requirements);
        cantuse ? this.cantUse() : this.canUse();
        if (!cantuse && asEquipment.equipped) {
            let slot = String(asEquipment.slot || 'ammo');
            if (asEquipment.slotsNumber > 1 && slot === String(EquipmentSlot.WEAPON)) {
                slot = `${EquipmentSlot.WEAPON}-2`;
            }
            (this.iconSlot?.view as HTMLImageElement).src = `./assets/icons/slot-${slot}.png`;
            this.iconSlot?.show();
        } else {
            this.iconSlot?.hide();
        }
        if (!this.quantityLabel) { return; }
        if ((data as Ammunition).quantity !== undefined) {
            this.quantity = (data as Ammunition).quantity || 0;
        } else {
            this.quantityLabel.hide();
        }
        const actionPoints = (data as Weapon).useCost?.actionPoints ?? 0;
        actionPoints ? this.iconCurrent?.show() : this.iconCurrent?.hide();
        actionPoints ? this.actionPointsLabel?.show() : this.actionPointsLabel?.hide();
        if (this.actionPointsLabel) {
            this.actionPointsLabel.value = `${actionPoints}`;
        }
        if (this._hover) {
            this.onHover();
        }
    }

    public set quantity(value: number) {
        if (!this.quantityLabel) { return; }
        this.quantityLabel.show();
        this.quantityLabel.value = String(value);
    }

    public set name(value: string) {
        this.nameLabel.value = value;
    }

    public get data(): InventoryItem {
        return this._data;
    }
}
