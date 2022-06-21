import { injectable } from 'tsyringe';
import { LOBBY, LOGIN } from '../../constants/Components';
import { LOBBY_DESIGN, LOBBY_STYLE, LOGIN_DESIGN, LOGIN_STYLE, ROOM_DESIGN } from '../../constants/Resources';
import QueryService from '../../service/QueryService';
import ResourceLoaderService, { RESOURCE_DESIGN } from '../../service/ResourceLoaderService';
import Component from '../Component';
import Lobby from '../lobby/Lobby';
import Login from '../login/Login';

@injectable()
export default class MainScene extends Component {
    private login: Login;
    private lobby: Lobby;

    constructor(
        private readonly loaderService: ResourceLoaderService,
        private readonly query: QueryService) {
        super();
    }

    protected initialize(): void {
        this.initializeComponents().then(() => this.tryToAutologin());
    }

    protected async preloadResources(): Promise<void> {
        await this.loaderService.load(ROOM_DESIGN, RESOURCE_DESIGN);
    }

    protected async initializeComponents(): Promise<void> {
        await this.preloadResources();
        this.login = (await Component.instantiateHighOrderComponent(LOGIN, LOGIN_DESIGN, LOGIN_STYLE, Login))!;
        this.lobby = (await Component.instantiateHighOrderComponent(LOBBY, LOBBY_DESIGN, LOBBY_STYLE, Lobby))!;
    }

    protected tryToAutologin(): void {
        const nickname = this.query.parsedQuery['nickname'];
        const clazz = this.query.parsedQuery['class'];
        if (!nickname || !clazz) { return; }
        this.login.autologin(nickname as string, clazz as string);
    }
}
