import { delay, inject, injectable, singleton } from 'tsyringe';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { QuestsStatusData, Response } from '../../dto/responces';
import { component } from '../decorator/decorator';
import { BUTTON_CONFIGURATOR, QUESTS_LIST_CONTAINER } from '../../constants/Components';
import Button from '../ui/button/Button';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';
import { RequestType } from '../../dto/requests';
import Quest from './Quest';
import { GameQuestStatus, UnitQuestStatus } from '../../domain/domain';
import GameStateService from '../../service/GameStateService';

@injectable()
@singleton()
export default class Quests extends Component implements ServerCommunicatorHandler {
    @component(BUTTON_CONFIGURATOR, Button)
    private readonly configuratorButton: Button;
    private quests: Quest[] = [];

    constructor(
        private readonly communicator: ServerCommunicatorService,
        @inject(delay(() => UnitConfigurator)) private readonly unitConfigurator: UnitConfigurator,
        private readonly state: GameStateService
    ) {
        super();
    }

    protected initialize(): void {
        this.configuratorButton.onClick = target => this.goToUnitConfig();
        this.communicator.subscribe([RequestType.QUESTS_STATUS], this);
    }


    public show(): void {
        super.show();
        this.communicator.sendMessage(RequestType.QUESTS_STATUS);
    }

    protected goToUnitConfig(): void {
        this.hide();
        this.unitConfigurator.show();
    }

    handleServerResponse(response: Response): void {
        switch (response.type) {
            case RequestType.QUESTS_STATUS:
                this.update(response.data as QuestsStatusData);
                break;
        }
    }

    protected update(questsStatus: QuestsStatusData): void {
        this.quests.forEach(quest => quest.destroy());
        this.quests = [];
        this.quests = this.quests.concat(
            questsStatus.quests.quests
                .filter(quest => quest.status !== UnitQuestStatus.COMPLETED)
                .map(quest => this.createQuest(quest))
        );
    }

    protected createQuest(status: GameQuestStatus): Quest {
        const quest: Quest = Quest.createQuest(this, QUESTS_LIST_CONTAINER)!;
        quest.update(status);
        quest.canApply = this.state.checkRequirements(status.activation.requirements);
        quest.canComplete = this.state.checkRequirements(status.completion.requirements);
        return quest;
    }

    handleConnectionLost(): void {
        this.hide();
    }

}