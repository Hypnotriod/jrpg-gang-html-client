import { injectable } from 'tsyringe';
import { GAME_CONTAINER, LOBBY_CONTAINER, LOGIN_CONTAINER, UNIT_CONFIGURATOR_CONTAINER } from '../../constants/Components';
import { GAME_DESIGN, GAME_STYLE, ITEM_ICON_DESIGN, LOBBY_DESIGN, LOBBY_STYLE, LOGIN_DESIGN, LOGIN_STYLE, ROOM_DESIGN, SHOP_ITEM_ICON_DESIGN, SPOT_CELL_DESIGN, UNIT_CONFIGURATOR_DESIGN, UNIT_CONFIGURATOR_STYLE } from '../../constants/Resources';
import ResourceLoaderService, { RESOURCE_DESIGN } from '../../service/ResourceLoaderService';
import SceneSwitcherService from '../../service/SceneSwitcherService';
import Component from '../Component';
import GameScene from '../gamescene/GameScene';
import Lobby from '../lobby/Lobby';
import Login from '../login/Login';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';

@injectable()
export default class MainScene extends Component {
    private login: Login;
    private lobby: Lobby;
    private configurator: UnitConfigurator;
    private gameScene: GameScene;

    constructor(
        private readonly loaderService: ResourceLoaderService,
        private readonly sceneSwitcherService: SceneSwitcherService) {
        super();
    }

    protected initialize(): void {
        this.initializeComponents().then(() => this.login.tryToAutologin());
    }

    protected async preloadResources(): Promise<void> {
        await this.loaderService.load(ROOM_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(ITEM_ICON_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(SHOP_ITEM_ICON_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(SPOT_CELL_DESIGN, RESOURCE_DESIGN);
    }

    protected async initializeComponents(): Promise<void> {
        await this.preloadResources();
        this.login = (await Component.instantiateHighOrderComponent(LOGIN_CONTAINER, LOGIN_DESIGN, LOGIN_STYLE, Login))!;
        this.lobby = (await Component.instantiateHighOrderComponent(LOBBY_CONTAINER, LOBBY_DESIGN, LOBBY_STYLE, Lobby))!;
        this.configurator = (await Component.instantiateHighOrderComponent(UNIT_CONFIGURATOR_CONTAINER, UNIT_CONFIGURATOR_DESIGN, UNIT_CONFIGURATOR_STYLE, UnitConfigurator))!;
        this.gameScene = (await Component.instantiateHighOrderComponent(GAME_CONTAINER, GAME_DESIGN, GAME_STYLE, GameScene))!;
    }
}
