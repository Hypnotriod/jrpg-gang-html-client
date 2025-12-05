import { injectable, singleton } from 'tsyringe';
import { ActionType, Ammunition, Armor, GamePhase, GameUnit, InventoryItem, Item, ItemType, UnitInventory, Weapon } from '../../domain/domain';
import { ActionRequestData, RequestType } from '../../dto/requests';
import ActionService from '../../service/ActionService';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import ItemIcon from '../ui/icon/ItemIcon';
import ObjectDescription from '../ui/popup/ObjectDescription';
import GameBase from './GameBase';

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
            iconItem.choosed && (result = iconItem.data);
        });
        return result;
    }

    public set objectDescription(value: ObjectDescription) {
        this._objectDescription = value;
    }

    public getChoosedItem(): ItemIcon | undefined {
        return [...this.unitItems.values()].find(i => i.choosed);
    }

    public update(activeTypes: ItemType[]): void {
        if (!this.state.playerInfo) { return; }
        const unit: GameUnit = this.currentActor();
        if (!unit) { return; }
        this.updateUnitInventoryIcons(unit.inventory, activeTypes);
    }

    private updateUnitInventoryIcons(inventory: UnitInventory, activeTypes: ItemType[]): void {
        const inventoryItems: InventoryItem[] = [
            ...(inventory.weapon || []),
            ...(inventory.ammunition || []),
            ...(inventory.magic || []),
            ...(inventory.armor || []),
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
        iconItem.update(data);
        activeTypes.some(t => t === data.type) ? iconItem.enable() : iconItem.disable();
        this.checkUseCost(data) ? iconItem.canUse() : iconItem.cantUse();
    }

    protected checkUseCost(data: InventoryItem): boolean {
        const unit: GameUnit = this.currentActor();
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
            const wansntChoosed = !target.choosed && target.selected;
            this.unitItems.forEach(i => i.unchoose());
            target.choose();
            if (wansntChoosed) { return; }
        }
        if (!this.canDoUnitConfiguration()) { return; }
        if (target.data.type === ItemType.NONE ||
            target.data.type === ItemType.DISPOSABLE ||
            target.data.type === ItemType.PROVISION ||
            target.data.type === ItemType.MAGIC) {
            return;
        }
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: !(target.data as Ammunition).equipped ? ActionType.EQUIP : ActionType.UNEQUIP,
            itemUid: target.data.uid!,
        } as ActionRequestData);
    }

}
