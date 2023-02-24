import { injectable, singleton } from 'tsyringe';
import AppConfig from '../../application/AppConfig';
import { BUTTON_JOIN, ICONS_CONTAINER, INPUT_USER_NAME, LABEL_ERROR } from '../../constants/Components';
import { USER_NAME_REGEXP } from '../../constants/RegularExpressions';
import { JoinRequestData, RequestType } from '../../dto/requests';
import { Response, ResponseStatus, UserStateData, UserStatus } from '../../dto/responces';
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

        this.icons.push(Icon.createIcon('tank', this, ICONS_CONTAINER)!);
        this.icons.push(Icon.createIcon('barbarian', this, ICONS_CONTAINER)!);
        this.icons.push(Icon.createIcon('mage', this, ICONS_CONTAINER)!);
        this.icons.push(Icon.createIcon('rogue', this, ICONS_CONTAINER)!);
        this.icons.push(Icon.createIcon('spearsman', this, ICONS_CONTAINER)!);
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
        const isNewPlayer: string | undefined = this.query.parsedQuery['isNewPlayer'] as string || undefined;
        if (isNewPlayer === 'true') {
            this.show();
            return;
        }
        this.doJoin();
    }

    protected onJoinClick(): void {
        this.isJoining = true;
        this.updateJoinButtonState();
        this.doJoin();
    }

    protected doJoin(): void {
        const playerId: string | undefined = localStorage.getItem('playerId') || undefined;
        localStorage.removeItem('playerId');
        if (playerId) {
            this.communicator.sendMessage(RequestType.JOIN, {
                playerId,
            } as JoinRequestData);
            return;
        }
        const token: string | undefined = this.query.parsedQuery['token'] as string || undefined;
        const isNewPlayer: string | undefined = this.query.parsedQuery['isNewPlayer'] as string || undefined;
        if (token && isNewPlayer === 'true') {
            const nickname: string = this.getNickname();
            const clazz: string = this.getClass();
            this.communicator.sendMessage(RequestType.JOIN, {
                token,
                nickname,
                class: clazz,
            } as JoinRequestData);
            return;
        }
        if (token && isNewPlayer === 'false') {
            this.communicator.sendMessage(RequestType.JOIN, {
                token,
            } as JoinRequestData);
            return;
        }
        window.location.href = this.appConfig.gameServerAuthUrl;
    }

    public handleServerResponse(response: Response): void {
        this.isJoining = false;
        this.updateJoinButtonState();
        if (response.status !== ResponseStatus.OK) {
            localStorage.clear();
            this.unsuccessJoinAttempts++;
            this.tryToAutologin();
            return;
        }
        this.unsuccessJoinAttempts = 0;
        this.state.userState = response.data as UserStateData;
        localStorage.setItem('playerId', this.state.userState.playerId);
        window.history.replaceState({}, document.title, window.location.origin);
        if (this.state.userState.status === UserStatus.IN_GAME) {
            this.communicator.sendMessage(RequestType.GAME_STATE);
        }
    }

    public handleConnectionLost(): void {
        this.show();
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
