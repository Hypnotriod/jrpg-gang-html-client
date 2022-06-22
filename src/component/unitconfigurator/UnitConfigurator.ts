import { injectable, singleton } from 'tsyringe';
import { ITEMS_CONTAINER } from '../../constants/Components';
import { Ammunition, Disposable, UnitInventory } from '../../domain/domain';
import { RequestType } from '../../dto/requests';
import { Response, UserStateData } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import ItemIcon from '../ui/icon/ItemIcon';

@singleton()
@injectable()
export default class UnitConfigurator extends Component implements ServerCommunicatorHandler {
    private readonly items: Map<number, ItemIcon> = new Map();

    constructor(private readonly communicator: ServerCommunicatorService,
        private readonly gameState: GameStateService) {
        super();
    }

    public show(): void {
        this.communicator.sendMessage(RequestType.USER_STATUS);
        super.show();
    }

    protected initialize(): void {
        this.communicator.subscribe([RequestType.USER_STATUS], this);
    }

    public handleServerResponse(response: Response): void {
        this.gameState.userState = response.data as UserStateData;
        this.updateInventoryIcons(this.gameState.userState.unit.inventory);
    }

    protected updateInventoryIcons(inventory: UnitInventory): void {
        inventory.ammunition?.forEach(v => this.updateItem(v));
        inventory.armor?.forEach(v => this.updateItem(v));
        inventory.disposable?.forEach(v => this.updateItem(v));
        inventory.magic?.forEach(v => this.updateItem(v));
        inventory.weapon?.forEach(v => this.updateItem(v));
    }

    protected updateItem(data: Disposable | Ammunition): void {
        let iconItem = this.items.get(data.uid!);
        if (!iconItem) {
            iconItem = ItemIcon.createItemIcon(data.code, this, ITEMS_CONTAINER)!;
        }
        iconItem.update(data);
    }
}
