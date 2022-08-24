import { injectable, singleton } from 'tsyringe';
import { Response } from '../../dto/responces';
import { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';

@injectable()
@singleton()
export default class Game extends Component implements ServerCommunicatorHandler {
    protected initialize(): void {
        this.hide();
    }
    public handleServerResponse(response: Response): void {
    }
    public handleConnectionLost(): void {
        this.hide();
    }
}
