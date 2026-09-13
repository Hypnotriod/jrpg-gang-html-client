import { container, injectable } from 'tsyringe';
import { ACHIEVEMENTS } from '../../constants/AchievementInfo';
import { BUTTON_ENTER, ICON, LABEL_DESCRIPTION, LABEL_HEADER, LABEL_REQUIREMENTS } from '../../constants/Components';
import { DUNGEON_DESIGN } from '../../constants/Resources';
import { GameScenarioConfig, UnitQuestStatus, UnitRequirements } from '../../domain/domain';
import { CreateRoomRequestData, RequestType } from '../../dto/requests';
import GameObjectRenderer from '../../service/GameObjectRenderer';
import GameStateService from '../../service/GameStateService';
import ResourceLoaderService from '../../service/ResourceLoaderService';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Container from '../ui/container/Container';
import Icon from '../ui/icon/Icon';
import Label from '../ui/label/Label';

@injectable()
export default class Dungeon extends Component {
    @component(LABEL_HEADER, Label)
    protected readonly labelHeader: Label;
    @component(LABEL_DESCRIPTION, Label)
    protected readonly labelDescription: Label;
    @component(LABEL_REQUIREMENTS, Container)
    protected readonly labelRequirements: Container;
    @component(BUTTON_ENTER, Button)
    protected readonly buttonEnter: Button;
    protected config: GameScenarioConfig;

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly renderer: GameObjectRenderer,
        private readonly state: GameStateService) {
        super();
    }

    public static createDungeon(parent: Component, containerId: string): Dungeon | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        return parent.create(containerId, Dungeon, { design: resourceLoader.get(DUNGEON_DESIGN) });
    }

    public destroy(): void {
        this.buttonEnter.destroy();
        super.destroy();
    }

    protected initialize(): void {
        this.buttonEnter.onClick = target => this.onEnterClick();
    }

    protected onEnterClick(): void {
        this.communicator.sendMessage(RequestType.CREATE_ROOM, {
            scenarioId: this.config.id,
        } as CreateRoomRequestData);
    }

    public update(config: GameScenarioConfig): void {
        this.config = config;
        (this.findChild('icon_dungeon') as HTMLImageElement).src = `./assets/icons/${config.id}.png`;
        this.labelHeader.value = config.name;
        this.labelDescription.value = config.description!;
        this.labelRequirements.value = this.renderer.renderApplicationRequirements(this.patchRequirements(config.requirements), this.state.userState.unit);
        this.buttonEnter.show();
    }

    public set enabled(value: boolean) {
        this.buttonEnter.enabled = value;
    }

    private patchRequirements(requirements?: UnitRequirements): any {
        const r: any = { ...requirements };
        if (r.achievements) {
            Object.keys(r.achievements).forEach(k => {
                r[ACHIEVEMENTS[k]?.tag ?? k] = `${(this.state.userState.unit.achievements[k] ?? 0)} / ${r.achievements![k]}`;
            });
            r.achievements = undefined;
        }
        r.quests = undefined;
        return r;
    }
}
