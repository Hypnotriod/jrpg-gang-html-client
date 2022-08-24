import { injectable, singleton } from 'tsyringe';
import Game from '../component/gamescene/Game';
import Lobby from '../component/lobby/Lobby';
import Login from '../component/login/Login';
import UnitConfigurator from '../component/unitconfigurator/UnitConfigurator';
import { RequestType } from '../dto/requests';
import { Response, ResponseStatus, UserStateData, UserStatus } from '../dto/responces';
import ServerCommunicatorService, { ServerCommunicatorHandler } from './ServerCommunicatorService';

@singleton()
@injectable()
export default class SceneSwitcherService implements ServerCommunicatorHandler {
    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly configurator: UnitConfigurator,
        private readonly login: Login,
        private readonly game: Game,
        private readonly lobby: Lobby) {
        this.communicator.subscribe([RequestType.JOIN, RequestType.USER_STATUS], this);
    }
    handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        const status: UserStatus = (response.data as UserStateData).status;
        if (response.type === RequestType.USER_STATUS &&
            status !== UserStatus.IN_GAME) { return; }

        this.login.hide();
        this.game.hide();
        this.lobby.hide();
        this.configurator.hide();

        status === UserStatus.IN_LOBBY && this.configurator.show();
        status === UserStatus.IN_ROOM && this.lobby.show();
        status === UserStatus.IN_GAME && this.game.show();
    }
    handleConnectionLost(): void {
        throw new Error('Method not implemented.');
    }
}
