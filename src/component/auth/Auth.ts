import { injectable, singleton } from 'tsyringe';
import Component from '../Component';
import AppConfig from '../../application/AppConfig';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import { BUTTON_AUTH, BUTTON_AUTH_GUEST } from '../../constants/Components';
import { SoundName, SoundService } from '../../service/SoundService';

@injectable()
@singleton()
export default class Auth extends Component {
    @component(BUTTON_AUTH, Button)
    private readonly authGoogleButton: Button;
    @component(BUTTON_AUTH_GUEST, Button)
    private readonly authGuestButton: Button;

    constructor(private readonly appConfig: AppConfig) {
        super();
    }


    public override show(): void {
        SoundService.stop(SoundName.DRONE_MAIN, { fade: 0.2 });
        SoundService.stop(SoundName.DRONE_CAVE, { fade: 0.2 });
        this.setButtonState(true);
        super.show();
    }

    protected initialize(): void {
        this.hide();
        this.authGoogleButton.onClick = target => this.onAuthGoogleClick();
        this.authGuestButton.onClick = target => this.onAuthGuestClick();
    }

    protected onAuthGoogleClick(): void {
        this.setButtonState(false);
        window.location.href = this.appConfig.authUrl;
    }

    protected onAuthGuestClick(): void {
        this.setButtonState(false);
        window.location.href = this.appConfig.authGuestUrl;
    }

    protected setButtonState(enabled: boolean): void {
        enabled ? this.authGoogleButton.enable() : this.authGoogleButton.disable();
        enabled ? this.authGuestButton.enable() : this.authGuestButton.disable();
    }
}
