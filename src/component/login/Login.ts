import { injectable, singleton } from 'tsyringe';
import AppConfig from '../../application/AppConfig';
import { BUTTON_JOIN, ICONS_CONTAINER, INPUT_USER_NAME, LABEL_ERROR } from '../../constants/Components';
import { USER_CLASSES } from '../../constants/Configuration';
import { USER_NAME_REGEXP } from '../../constants/RegularExpressions';
import { RequestType, SetPlayerInfoRequestData } from '../../dto/requests';
import { KEY_IS_NEW_PLAYER, KEY_SESSION_ID, KEY_TOKEN, Response, ResponseStatus, UserStateData, UserStatus, VALUE_FALSE, VALUE_TRUE } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import QueryService from '../../service/QueryService';
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
    private unsuccessJoinAttempts: number = 0;

    constructor(
        private readonly appConfig: AppConfig,
        private readonly communicator: ServerCommunicatorService,
        private readonly query: QueryService,
        private readonly state: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.userNameInput.validationRegEx = USER_NAME_REGEXP;
        this.userNameInput.onInput = target => this.updateJoinButtonState();
        this.errorLabel.hide();

        this.joinButton.onClick = target => this.onJoinClick();
        this.joinButton.disable();

        USER_CLASSES.forEach(clazz =>
            this.icons.push(Icon.createIcon(clazz, this, ICONS_CONTAINER)!));
        this.icons.forEach(icon => {
            icon.onClick = target => this.onClassIconClick(target);
        });
        this.icons[0].select();
        this.hide();

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

    public tryToAutologin(): void {
        if (this.unsuccessJoinAttempts >= 5) { return; }
        const isNewPlayer: string | undefined = this.query.parsedQuery[KEY_IS_NEW_PLAYER] as string || undefined;
        if (isNewPlayer === VALUE_TRUE) {
            this.show();
            return;
        }
        this.doJoin();
    }

    protected onJoinClick(): void {
        this.isJoining = true;
        this.errorLabel.hide();
        this.updateJoinButtonState();
        this.updatePlayerInfoAndJoin();
    }

    protected async updatePlayerInfoAndJoin(): Promise<void> {
        const token: string | undefined = this.query.parsedQuery[KEY_TOKEN] as string || undefined;
        const nickname: string = this.getNickname();
        const clazz: string = this.getClass();
        const response = await this.communicator.sendConfigurationMessage(RequestType.SET_PLAYER_INFO, {
            token,
            nickname,
            class: clazz,
        } as SetPlayerInfoRequestData);
        if (response.status === ResponseStatus.ALREADY_EXISTS) {
            this.errorLabel.show();
            this.errorLabel.value = 'A user with this nickname already exists';
            this.isJoining = false;
            this.updateJoinButtonState();
            return;
        }
        if (response.status === ResponseStatus.OK) {
            this.doJoin();
        }
    }

    protected doJoin(): void {
        const sessionId: string | undefined = localStorage.getItem(KEY_SESSION_ID) || undefined;
        const token: string | undefined = this.query.parsedQuery[KEY_TOKEN] as string || undefined;
        localStorage.removeItem(KEY_SESSION_ID);
        if (token) {
            this.communicator.joinWithToken(token);
            return;
        }
        if (sessionId) {
            this.communicator.joinWithSessionId(sessionId);
            return;
        }
        window.location.href = this.appConfig.authUrl;
    }

    public handleServerResponse(response: Response): void {
        this.isJoining = false;
        this.updateJoinButtonState();
        if (response.status !== ResponseStatus.OK) {
            localStorage.clear();
            this.unsuccessJoinAttempts++;
            if (this.query.parsedQuery[KEY_IS_NEW_PLAYER] === VALUE_FALSE) {
                window.location.href = this.appConfig.authUrl;
            } else {
                this.tryToAutologin();
            }
            return;
        }
        this.unsuccessJoinAttempts = 0;
        this.state.userState = response.data as UserStateData;
        localStorage.setItem(KEY_SESSION_ID, this.state.userState.sessionId);
        window.history.replaceState({}, document.title, location.protocol + '//' + location.host + location.pathname);
        if (this.state.userState.status === UserStatus.IN_GAME) {
            this.communicator.sendMessage(RequestType.GAME_STATE);
        }
    }

    public handleConnectionLost(): void {
        setTimeout(() => this.tryToAutologin(), 500);
    }

    protected getClass(): string {
        let clazz: string = '';
        this.icons.forEach(icon => {
            if (!icon.selected) { return; }
            clazz = icon.icon;
        });
        return clazz;
    }

    protected getNickname(): string {
        return this.userNameInput.value;
    }
}
