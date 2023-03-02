import { delay, inject, injectable, singleton } from 'tsyringe';
import { BUTTON_UNIT } from '../../constants/Components';
import { RequestType } from '../../dto/requests';
import { Response } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';

@injectable()
@singleton()
export default class Jobs extends Component implements ServerCommunicatorHandler {
    @component(BUTTON_UNIT, Button)
    private readonly unitButton: Button;

    constructor(
        private readonly communicator: ServerCommunicatorService,
        @inject(delay(() => UnitConfigurator)) private readonly unitConfigurator: UnitConfigurator,
        private readonly state: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.hide();
        this.unitButton.onClick = target => this.goToUnitConfig();
        this.communicator.subscribe([RequestType.JOBS_STATUS, RequestType.APPLY_FOR_A_JOB, RequestType.COMPLETE_JOB, RequestType.QUIT_JOB], this);
    }

    protected goToUnitConfig(): void {
        this.hide();
        this.unitConfigurator.show();
    }

    public show(): void {
        super.show();
        this.communicator.sendMessage(RequestType.JOBS_STATUS);
    }

    handleServerResponse(response: Response): void {
        switch (response.type) {
            case RequestType.JOBS_STATUS:
                break;
        }
    }

    handleConnectionLost(): void {
    }
}
