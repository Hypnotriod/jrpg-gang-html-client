import { injectable, singleton } from 'tsyringe';
import { ActionType, Ammunition, GameUnit, InventoryItem, ItemType, UnitInventory } from '../../domain/domain';
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

    public set objectDescription(value: ObjectDescription) {
        this._objectDescription = value;
    }

    public getChoosedItem(): ItemIcon | undefined {
        return [...this.unitItems.values()].find(i => i.choosed);
    }

    public update(): void {
        if (!this.state.playerInfo) { return; }
        const unit: GameUnit = this.currentActor();
        if (!unit) { return; }
        this.updateUnitInventoryIcons(unit.inventory);
    }

    private updateUnitInventoryIcons(inventory: UnitInventory): void {
        const inventoryItems: InventoryItem[] = [
            ...(inventory.weapon || []),
            ...(inventory.ammunition || []),
            ...(inventory.magic || []),
            ...(inventory.armor || []),
            ...(inventory.disposable || []),
        ];
        inventoryItems.forEach(v => this.updateUnitItem(v));
        this.unitItems.forEach((icon, uid) => {
            if (!inventoryItems.find(i => i.uid === uid)) {
                icon.destroy();
                this.unitItems.delete(uid);
            }
        });
    }

    protected updateUnitItem(data: InventoryItem): void {
        let iconItem = this.unitItems.get(data.uid!);
        if (!iconItem) {
            iconItem = ItemIcon.createItemIcon(data.code, this)!;
            iconItem.onClick = target => this.onUnitItemClick(target);
            iconItem.descriptionPopup = this._objectDescription;
        }
        this.unitItems.set(data.uid!, iconItem);
        iconItem.update(data);
    }

    protected onUnitItemClick(target: ItemIcon): void {
        if (target.data.type === ItemType.WEAPON || target.data.type === ItemType.DISPOSABLE || target.data.type === ItemType.MAGIC) {
            const wansntChoosed = !target.choosed && target.selected;
            this.unitItems.forEach(i => i.unchoose());
            target.choose();
            if (wansntChoosed) { return; }
        }
        if (!this.canDoUnitConfiguration()) { return; }
        if (target.data.type === ItemType.NONE || target.data.type === ItemType.DISPOSABLE || target.data.type === ItemType.MAGIC) {
            return;
        }
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: !(target.data as Ammunition).equipped ? ActionType.EQUIP : ActionType.UNEQUIP,
            itemUid: target.data.uid!,
        } as ActionRequestData);
    }

}
