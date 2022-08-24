import { injectable, singleton } from 'tsyringe';
import { GameEvent } from '../../domain/domain';
import { Response } from '../../dto/responces';
import { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';

@injectable()
@singleton()
export default class GameScene extends Component implements ServerCommunicatorHandler {

    protected initialize(): void {
        this.hide();
    }

    public handleServerResponse(response: Response): void {
    }

    public handleConnectionLost(): void {
        this.hide();
    }

    protected initBattleField(data: GameEvent): void {
        // iconItem = SpotCellIcon.createSpotCellIcon(data.code, this, BATTLEFIELD_CONTAINER)!;
    }
}
