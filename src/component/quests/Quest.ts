import { container, injectable } from 'tsyringe';
import { BUTTON_APPLY, BUTTON_COMPLETE_QUEST, ICON, LABEL_DESCRIPTION, LABEL_HEADER, LABEL_REQUIREMENTS, LABEL_REWARD } from '../../constants/Components';
import { QUEST_DESIGN } from '../../constants/Resources';
import { Action, ActionType, GameQuestStatus, UnitQuestStatus, UnitRequirements } from '../../domain/domain';
import { RequestType } from '../../dto/requests';
import GameObjectRenderer from '../../service/GameObjectRenderer';
import ResourceLoaderService from '../../service/ResourceLoaderService';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import { SoundName, SoundService } from '../../service/SoundService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Container from '../ui/container/Container';
import Icon from '../ui/icon/Icon';
import Label from '../ui/label/Label';
import GameStateService from '../../service/GameStateService';
import { ACHIEVEMENTS } from '../../constants/AchievementInfo';

@injectable()
export default class Quest extends Component {
    @component(ICON, Icon)
    protected readonly icon: Icon;
    @component(LABEL_HEADER, Label)
    protected readonly labelHeader: Label;
    @component(LABEL_DESCRIPTION, Label)
    protected readonly labelDescription: Label;
    @component(LABEL_REQUIREMENTS, Container)
    protected readonly labelRequirements: Container;
    @component(LABEL_REWARD, Container)
    protected readonly labelReward: Container;
    @component(BUTTON_APPLY, Button)
    protected readonly buttonApply: Button;
    @component(BUTTON_COMPLETE_QUEST, Button)
    private readonly buttonComplete: Button;
    protected status: GameQuestStatus;

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly renderer: GameObjectRenderer,
        private readonly state: GameStateService) {
        super();
    }

    public static createQuest(parent: Component, containerId: string): Quest | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        return parent.create(containerId, Quest, { design: resourceLoader.get(QUEST_DESIGN) });
    }

    public destroy(): void {
        this.buttonApply.destroy();
        super.destroy();
    }

    protected initialize(): void {
        this.buttonApply.onClick = target => this.startQuestClick();
        this.buttonComplete.onClick = target => this.completeQuestClick();
    }

    protected startQuestClick(): void {
        this.communicator.sendMessage(RequestType.QUEST_ACTION, {
            questCode: this.status.code,
            action: ActionType.ACTIVATE,
        } as Action);
    }

    protected completeQuestClick(): void {
        SoundService.play(SoundName.TREASURE);
        SoundService.play(SoundName.QUEST_COMPLETE);
        this.communicator.sendMessage(RequestType.QUEST_ACTION, {
            questCode: this.status.code,
            action: ActionType.COMPLETE,
        } as Action);
    }

    public update(status: GameQuestStatus): void {
        this.status = status;
        this.icon.icon = status.code;
        this.labelHeader.value = status.name;
        this.labelDescription.value = status.description!;
        this.labelReward.value = this.renderer.render(status.reward || {});
        if (status.status === UnitQuestStatus.INACTIVE) {
            this.buttonApply.show();
            this.buttonComplete.hide();
            this.labelRequirements.value = this.renderer.render(this.patchRequirenments(status.activation.requirements));
        } else if (status.status === UnitQuestStatus.ACTIVE) {
            this.buttonApply.hide();
            this.buttonComplete.show();
            this.labelRequirements.value = this.renderer.render(this.patchRequirenments(status.completion.requirements));
        } else {
            this.buttonApply.hide();
            this.buttonComplete.hide();
        }
    }

    public set canApply(value: boolean) {
        this.buttonApply.enabled = value;
    }

    public set canComplete(value: boolean) {
        this.buttonComplete.enabled = value;
    }

    private patchRequirenments(requirenments?: UnitRequirements): any {
        const r = { ...requirenments };
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
