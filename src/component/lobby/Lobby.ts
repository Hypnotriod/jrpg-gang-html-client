import { injectable, singleton } from 'tsyringe';
import { Response } from '../../dto/responces';
import { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';

@injectable()
@singleton()
export default class Lobby extends Component implements ServerCommunicatorHandler {
    protected initialize(): void {
        this.hide();
    }

    handleServerResponse(response: Response): void {
    }
}
