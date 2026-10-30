import { injectable, singleton } from 'tsyringe';
import { ICON } from '../../constants/Components';
import { ActionType, EquipmentUpgrade, InventoryItem } from '../../domain/domain';
import { ActionRequestData, RequestType } from '../../dto/requests';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Container from '../ui/container/Container';
import Icon from '../ui/icon/Icon';
import ObjectDescription from '../ui/popup/ObjectDescription';
import UpgradeItem from './UpgradeItem';

@injectable()
@singleton()
export default class UpgradePopup extends Component {
    @component(ICON, Icon)
    protected readonly icon: Icon;
    @component('button_close', Button)
    protected readonly buttonClose: Button;

    protected items: UpgradeItem[] = [];
    protected _shadow?: Container;
    protected _item: InventoryItem;

    public set descriptionPopup(value: ObjectDescription) {
        this.icon.descriptionPopup = value;
    }

    public set item(value: InventoryItem) {
        this._item = value;
    }

    public set shadow(value: Container) {
        this._shadow = value;
    }

    constructor(
        private readonly communicator: ServerCommunicatorService) {
        super();
    }

    public override show(): void {
        super.show();
        this._shadow?.show();
        this.icon.icon = this._item.code;
        this.icon.description = this._item;
    }

    public override hide(): void {
        super.hide();
        this._shadow?.hide();
    }

    protected initialize(): void {
        this.buttonClose.onClick = target => this.hide();
    }

    public update(upgrades: EquipmentUpgrade[]): void {
        this.items.forEach(item => item.destroy());
        this.items = upgrades.map(mercenary => {
            const item = UpgradeItem.createItem(this, 'upgrades_container')!;
            item.update(mercenary);
            item.onUpgrade = code => this.upgradeClick(code);
            return item;
        });
    }

    protected upgradeClick(uid: number): void {
        this.communicator.sendMessage(RequestType.SHOP_ACTION, {
            action: ActionType.BUY_AND_UPGRADE,
            itemUid: this._item.uid!,
            uid,
        } as ActionRequestData);
        this.communicator.sendMessage(RequestType.SHOP_STATUS);
        this.communicator.sendMessage(RequestType.USER_STATUS);
        this.hide();
    }
}