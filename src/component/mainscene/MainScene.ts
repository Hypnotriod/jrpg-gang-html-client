import { injectable } from 'tsyringe';
import { LOGIN } from '../../constants/Components';
import { LOGIN_DESIGN, LOGIN_STYLE } from '../../constants/Resources';
import Component from '../Component';
import Login from '../login/Login';

@injectable()
export default class MainScene extends Component {
    protected login: Login;

    protected initialize(): void {
        this.initializeComponents();
    }

    protected async initializeComponents(): Promise<void> {
        this.login = (await Component.instantiateHighOrderComponent(LOGIN, LOGIN_DESIGN, LOGIN_STYLE, Login))!;
    }
}
