import { injectable } from 'tsyringe';
import { LOBBY, LOGIN } from '../../constants/Components';
import { LOBBY_DESIGN, LOBBY_STYLE, LOGIN_DESIGN, LOGIN_STYLE } from '../../constants/Resources';
import Component from '../Component';
import Lobby from '../lobby/Lobby';
import Login from '../login/Login';

@injectable()
export default class MainScene extends Component {
    protected login: Login;
    protected lobby: Lobby;

    protected initialize(): void {
        this.initializeComponents();
    }

    protected async initializeComponents(): Promise<void> {
        this.login = (await Component.instantiateHighOrderComponent(LOGIN, LOGIN_DESIGN, LOGIN_STYLE, Login))!;
        this.lobby = (await Component.instantiateHighOrderComponent(LOBBY, LOBBY_DESIGN, LOBBY_STYLE, Lobby))!;

        this.login.autologin();
    }
}
