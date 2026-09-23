import { injectable } from 'tsyringe';
import { ACHIEVEMENT_POPUP, AUTH_CONTAINER, GAME_CONTAINER, JOBS_CONTAINER, LOBBY_CONTAINER, LOGIN_CONTAINER, QUESTS_CONTAINER, UNIT_CONFIGURATOR_CONTAINER } from '../../constants/Components';
import { AUTH_DESIGN, AUTH_STYLE, DUNGEON_DESIGN, GAME_DESIGN, GAME_STYLE, ITEM_ICON_DESIGN, JOBS_DESIGN, JOBS_STYLE, JOB_DESIGN, LOBBY_DESIGN, LOBBY_STYLE, LOGIN_DESIGN, LOGIN_STYLE, MERCENARY_DESIGN, QUESTS_DESIGN, QUESTS_STYLE, QUEST_DESIGN, ROOM_DESIGN, SHOP_ITEM_ICON_DESIGN, SPOT_CELL_DESIGN, SPOT_CELL_QEUE_DESIGN as SPOT_CELL_QUEUE_DESIGN, UNIT_CONFIGURATOR_DESIGN, UNIT_CONFIGURATOR_STYLE } from '../../constants/Resources';
import ResourceLoaderService, { RESOURCE_DESIGN } from '../../service/ResourceLoaderService';
import SceneSwitcherService from '../../service/SceneSwitcherService';
import Component from '../Component';
import GameScene from '../gamescene/GameScene';
import Jobs from '../jobs/Jobs';
import Lobby from '../lobby/Lobby';
import Login from '../login/Login';
import Auth from '../auth/Auth';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import { RequestType } from '../../dto/requests';
import GameStateService from '../../service/GameStateService';
import { Response, ResponseStatus, ServerStatusData } from '../../dto/responces';
import { SoundName, SoundService } from '../../service/SoundService';
import Quests from '../quests/Quests';
import { component } from '../decorator/decorator';
import Checkbox from '../ui/checkbox/Checkbox';
import ObjectDescription from '../ui/popup/ObjectDescription';
import Button from '../ui/button/Button';
import { InstructionsPopup } from '../ui/popup/InstructionsPopup';
import Container from '../ui/container/Container';
import Label from '../ui/label/Label';
import { TipsPopup } from '../ui/popup/TipsPopup';
import { RESIZE_CONFIG } from '../../constants/Configuration';
import { AchievementPopup } from '../ui/popup/AchievementPopup';

const LEAVE_ON_OUT_OF_FOCUS_TIMEOUT_MS: number = 10 * 60 * 1000;

@injectable()
export default class MainScene extends Component implements ServerCommunicatorHandler {
    @component('checkbox_sound', Checkbox)
    private readonly checkboxSound: Checkbox;
    @component('checkbox_info', Checkbox)
    private readonly checkboxInfo: Checkbox;
    @component('checkbox_tips', Checkbox)
    private readonly checkboxTips: Checkbox;
    @component('button_fullscreen', Button)
    private readonly buttonFullscreen: Button;
    @component('rules_popup', InstructionsPopup)
    private readonly rulesPopup: InstructionsPopup;
    @component('tips_popup', TipsPopup)
    private readonly tipsPopup: TipsPopup;
    @component('button_rules', Button)
    private readonly buttonRules: Button;
    @component('label_user_number', Label)
    private readonly labelUserNumber: Label;
    @component('rules_popup_shadow', Container)
    private readonly rulesPopupShadow: Container;
    @component('tips_popup_shadow', Container)
    private readonly tipsPopupShadow: Container;
    @component('scale_container', Container)
    private readonly scaleContainer: Container;
    @component(ACHIEVEMENT_POPUP, AchievementPopup)
    private readonly achievementPopup: AchievementPopup;

    private login: Login;
    private auth: Auth;
    private lobby: Lobby;
    private configurator: UnitConfigurator;
    private gameScene: GameScene;
    private jobs: Jobs;
    private quests: Quests;
    private blurTimeout: number = 0;

    constructor(
        private readonly loaderService: ResourceLoaderService,
        private readonly sceneSwitcherService: SceneSwitcherService,
        private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.hide();
        SoundService.initialize();
        this.initializeComponents().then(() => {
            this.login.tryToAutologin();
            this.show();
        });
        this.initializeFocusHandler();
        this.checkboxSound.checked = localStorage.getItem('sound') !== 'false';
        this.checkboxInfo.checked = localStorage.getItem('info') !== 'false';
        this.checkboxTips.checked = localStorage.getItem('tips') !== 'false';
        this.tipsPopup.active = this.checkboxTips.checked;
        SoundService.muted = !this.checkboxSound.checked;
        ObjectDescription.active = this.checkboxInfo.checked;

        window.addEventListener('keydown', event => {
            if (event.key === 's') {
                this.toggleSoundMute();
                this.checkboxSound.checked = !SoundService.muted;
            }
            if (event.key === 'i') {
                this.toggleInfoPopup();
                this.checkboxInfo.checked = ObjectDescription.active;
            }
        });

        this.labelUserNumber.value = '';

        this.tipsPopup.shadow = this.tipsPopupShadow;
        this.rulesPopup.shadow = this.rulesPopupShadow;
        this.checkboxSound.onChange = target => this.toggleSoundMute();
        this.checkboxInfo.onChange = target => this.toggleInfoPopup();
        this.checkboxTips.onChange = target => this.toggleTipsPopup();
        this.buttonFullscreen.onClick = target => this.toggleFullscreen();
        this.buttonRules.onClick = target => this.rulesPopup.show();

        this.communicator.subscribe([RequestType.SERVER_STATUS], this);
        this.communicator.sendMessage(RequestType.SERVER_STATUS);

        this.scaleContainer.resizeConfig = RESIZE_CONFIG;
    }

    protected toggleSoundMute(): void {
        SoundService.play(SoundName.CLICK);
        SoundService.muted = !SoundService.muted;
        localStorage.setItem('sound', String(!SoundService.muted));
    }

    protected toggleInfoPopup(): void {
        SoundService.play(SoundName.CLICK);
        ObjectDescription.active = !ObjectDescription.active;
        localStorage.setItem('info', String(ObjectDescription.active));
    }

    protected toggleTipsPopup(): void {
        SoundService.play(SoundName.CLICK);
        this.tipsPopup.active = !this.tipsPopup.active;
        localStorage.setItem('tips', String(this.tipsPopup.active));
    }

    protected toggleFullscreen(): void {
        !document.fullscreenElement ?
            document.documentElement?.requestFullscreen?.() :
            document.exitFullscreen?.();
    }

    protected onServerStatus(data: ServerStatusData): void {
        this.state.usersNumber = data.usersNumber;
        this.labelUserNumber.value = `Players online ${this.state.usersNumber}`;
    }

    public handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        switch (response.type) {
            case RequestType.SERVER_STATUS:
                this.onServerStatus(response.data as ServerStatusData);
                break;
        }
    }

    handleConnectionLost(): void { }

    protected async preloadResources(): Promise<void> {
        await this.loaderService.load(ROOM_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(DUNGEON_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(MERCENARY_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(ITEM_ICON_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(SHOP_ITEM_ICON_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(SPOT_CELL_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(SPOT_CELL_QUEUE_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(JOB_DESIGN, RESOURCE_DESIGN);
        await this.loaderService.load(QUEST_DESIGN, RESOURCE_DESIGN);
    }

    protected async initializeComponents(): Promise<void> {
        await this.preloadResources();
        this.login = (await Component.instantiateHighOrderComponent(LOGIN_CONTAINER, LOGIN_DESIGN, LOGIN_STYLE, Login))!;
        this.auth = (await Component.instantiateHighOrderComponent(AUTH_CONTAINER, AUTH_DESIGN, AUTH_STYLE, Auth))!;
        this.lobby = (await Component.instantiateHighOrderComponent(LOBBY_CONTAINER, LOBBY_DESIGN, LOBBY_STYLE, Lobby))!;
        this.configurator = (await Component.instantiateHighOrderComponent(UNIT_CONFIGURATOR_CONTAINER, UNIT_CONFIGURATOR_DESIGN, UNIT_CONFIGURATOR_STYLE, UnitConfigurator))!;
        this.gameScene = (await Component.instantiateHighOrderComponent(GAME_CONTAINER, GAME_DESIGN, GAME_STYLE, GameScene))!;
        this.jobs = (await Component.instantiateHighOrderComponent(JOBS_CONTAINER, JOBS_DESIGN, JOBS_STYLE, Jobs))!;
        this.quests = (await Component.instantiateHighOrderComponent(QUESTS_CONTAINER, QUESTS_DESIGN, QUESTS_STYLE, Quests))!;
    }

    protected initializeFocusHandler() {
        window.addEventListener('blur', (event) => {
            this.blurTimeout = window.window.setTimeout(() => {
                if (!this.state.userState?.sessionId) return;
                this.communicator.sendMessage(RequestType.LEAVE);
                this.blurTimeout = -1;
                window.location.reload();
            }, LEAVE_ON_OUT_OF_FOCUS_TIMEOUT_MS);
        });
        window.addEventListener('focus', (event) => {
            this.blurTimeout === -1 && window.location.reload();
            this.blurTimeout && window.clearTimeout(this.blurTimeout);
            this.blurTimeout = 0;
        });
    }
}
