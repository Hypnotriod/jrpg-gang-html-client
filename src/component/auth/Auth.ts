import { injectable, singleton } from 'tsyringe';
import Component from '../Component';
import AppConfig from '../../application/AppConfig';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import { BUTTON_AUTH } from '../../constants/Components';

@injectable()
@singleton()
export default class Auth extends Component {
    @component(BUTTON_AUTH, Button)
    private readonly authGoogleButton: Button;

    constructor(private readonly appConfig: AppConfig) {
        super();
    }

    protected initialize(): void {
        this.hide();
        this.authGoogleButton.onClick = target => this.onAuthGoogleClick();
    }

    protected onAuthGoogleClick(): void {
        window.location.href = this.appConfig.authUrl;
    }
}
