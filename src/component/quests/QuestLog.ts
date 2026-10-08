import { injectable, singleton } from 'tsyringe';
import { ACHIEVEMENTS } from '../../constants/AchievementInfo';
import { GameQuestStatus, GameUnit, UnitQuestStatus, UnitRequirements } from '../../domain/domain';
import GameObjectRenderer from '../../service/GameObjectRenderer';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { RequestType } from '../../dto/requests';
import { QuestsStatusData, Response, ResponseStatus } from '../../dto/responces';
import Container from '../ui/container/Container';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';

@singleton()
@injectable()
export default class QuestLog extends Component implements ServerCommunicatorHandler {
    private questsStatus?: QuestsStatusData;
    private unit?: GameUnit;

    @component('quests_status_label', Container)
    private readonly questsStatusLabel: Container;
    @component('quests_log_icon', Button)
    private readonly questsLogIcon: Button;

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly renderer: GameObjectRenderer,
        private readonly state: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.communicator.subscribe([
            RequestType.QUESTS_STATUS,
        ], this);
        this.questsLogIcon.onClick = target => this.onquestLogiconClick();
        this.questsStatusLabel.hide();
    }

    protected async onquestLogiconClick(): Promise<void> {
        if (!this.questsStatusLabel.visible) {
            if (!this.questsStatus) {
                this.communicator.sendMessage(RequestType.QUESTS_STATUS);
                await this.communicator.until(RequestType.QUESTS_STATUS);
            }
            this.questsStatusLabel.show();
        } else {
            this.questsStatusLabel.hide();
        }
    }

    handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) {
            return;
        }
        switch (response.type) {
            case RequestType.QUESTS_STATUS:
                this.update(response.data as QuestsStatusData);
                break;
        }
    }

    public updateWithGameUnit(unit?: GameUnit): void {
        this.unit = unit;
        if (this.questsStatus) {
            this.update(this.questsStatus);
        }
    }

    protected update(questsStatus: QuestsStatusData): void {
        this.questsStatus = questsStatus;
        const activeQuests = this.questsStatus.quests.quests.filter(quest => quest.status == UnitQuestStatus.ACTIVE);
        this.questsStatusLabel.value = !activeQuests.length ?
            '<span class="grey-text text-lighten-1">No active quests</span>' :
            activeQuests.map(quest => this.renderQuestStatus(quest)).join('');
    }

    protected renderQuestStatus(quest: GameQuestStatus): string {
        return `<span class="white-text"><img src="./assets/icons/warning.png" style="height: 16px;vertical-align: middle; padding-bottom: 2px;"/> ${quest.name}</span><br>` +
            this.renderRequirements(quest.completion.requirements);
    }

    private renderRequirements(requirements?: UnitRequirements): string {
        const r: any = { ...requirements };
        const achievements = this.unit?.achievements ?? this.state.userState.unit.achievements;
        if (r.achievements) {
            return Object.keys(r.achievements).map(k => {
                const key = this.renderer.capitalize(ACHIEVEMENTS[k]?.tag ?? k);
                const a = achievements[k] ?? 0;
                const t = r.achievements![k];
                return a === t ?
                    `<span class="orange-text text-lighten-1">${key}</span>: <span class="green-text">${a} / ${t}</span><br>` :
                    `<span class="orange-text text-lighten-1">${key}</span>: ${a} / ${t}<br>`;
            }).join();
        }
        return '';
    }

    handleConnectionLost(): void {
    }
}
