import { injectable, singleton } from 'tsyringe';
import { BUTTON_JOIN, ICONS_CONTAINER, INPUT_USER_NAME, LABEL_ERROR } from '../../constants/Components';
import { USER_NAME_REGEXP } from '../../constants/RegularExpressions';
import { JoinRequestData, RequestType } from '../../dto/requests';
import { Response, ResponseStatus, UserStateData, UserStatus } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
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
        private readonly state: GameStateService) {
        super();
    }

    public autologin(userName: string, clazz: string): void {
        this.userNameInput.value = userName;
        this.icons.forEach(icon => {
            icon.icon === clazz ? icon.select() : icon.unselect();
        });
        this.doJoin(userName, clazz);
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
        this.doJoin(this.userNameInput.value, clazz);
    }

    protected doJoin(nickname: string, clazz: string): void {
        const userId: string = localStorage.getItem(nickname) || '';
        localStorage.removeItem(nickname);
        this.communicator.sendMessage(RequestType.JOIN, {
            nickname,
            userId,
            class: clazz,
        } as JoinRequestData);
    }

    public handleServerResponse(response: Response): void {
        this.isJoining = false;
        this.updateJoinButtonState();
        if (response.status !== ResponseStatus.OK) { return; }
        this.state.userState = response.data as UserStateData;
        localStorage.setItem(this.state.userState.playerInfo.nickname, this.state.userState.userId);
        this.communicator.unsubscribe(this);
        if (this.state.userState.status === UserStatus.IN_GAME) {
            this.communicator.sendMessage(RequestType.GAME_STATE);
        }
    }

    public handleConnectionLost(): void {
        this.show();
    }
}
