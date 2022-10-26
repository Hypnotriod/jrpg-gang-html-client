import { injectable, singleton } from 'tsyringe';
import { ActionType, Ammunition, Disposable, ItemType, UnitInventory } from '../../domain/domain';
import { ActionData, RequestType } from '../../dto/requests';
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
        private readonly state: GameStateService) {
        super(state);
    }

    protected initialize(): void {
        super.initialize();
    }

    public destroy(): void {
        this.unitItems.forEach(item => item.destroy());
        this.unitItems.clear();
        super.destroy();
    }

    public set objectDescription(value: ObjectDescription) {
        this._objectDescription = value;
    }

    public getChoosedItem(): ItemIcon | undefined {
        return [...this.unitItems.values()].find(i => i.choosed);
    }

    public updateUnitInventoryIcons(inventory: UnitInventory): void {
        const inventoryItems: (Disposable | Ammunition)[] = [
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

    protected updateUnitItem(data: Disposable | Ammunition): void {
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
        if (!this.canDoUnitConfiguration()) { return; }
        if (target.data.type === ItemType.WEAPON || target.data.type === ItemType.DISPOSABLE) {
            const wansntChoosed = !target.choosed && target.selected;
            this.unitItems.forEach(i => i.unchoose());
            target.choose();
            if (wansntChoosed) { return; }
        }
        if (target.data.type === ItemType.NONE || target.data.type === ItemType.DISPOSABLE) { return; }
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: !(target.data as Ammunition).equipped ? ActionType.EQUIP : ActionType.UNEQUIP,
            itemUid: target.data.uid!,
        } as ActionData);
    }

}