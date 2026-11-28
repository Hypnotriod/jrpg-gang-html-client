import { injectable, singleton } from 'tsyringe';
import AppConfig from '../../application/AppConfig';
import { BUTTON_JOIN, ICONS_CONTAINER, INPUT_LABEL_USER_NAME, INPUT_USER_NAME, ITEM_DESCRIPTION_POPUP, LABEL_ERROR } from '../../constants/Components';
import { BASE_UNIT_DESCRIPTIONS, USER_CLASSES, USER_CLASSES_SKINS } from '../../constants/Configuration';
import { USER_NAME_MAX_LENGTH, USER_NAME_REGEXP } from '../../constants/RegularExpressions';
import { RequestType, SetPlayerInfoRequestData } from '../../dto/requests';
import { KEY_IS_NEW_PLAYER, KEY_IS_GUEST, KEY_SESSION_ID, KEY_TOKEN, Response, ResponseStatus, UserStateData, UserStatus, VALUE_FALSE, VALUE_TRUE } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import QueryService from '../../service/QueryService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import TextInput from '../ui/input/TextInput';
import Label from '../ui/label/Label';
import Auth from '../auth/Auth';
import ItemIcon from '../ui/icon/ItemIcon';
import { InventoryItem } from '../../domain/domain';
import ObjectDescription from '../ui/popup/ObjectDescription';
import { SoundName, SoundService } from '../../service/SoundService';
import QuestLog from '../quests/QuestLog';
import { CustomizationPopup } from '../ui/popup/CustomizationPopup';

@injectable()
@singleton()
export default class Login extends Component implements ServerCommunicatorHandler {
    private MAX_UNSUCCESS_JOIN_ATTEMPTS: number = 5;

    @component(INPUT_USER_NAME)
    private readonly userNameInput: TextInput;
    @component(INPUT_LABEL_USER_NAME)
    private readonly userNameInputLabel: Label;
    @component(LABEL_ERROR)
    private readonly errorLabel: Label;
    @component(BUTTON_JOIN)
    private readonly joinButton: Button;
    @component(ITEM_DESCRIPTION_POPUP)
    private readonly objectDescription: ObjectDescription;
    private readonly icons: ItemIcon[] = [];
    private isJoining: boolean = false;
    private unsuccessJoinAttempts: number = 0;
    private token?: string;
    private isNewPlayer?: string;

    constructor(
        private readonly questLog: QuestLog,
        private readonly appConfig: AppConfig,
        private readonly communicator: ServerCommunicatorService,
        private readonly query: QueryService,
        private readonly state: GameStateService,
        private readonly customization: CustomizationPopup,
        private readonly auth: Auth) {
        super();
    }

    protected initialize(): void {
        this.hide();
        const isGuest = Boolean(this.query.parsedQuery[KEY_IS_GUEST]);
        this.userNameInput.validationRegEx = USER_NAME_REGEXP;
        this.userNameInput.maxLength = USER_NAME_MAX_LENGTH;
        if (isGuest) {
            this.userNameInput.value = "Guest";
            this.userNameInput.disable();
            this.userNameInputLabel.disable();
            this.userNameInput.hide();
            this.userNameInputLabel.hide();
        } else {
            this.userNameInput.onInput = target => this.onUserNameInput();
        }
        this.errorLabel.hide();

        this.joinButton.onClick = target => this.onJoinClick();
        this.joinButton.disable();

        this.objectDescription.hide();
        USER_CLASSES.forEach((clazz) => {
            const icon = ItemIcon.createBigItemIcon(clazz, this, ICONS_CONTAINER)!;
            icon.onClick = target => this.onClassIconClick(target, clazz);
            icon.update(BASE_UNIT_DESCRIPTIONS[clazz] as InventoryItem, this.state);
            icon.descriptionPopup = this.objectDescription;
            this.icons.push(icon);
        });

        this.communicator.subscribe([RequestType.JOIN], this);
        this.onUserNameInput();
    }

    protected onClassIconClick(target: ItemIcon, clazz: string): void {
        this.icons.forEach(icon => icon.unselect());
        this.icons.forEach(icon => icon.unchoose());
        target.select();
        target.choose();
        this.onUserNameInput();
        SoundService.play(SoundName.CLICK);
        this.customization.update(USER_CLASSES_SKINS[this.getClass()], target.icon);
        this.customization.show();
        this.customization.onSelect = skin => {
            target.update({ ...BASE_UNIT_DESCRIPTIONS[clazz], customization: { skin } }, this.state);
            target.icon = skin;
            target.select();
            target.choose();
        }
    }

    protected onUserNameInput(): void {
        if (this.userNameInput.isValid &&
            this.userNameInput.value !== '' &&
            !this.isJoining &&
            this.icons.some(icon => icon.selected)) {
            this.joinButton.enable();
        } else {
            this.joinButton.disable();
        }
        if (!this.userNameInput.isValid) {
            this.errorLabel.show();
            this.errorLabel.value = 'Latin letters, numbers, dashes, underscores, 4 characters min.'
        } else {
            this.errorLabel.hide();
        }
    }

    public tryToAutoLogin(force: boolean = false): void {
        if (this.unsuccessJoinAttempts >= this.MAX_UNSUCCESS_JOIN_ATTEMPTS) {
            this.fail();
            return;
        }
        this.token = this.query.parsedQuery[KEY_TOKEN] as string | undefined;
        this.isNewPlayer = this.query.parsedQuery[KEY_IS_NEW_PLAYER] as string || undefined;
        this.clearUrl();
        if (!force && this.isNewPlayer === VALUE_TRUE) {
            this.show();
            return;
        }
        this.doJoin();
    }

    protected onJoinClick(): void {
        this.isJoining = true;
        this.errorLabel.hide();
        this.onUserNameInput();
        this.updatePlayerInfoAndJoin();
    }

    protected async updatePlayerInfoAndJoin(): Promise<void> {
        const nickname: string = this.getNickname();
        const clazz: string = this.getClass();
        const skin = this.getSkin();
        const response = await this.communicator.sendConfigurationMessage(RequestType.SET_PLAYER_INFO, {
            token: this.token,
            nickname,
            skin,
            class: clazz,
        } as SetPlayerInfoRequestData);
        if (response.status === ResponseStatus.ALREADY_EXISTS || response.status === ResponseStatus.NOT_ALLOWED) {
            this.errorLabel.show();
            this.errorLabel.value = response.status === ResponseStatus.NOT_ALLOWED ?
                'This nickname is reserved' : 'A user with this nickname already exists';
            this.isJoining = false;
            return;
        }
        if (response.status === ResponseStatus.OK) {
            this.doJoin();
        } else {
            this.fail();
        }
    }

    protected doJoin(): void {
        const sessionId: string | undefined = sessionStorage.getItem(KEY_SESSION_ID) || undefined;
        sessionStorage.removeItem(KEY_SESSION_ID);
        if (this.token) {
            this.communicator.joinWithToken(this.token);
            this.token = undefined;
            return;
        }
        if (sessionId) {
            this.communicator.joinWithSessionId(sessionId);
            return;
        }
        this.hide();
        this.auth.show();
    }

    public handleServerResponse(response: Response): void {
        this.isJoining = false;
        this.onUserNameInput();
        if (response.status !== ResponseStatus.OK) {
            sessionStorage.clear();
            this.unsuccessJoinAttempts++;
            if (this.query.parsedQuery[KEY_IS_NEW_PLAYER] === VALUE_FALSE) {
                this.hide();
                this.auth.show();
            } else {
                this.tryToAutoLogin(true);
            }
            return;
        }
        this.unsuccessJoinAttempts = 0;
        this.state.userState = response.data as UserStateData;
        sessionStorage.setItem(KEY_SESSION_ID, this.state.userState.sessionId);
        this.clearUrl();
        this.questLog.show();
    }

    public handleConnectionLost(): void {
        setTimeout(() => this.tryToAutoLogin(true), 100);
    }

    protected getClass(): string {
        let clazz: string = '';
        this.icons.forEach((icon, n) => {
            if (!icon.selected) { return; }
            clazz = USER_CLASSES[n];
        });
        return clazz;
    }

    protected getSkin(): string {
        return this.icons.find(icon => icon.selected)?.icon ?? '';
    }

    protected getNickname(): string {
        return this.userNameInput.value;
    }

    protected clearUrl(): void {
        window.history.replaceState({}, document.title, location.protocol + '//' + location.host + location.pathname);
    }

    protected fail(): void {
        this.clearUrl();
        this.hide();
        this.auth.show();
        this.unsuccessJoinAttempts = 0;
        alert('Oops, something went wrong...');
    }
}
