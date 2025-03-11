import { container, injectable } from 'tsyringe';
import { BUTTON_APPLY, BUTTON_COMPLETE_JOB, BUTTON_QUIT_JOB, ICON, LABEL_DESCRIPTION, LABEL_HEADER, LABEL_REQUIREMENTS, LABEL_REWARD, LABEL_TIME } from '../../constants/Components';
import { JOB_DESIGN } from '../../constants/Resources';
import { EmploymentStatus, PlayerJob } from '../../domain/domain';
import { ApplyForAJobRequestData, RequestType } from '../../dto/requests';
import GameObjectRenderer from '../../service/GameObjectRenderer';
import ResourceLoaderService from '../../service/ResourceLoaderService';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Container from '../ui/container/Container';
import Icon from '../ui/icon/Icon';
import Label from '../ui/label/Label';

@injectable()
export default class Job extends Component {
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
    @component(LABEL_TIME, Label)
    protected readonly labelTime: Label;
    @component(BUTTON_APPLY, Button)
    protected readonly buttonApply: Button;
    protected config: PlayerJob;
    @component(BUTTON_COMPLETE_JOB, Button)
    private readonly buttonComplete: Button;
    @component(BUTTON_QUIT_JOB, Button)
    private readonly buttonQuit: Button;
    private countdownId: NodeJS.Timeout;

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly renderer: GameObjectRenderer) {
        super();
    }

    public static createJob(parent: Component, containerId: string): Job | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        return parent.create(containerId, Job, { design: resourceLoader.get(JOB_DESIGN) });
    }

    public destroy(): void {
        this.buttonApply.destroy();
        super.destroy();
    }

    protected initialize(): void {
        this.buttonApply.onClick = target => this.applyForAJobClick();
        this.buttonComplete.onClick = target => this.completeJobClick();
        this.buttonQuit.onClick = target => this.quitJobClick();
    }

    protected applyForAJobClick(): void {
        this.communicator.sendMessage(RequestType.APPLY_FOR_A_JOB, {
            code: this.config.code,
        } as ApplyForAJobRequestData);
        this.communicator.sendMessage(RequestType.JOBS_STATUS);
    }

    protected completeJobClick(): void {
        this.communicator.sendMessage(RequestType.COMPLETE_JOB);
        this.communicator.sendMessage(RequestType.JOBS_STATUS);
    }

    protected quitJobClick(): void {
        this.communicator.sendMessage(RequestType.QUIT_JOB);
        this.communicator.sendMessage(RequestType.JOBS_STATUS);
    }

    public update(config: PlayerJob, employment: EmploymentStatus): void {
        this.config = config;
        this.icon.icon = config.code;
        this.labelHeader.value = config.name;
        this.labelDescription.value = config.description!;
        this.labelReward.value = this.renderer.render(config.reward || {});
        this.labelRequirements.value = this.renderer.render(config.requirements || {});
        if (employment.currentJob?.code === config.code) {
            if (employment.isInProgress) {
                this.startTimeLeftCountdown(Math.ceil(employment.timeLeft!));
            }
            this.buttonApply.hide();
            this.buttonComplete.show();
            this.buttonQuit.show();
        } else {
            this.labelTime.value = new Date(config.duration * 1000).toISOString().slice(14, 19);
            this.buttonApply.show();
            this.buttonComplete.hide();
            this.buttonQuit.hide();
        }
        this.buttonApply.enabled = !employment.isInProgress && !employment.isComplete;
        this.buttonQuit.enabled = !!employment.isInProgress;
        this.buttonComplete.enabled = !!employment.isComplete;
    }

    protected startTimeLeftCountdown(timeLeft: number): void {
        clearInterval(this.countdownId);
        this.updateTimeLeft(timeLeft);
        this.countdownId = setInterval(() => {
            timeLeft--;
            this.updateTimeLeft(timeLeft);
            if (timeLeft === 0) {
                clearInterval(this.countdownId);
                this.communicator.sendMessage(RequestType.JOBS_STATUS);
            }
        }, 1000);
    }

    protected updateTimeLeft(timeLeft: number): void {
        this.labelTime.value = new Date(timeLeft * 1000).toISOString().slice(14, 19);
    }

    public set enabled(value: boolean) {
        this.buttonApply.enabled = value;
    }
}
