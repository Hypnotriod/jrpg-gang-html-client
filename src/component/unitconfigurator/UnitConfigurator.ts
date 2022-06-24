import { delay, inject, injectable, singleton } from 'tsyringe';
import { BUTTON_LOBBY, ITEMS_CONTAINER, UNIT_ATTRIBUTES, UNIT_BASE_ATTRIBUTES, UNIT_BOOTY, UNIT_ICON, UNIT_INFO, UNIT_PROGRESS, UNIT_RESISTANCE, UNIT_STATE } from '../../constants/Components';
import { Ammunition, Disposable, UnitInventory } from '../../domain/domain';
import { RequestType } from '../../dto/requests';
import { Response, UserStateData } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Lobby from '../lobby/Lobby';
import Button from '../ui/button/Button';
import Container from '../ui/container/Container';
import Icon from '../ui/icon/Icon';
import ItemIcon from '../ui/icon/ItemIcon';

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
    @component(UNIT_STATE, Container)
    private readonly unitState: Container;
    @component(UNIT_PROGRESS, Container)
    private readonly unitProgress: Container;
    @component(UNIT_BASE_ATTRIBUTES, Container)
    private readonly unitBaseAttributes: Container;
    @component(UNIT_ATTRIBUTES, Container)
    private readonly unitAttributes: Container;
    @component(UNIT_RESISTANCE, Container)
    private readonly unitResistance: Container;

    private readonly items: Map<number, ItemIcon> = new Map();

    constructor(private readonly communicator: ServerCommunicatorService,
        private readonly gameState: GameStateService,
        @inject(delay(() => Lobby)) private readonly lobby: Lobby) {
        super();
    }

    public show(): void {
        this.communicator.sendMessage(RequestType.USER_STATUS);
        super.show();
    }

    protected initialize(): void {
        this.hide();
        this.communicator.subscribe([RequestType.USER_STATUS], this);

        this.lobbyButton.onClick = target => this.goToLobby();
    }

    protected goToLobby(): void {
        this.hide();
        this.lobby.show();
    }

    public handleServerResponse(response: Response): void {
        this.gameState.userState = response.data as UserStateData;
        this.unitIcon.icon = this.gameState.userState.playerInfo.class;
        this.unitInfo.value = this.gameState.userState.playerInfo.nickname;
        this.unitBooty.value = this.objValues(this.gameState.userState.unit.booty);
        this.unitState.value = this.objValues(this.gameState.userState.unit.state);
        this.unitProgress.value = this.objValues(this.gameState.userState.unit.stats.progress);
        this.unitBaseAttributes.value = this.objValues(this.gameState.userState.unit.stats.baseAttributes);
        this.unitAttributes.value = this.objValues(this.gameState.userState.unit.stats.attributes);
        this.unitResistance.value = this.objValues(this.gameState.userState.unit.stats.resistance);
        this.updateInventoryIcons(this.gameState.userState.unit.inventory);
    }

    protected objValues(obj: Object): string {
        let result = '';
        Object.keys(obj).forEach(key => result +=
            (obj[key] instanceof Object ?
                `${key}:<br> ${this.objValues(obj[key])}` :
                `${key}: ${obj[key]}<br>`));
        return result;
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
        this.items.set(data.uid!, iconItem);
        iconItem.update(data);
    }
}
