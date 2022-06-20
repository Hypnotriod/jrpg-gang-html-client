import { injectable, singleton } from 'tsyringe';
import { BUTTON_JOIN, ICONS_CONTAINER, INPUT_USER_NAME, LABEL_ERROR } from '../../constants/Components';
import { USER_NAME_REGEXP } from '../../constants/RegularExpressions';
import { RequestType, JoinRequestData } from '../../dto/requests';
import { Response, ResponseStatus } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Lobby from '../lobby/Lobby';
import Button from '../ui/button/Button';
import Icon from '../ui/icon/Icon';
import TextInput from '../ui/input/TextInput';
import Label from '../ui/label/Label';

@injectable()
@singleton()
export default class Login extends Component implements ServerCommunicatorHandler {
    @component(INPUT_USER_NAME, TextInput)
    private readonly userNameInput: TextInput;
    @component(LABEL_ERROR, Label)
    private readonly errorLabel: Label;
    @component(BUTTON_JOIN, Button)
    private readonly joinButton: Button;
    private readonly icons: Icon[] = [];
    private isJoining: boolean = false;

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly gameState: GameStateService,
        private readonly lobby: Lobby) {
        super();
    }

    /**
     * @deprecated test purpose only
     */
    public autologin(): void {
        // todo: autologin
        this.userNameInput.value = 'Tester' + ~~(Math.random() * 10000);
        this.onJoinClick();
    }

    protected initialize(): void {
        this.userNameInput.validationRegEx = USER_NAME_REGEXP;
        this.userNameInput.onInput = target => this.updateJoinButtonState();
        this.errorLabel.hide();

        this.joinButton.onClick = target => this.onJoinClick();
        this.joinButton.disable();

        this.icons.push(Icon.createIcon('tank', this, ICONS_CONTAINER)!);
        this.icons.push(Icon.createIcon('mage', this, ICONS_CONTAINER)!);
        this.icons.push(Icon.createIcon('rogue', this, ICONS_CONTAINER)!);
        this.icons.forEach(icon => {
            icon.onClick = target => this.onClassIconClick(target);
        });
        this.icons[0].select();

        this.communicator.subscribe([RequestType.JOIN], this);
    }

    protected onClassIconClick(target: Icon): void {
        this.icons.forEach(icon => icon.unselect());
        target.select();
        this.updateJoinButtonState();
    }

    protected updateJoinButtonState(): void {
        if (this.userNameInput.isValid && this.userNameInput.value !== '' && !this.isJoining) {
            this.joinButton.enable();
        } else {
            this.joinButton.disable();
        }
    }

    protected onJoinClick(): void {
        this.isJoining = true;
        this.updateJoinButtonState();
        let clazz: string = '';
        this.icons.forEach(icon => {
            if (!icon.selected) { return; }
            clazz = icon.icon;
        });
        this.communicator.sendMessage(RequestType.JOIN, {
            nickname: this.userNameInput.value,
            class: clazz,
        } as JoinRequestData);
    }

    public handleServerResponse(response: Response): void {
        this.isJoining = false;
        this.updateJoinButtonState();
        if (response.status !== ResponseStatus.OK) { return; }
        this.gameState.userState = response.data;
        this.hide();
        this.lobby.show();
    }
}
