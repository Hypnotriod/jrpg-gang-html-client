import { injectable } from 'tsyringe';
import { LOBBY, LOGIN } from '../../constants/Components';
import { LOBBY_DESIGN, LOBBY_STYLE, LOGIN_DESIGN, LOGIN_STYLE, ROOM_DESIGN } from '../../constants/Resources';
import ResourceLoaderService, { RESOURCE_DESIGN } from '../../service/ResourceLoaderService';
import Component from '../Component';
import Lobby from '../lobby/Lobby';
import Login from '../login/Login';

@injectable()
export default class MainScene extends Component {
    constructor(private readonly loaderService: ResourceLoaderService) {
        super();
    }

    protected initialize(): void {
        this.initializeComponents();
    }

    protected async preloadResources(): Promise<void> {
        await this.loaderService.load(ROOM_DESIGN, RESOURCE_DESIGN);
    }

    protected async initializeComponents(): Promise<void> {
        await this.preloadResources();
        const login = await Component.instantiateHighOrderComponent(LOGIN, LOGIN_DESIGN, LOGIN_STYLE, Login);
        await Component.instantiateHighOrderComponent(LOBBY, LOBBY_DESIGN, LOBBY_STYLE, Lobby);

        login!.autologin();
    }
}
