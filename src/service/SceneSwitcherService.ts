import { injectable, singleton } from 'tsyringe';
import GameScene from '../component/gamescene/GameScene';
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
        private readonly gameScene: GameScene,
        private readonly lobby: Lobby) {
        this.communicator.subscribe([RequestType.JOIN, RequestType.USER_STATUS], this);
    }
    handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        const status: UserStatus = (response.data as UserStateData).status;
        if (response.type === RequestType.USER_STATUS &&
            status !== UserStatus.IN_GAME) { return; }

        this.login.hide();
        this.gameScene.hide();
        this.lobby.hide();
        this.configurator.hide();

        status === UserStatus.JOINED && this.configurator.show();
        (status === UserStatus.IN_LOBBY || status === UserStatus.IN_ROOM) && this.lobby.show();
        status === UserStatus.IN_GAME && this.gameScene.show();
    }
    handleConnectionLost(): void {
    }
}
