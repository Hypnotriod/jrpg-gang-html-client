import { injectable, singleton } from 'tsyringe';
import { ActionType, Ammunition, Armor, EquipmentSlot, GamePhase, GameUnit, InventoryItem, Item, ItemType, UnitInventory, Weapon } from '../../domain/domain';
import { ActionRequestData, RequestType } from '../../dto/requests';
import ActionService from '../../service/ActionService';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import ItemIcon from '../ui/icon/ItemIcon';
import ObjectDescription from '../ui/popup/ObjectDescription';
import GameBase from './GameBase';
import { SoundName, SoundService } from '../../service/SoundService';

@injectable()
@singleton()
export default class GameUnitItems extends GameBase {
    private readonly unitItems: Map<number, ItemIcon> = new Map();
    private _objectDescription: ObjectDescription;

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService,
        private readonly actionService: ActionService) {
        super(state, actionService);
    }

    protected initialize(): void {
        super.initialize();
    }

    public destroy(): void {
        this.unitItems.forEach(item => item.destroy());
        this.unitItems.clear();
    }

    public get chosenItem(): InventoryItem | undefined {
        let result: InventoryItem | undefined;
        this.unitItems.forEach(iconItem => {
            iconItem.chosen && (result = iconItem.data);
        });
        return result;
    }

    public set objectDescription(value: ObjectDescription) {
        this._objectDescription = value;
    }

    public getChosenItem(): ItemIcon | undefined {
        return [...this.unitItems.values()].find(i => i.chosen);
    }

    public update(activeTypes: ItemType[]): void {
        if (!this.state.playerInfo) { return; }
        const unit: GameUnit = this.playersUnit();
        if (!unit) { return; }
        this.updateUnitInventoryIcons(unit.inventory, activeTypes);
    }

    private updateUnitInventoryIcons(inventory: UnitInventory, activeTypes: ItemType[]): void {
        const inventoryItems: InventoryItem[] = [
            ...(inventory.weapon || []),
            ...(inventory.ammunition || []),
            ...(inventory.magic || []),
            ...(inventory.armor?.filter(a => a.slot === EquipmentSlot.WEAPON) || []),
            ...(inventory.armor?.filter(a => a.slot === EquipmentSlot.HAND) || []),
            ...(inventory.armor?.filter(a => a.slot === EquipmentSlot.BODY) || []),
            ...(inventory.armor?.filter(a => a.slot === EquipmentSlot.HEAD) || []),
            ...(inventory.armor?.filter(a => a.slot === EquipmentSlot.LEG) || []),
            ...(inventory.armor?.filter(a => a.slot === EquipmentSlot.NECK) || []),
            ...(inventory.disposable || []),
            ...(inventory.provision || []),
        ];
        inventoryItems.forEach(v => this.updateUnitItem(v, activeTypes));
        this.unitItems.forEach((icon, uid) => {
            if (!inventoryItems.find(i => i.uid === uid)) {
                icon.destroy();
                this.unitItems.delete(uid);
            }
        });
    }

    protected updateUnitItem(data: InventoryItem, activeTypes: ItemType[]): void {
        let iconItem = this.unitItems.get(data.uid!);
        if (!iconItem) {
            iconItem = ItemIcon.createItemIcon(data.code, this)!;
            iconItem.onClick = target => this.onUnitItemClick(target);
            iconItem.descriptionPopup = this._objectDescription;
        }
        this.unitItems.set(data.uid!, iconItem);
        iconItem.update(data, this.state);
        activeTypes.some(t => t === data.type) ? iconItem.enable() : iconItem.disable();
        !this.checkUseCost(data) && iconItem.cantUse();
    }

    protected checkUseCost(data: InventoryItem): boolean {
        const unit: GameUnit = this.playersUnit();
        if (!unit || unit.state.actionPoints === 0) return true;
        return unit.state.actionPoints >= ((data as Weapon).useCost?.actionPoints ?? 0) &&
            unit.state.stamina >= ((data as Weapon).useCost?.stamina ?? 0) &&
            unit.state.mana >= ((data as Weapon).useCost?.mana ?? 0) &&
            unit.state.health >= ((data as Weapon).useCost?.health ?? 0);
    }

    protected onUnitItemClick(target: ItemIcon): void {
        if (target.data.type === ItemType.WEAPON ||
            target.data.type === ItemType.DISPOSABLE ||
            target.data.type === ItemType.PROVISION ||
            target.data.type === ItemType.MAGIC
        ) {
            const wansntChosen = !target.chosen && target.selected;
            this.unitItems.forEach(i => i.unchoose());
            SoundService.play(SoundName.CLICK);
            target.choose();
            if (wansntChosen) { return; }
        }
        if (!this.canDoUnitConfiguration()) { return; }
        if (target.data.type === ItemType.NONE ||
            target.data.type === ItemType.DISPOSABLE ||
            target.data.type === ItemType.PROVISION ||
            target.data.type === ItemType.MAGIC) {
            return;
        }
        SoundService.play(SoundName.CLICK);
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: !(target.data as Ammunition).equipped ? ActionType.EQUIP : ActionType.UNEQUIP,
            itemUid: target.data.uid!,
        } as ActionRequestData);
    }

}
