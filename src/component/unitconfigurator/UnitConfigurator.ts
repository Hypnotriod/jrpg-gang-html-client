import { delay, inject, injectable, singleton } from 'tsyringe';
import { BUTTON_LOBBY, CHECKBOX_SELL, ITEM_DESCRIPTION_POPUP, SHOP_ITEMS_CONTAINER, UNIT_ATTRIBUTES, UNIT_BASE_ATTRIBUTES, UNIT_BOOTY, UNIT_ICON, UNIT_INFO, UNIT_ITEMS_CONTAINER, UNIT_PROGRESS, UNIT_RESISTANCE } from '../../constants/Components';
import { ActionType, Ammunition, InventoryItem, ItemType, UnitInventory } from '../../domain/domain';
import { ActionRequestData, RequestType } from '../../dto/requests';
import { Response, ResponseStatus, ShopStateData, UserStateData } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Lobby from '../lobby/Lobby';
import Button from '../ui/button/Button';
import Checkbox from '../ui/checkbox/Checkbox';
import Container from '../ui/container/Container';
import Icon from '../ui/icon/Icon';
import ItemIcon from '../ui/icon/ItemIcon';
import ShopItemIcon from '../ui/icon/ShopItemIcon';
import ObjectDescription from '../ui/popup/ObjectDescription';

@singleton()
@injectable()
export default class UnitConfigurator extends Component implements ServerCommunicatorHandler {
    @component(BUTTON_LOBBY, Button)
    private readonly lobbyButton: Button;
    @component(UNIT_ICON, Icon)
    private readonly unitIcon: Icon;
    @component(UNIT_INFO, Container)
    private readonly unitInfo: Container;
    @component(UNIT_BOOTY, Container)
    private readonly unitBooty: Container;
    @component(UNIT_PROGRESS, Container)
    private readonly unitProgress: Container;
    @component(UNIT_BASE_ATTRIBUTES, Container)
    private readonly unitBaseAttributes: Container;
    @component(UNIT_ATTRIBUTES, Container)
    private readonly unitAttributes: Container;
    @component(UNIT_RESISTANCE, Container)
    private readonly unitResistance: Container;
    @component(ITEM_DESCRIPTION_POPUP, ObjectDescription)
    private readonly itemDescription: ObjectDescription;
    @component(CHECKBOX_SELL, Checkbox)
    private readonly sellCheckbox: Checkbox;

    private readonly unitItems: Map<number, ItemIcon> = new Map();
    private readonly shopItems: Map<number, ItemIcon> = new Map();

    constructor(private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService,
        @inject(delay(() => Lobby)) private readonly lobby: Lobby) {
        super();
    }

    public show(): void {
        this.communicator.sendMessage(RequestType.USER_STATUS);
        this.communicator.sendMessage(RequestType.SHOP_STATUS);
        super.show();
    }

    protected initialize(): void {
        this.hide();
        this.itemDescription.hide();
        this.communicator.subscribe([RequestType.USER_STATUS, RequestType.JOIN, RequestType.SHOP_STATUS], this);
        this.lobbyButton.onClick = target => this.goToLobby();
    }

    protected goToLobby(): void {
        this.hide();
        this.communicator.sendMessage(RequestType.ENTER_LOBBY);
        this.lobby.show();
    }

    public handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        switch (response.type) {
            case RequestType.JOIN:
            case RequestType.USER_STATUS:
                this.updateUserStatus(response.data as UserStateData);
                break;
            case RequestType.SHOP_STATUS:
                this.updateShopStatus(response.data as ShopStateData);
                break;
        }
    }

    public handleConnectionLost(): void {
        this.unitItems.forEach(item => item.destroy());
        this.shopItems.forEach(item => item.destroy());
        this.unitItems.clear();
        this.shopItems.clear();
        this.hide();
    }

    protected updateShopStatus(data: ShopStateData): void {
        this.updateShopInventoryIcons(data.shop.items);
    }

    protected updateShopInventoryIcons(inventory: UnitInventory): void {
        const inventoryItems: InventoryItem[] = [
            ...(inventory.weapon || []),
            ...(inventory.ammunition || []),
            ...(inventory.magic || []),
            ...(inventory.armor || []),
            ...(inventory.disposable || []),
        ];
        inventoryItems.forEach(v => this.updateShopItem(v));
        this.shopItems.forEach((icon, uid) => {
            if (!inventoryItems.find(i => i.uid === uid)) {
                icon.destroy();
                this.shopItems.delete(uid);
            }
        });
    }

    protected updateShopItem(data: InventoryItem): void {
        let iconItem = this.shopItems.get(data.uid!);
        if (!iconItem) {
            iconItem = ShopItemIcon.createShopItemIcon(data.code, this, SHOP_ITEMS_CONTAINER)!;
            iconItem.onClick = target => this.onShopItemClick(target);
            iconItem.descriptionPopup = this.itemDescription;
        }
        this.shopItems.set(data.uid!, iconItem);
        iconItem.update(data);
    }

    protected updateUserStatus(data: UserStateData): void {
        this.state.userState = data;
        this.unitIcon.icon = this.state.userState.playerInfo.class;
        this.unitInfo.value = this.state.userState.playerInfo.nickname;
        this.unitBooty.value = this.objValues(this.state.userState.unit.booty);
        this.unitProgress.value = this.objValues(this.state.userState.unit.stats.progress);
        this.unitBaseAttributes.value = this.objValues(this.state.userState.unit.stats.baseAttributes);
        this.unitAttributes.value = this.objValues(this.state.userState.unit.stats.attributes);
        this.unitResistance.value = this.objValues(this.state.userState.unit.stats.resistance);
        this.updateUnitInventoryIcons(this.state.userState.unit.inventory);
    }

    protected objValues(obj: Object): string {
        let result = '';
        Object.keys(obj).forEach(key => result +=
            (obj[key] instanceof Object ?
                `${key}:<br> ${this.objValues(obj[key])}` :
                `${key}: ${obj[key]}<br>`));
        return result;
    }

    protected updateUnitInventoryIcons(inventory: UnitInventory): void {
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
            iconItem = ItemIcon.createItemIcon(data.code, this, UNIT_ITEMS_CONTAINER)!;
            iconItem.onClick = target => this.onUnitItemClick(target);
            iconItem.descriptionPopup = this.itemDescription;
        }
        this.unitItems.set(data.uid!, iconItem);
        iconItem.update(data);
    }

    protected onUnitItemClick(target: ItemIcon): void {
        this.sellCheckbox.checked ? this.sellItem(target) : this.euipUneuipItem(target);
    }

    protected euipUneuipItem(target: ItemIcon): void {
        if (target.data.type === ItemType.NONE || target.data.type === ItemType.DISPOSABLE) { return; }
        this.communicator.sendMessage(RequestType.CONFIGURATION_ACTION, {
            action: !(target.data as Ammunition).equipped ? ActionType.EQUIP : ActionType.UNEQUIP,
            itemUid: target.data.uid!,
        } as ActionRequestData);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected sellItem(target: ItemIcon): void {
        this.communicator.sendMessage(RequestType.SHOP_ACTION, {
            action: ActionType.SELL,
            itemUid: target.data.uid!,
        } as ActionRequestData);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected onShopItemClick(target: ItemIcon): void {
        this.communicator.sendMessage(RequestType.SHOP_ACTION, {
            action: ActionType.BUY,
            itemUid: target.data.uid!,
        } as ActionRequestData);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }
}
