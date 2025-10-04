import { injectable } from 'tsyringe';
import { AUTH_CONTAINER, GAME_CONTAINER, JOBS_CONTAINER, LOBBY_CONTAINER, LOGIN_CONTAINER, UNIT_CONFIGURATOR_CONTAINER } from '../../constants/Components';
import { AUTH_DESIGN, AUTH_STYLE, GAME_DESIGN, GAME_STYLE, ITEM_ICON_DESIGN, JOBS_DESIGN, JOBS_STYLE, JOB_DESIGN, LOBBY_DESIGN, LOBBY_STYLE, LOGIN_DESIGN, LOGIN_STYLE, ROOM_DESIGN, SHOP_ITEM_ICON_DESIGN, SPOT_CELL_DESIGN, UNIT_CONFIGURATOR_DESIGN, UNIT_CONFIGURATOR_STYLE } from '../../constants/Resources';
import ResourceLoaderService, { RESOURCE_DESIGN } from '../../service/ResourceLoaderService';
import SceneSwitcherService from '../../service/SceneSwitcherService';
import Component from '../Component';
import GameScene from '../gamescene/GameScene';
import Jobs from '../jobs/Jobs';
import Lobby from '../lobby/Lobby';
import Login from '../login/Login';
import Auth from '../auth/Auth';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import { RequestType } from '../../dto/requests';
import GameStateService from '../../service/GameStateService';
import { KEY_SESSION_ID } from '../../dto/responces';

const LEAVE_ON_OUT_OF_FOCUS_TIMEOUT_MS: number = 10 * 60 * 1000;

@injectable()
export default class MainScene extends Component {
    private login: Login;
    private auth: Auth;
    private lobby: Lobby;
    private configurator: UnitConfigurator;
    private gameScene: GameScene;
    private jobs: Jobs;
    private blurTimeout: number = 0;

    constructor(
        private readonly loaderService: ResourceLoaderService,
        private readonly sceneSwitcherService: SceneSwitcherService,
        private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.hide();
        this.initializeComponents().then(() => {
            this.login.tryToAutologin();
            this.show();
        });
        this.initializeFocusHandler();
    }

    protected async preloadResources(): Promise<void> {
        await this.loaderService.load(ROOM_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(ITEM_ICON_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(SHOP_ITEM_ICON_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(SPOT_CELL_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(JOB_DESIGN, RESOURCE_DESIGN);
    }

    protected async initializeComponents(): Promise<void> {
        await this.preloadResources();
        this.login = (await Component.instantiateHighOrderComponent(LOGIN_CONTAINER, LOGIN_DESIGN, LOGIN_STYLE, Login))!;
        this.auth = (await Component.instantiateHighOrderComponent(AUTH_CONTAINER, AUTH_DESIGN, AUTH_STYLE, Auth))!;
        this.lobby = (await Component.instantiateHighOrderComponent(LOBBY_CONTAINER, LOBBY_DESIGN, LOBBY_STYLE, Lobby))!;
        this.configurator = (await Component.instantiateHighOrderComponent(UNIT_CONFIGURATOR_CONTAINER, UNIT_CONFIGURATOR_DESIGN, UNIT_CONFIGURATOR_STYLE, UnitConfigurator))!;
        this.gameScene = (await Component.instantiateHighOrderComponent(GAME_CONTAINER, GAME_DESIGN, GAME_STYLE, GameScene))!;
        this.jobs = (await Component.instantiateHighOrderComponent(JOBS_CONTAINER, JOBS_DESIGN, JOBS_STYLE, Jobs))!;
    }

    protected initializeFocusHandler() {
        window.addEventListener('blur', (event) => {
            this.blurTimeout = window.setTimeout(() => {
                if (!this.state.userState?.sessionId) return;
                localStorage.removeItem(KEY_SESSION_ID);
                this.communicator.sendMessage(RequestType.LEAVE);
                window.location.reload();
            }, LEAVE_ON_OUT_OF_FOCUS_TIMEOUT_MS);
        });
        window.addEventListener('focus', (event) => {
            this.blurTimeout && window.clearTimeout(this.blurTimeout);
            this.blurTimeout = 0;
        });
    }
}
