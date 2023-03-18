import { injectable, singleton } from 'tsyringe';
import { BATTLEFIELD_CONTAINER, BOOTY_CONTAINER, GAME_FLOW_CONTROLS_CONTAINER as FLOW_CONTROLS_CONTAINER, GAME_LOG, ITEM_DESCRIPTION_POPUP, UNITS_QUEUE_CONTAINER, UNIT_ITEMS_CONTAINER } from '../../constants/Components';
import { GameEvent, GamePhase, GameUnit } from '../../domain/domain';
import { RequestType } from '../../dto/requests';
import { GameActionData, GameNextPhaseData, GameStateData, PlayerInfoData, Response, ResponseStatus, UserStateData, UserStatus } from '../../dto/responces';
import ActionService from '../../service/ActionService';
import GameObjectRenderer from '../../service/GameObjectRenderer';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import { component } from '../decorator/decorator';
import ObjectDescription from '../ui/popup/ObjectDescription';
import TextField from '../ui/textfield/TextField';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';
import GameBase from './GameBase';
import GameBattlefield from './GameBattlefield';
import GameBooty from './GameBooty';
import GameFlowControls from './GameFlowControls';
import GameUnitItems from './GameUnitItems';
import GameUnitsQueue from './GameUnitsQueue';

@injectable()
@singleton()
export default class GameScene extends GameBase implements ServerCommunicatorHandler {
    @component(GAME_LOG, TextField)
    private readonly gameLog: TextField;
    @component(ITEM_DESCRIPTION_POPUP, ObjectDescription)
    private readonly objectDescription: ObjectDescription;
    @component(UNITS_QUEUE_CONTAINER, GameUnitsQueue)
    private readonly unitsQueue: GameUnitsQueue;
    @component(BOOTY_CONTAINER, GameBooty)
    private readonly booty: GameBooty;
    @component(UNIT_ITEMS_CONTAINER, GameUnitItems)
    private readonly unitItems: GameUnitItems;
    @component(FLOW_CONTROLS_CONTAINER, GameFlowControls)
    private readonly flowControls: GameFlowControls;
    @component(BATTLEFIELD_CONTAINER, GameBattlefield)
    private readonly battlefield: GameBattlefield;

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly configurator: UnitConfigurator,
        private readonly renderer: GameObjectRenderer,
        private readonly state: GameStateService,
        private readonly actionService: ActionService) {
        super(state, actionService);
    }

    protected initialize(): void {
        this.communicator.subscribe([
            RequestType.GAME_STATE,
            RequestType.USER_STATUS,
            RequestType.NEXT_GAME_PHASE,
            RequestType.GAME_ACTION,
            RequestType.PLAYER_INFO,
        ], this);
        super.initialize();
        this.hide();
        this.objectDescription.hide();
        this.unitItems.objectDescription = this.objectDescription;
        this.unitsQueue.objectDescription = this.objectDescription;
        this.battlefield.objectDescription = this.objectDescription;
        this.battlefield.unitItems = this.unitItems;
    }

    public handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        switch (response.type) {
            case RequestType.GAME_STATE:
                this.state.gameState = (response.data as GameStateData).gameState;
                this.handleGameState();
                break;
            case RequestType.GAME_ACTION:
            case RequestType.NEXT_GAME_PHASE:
                this.state.gameState = (response.data as GameActionData | GameNextPhaseData).actionResult;
                this.handleGameAction();
                break;
            case RequestType.PLAYER_INFO:
                this.state.playerInfo = (response.data as PlayerInfoData).playerInfo;
                this.handlePlayerInfo();
                break;
            case RequestType.USER_STATUS:
                const status: UserStatus = (response.data as UserStateData).status;
                this.handleUserStatus(status);
                break;
        }
    }

    public handleConnectionLost(): void {
        this.hide();
        this.destroy();
    }

    public destroy(): void {
        this.unitItems.destroy();
        this.battlefield.destroy();
        this.gameLog.value = '';
    }

    protected handleGameState(): void {
        this.updatePlayerInfoFromGameState(this.state.gameState);
        this.unitItems.update();
        this.battlefield.updateBattleField();
        this.unitsQueue.updateUnitsQueue();
        this.booty.update();
        this.flowControls.update();
    }

    protected handleGameAction(): void {
        if (this.state.gameState.phase === GamePhase.SPOT_COMPLETE &&
            this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) {
            this.destroy();
        }
        this.updatePlayerInfoFromGameState(this.state.gameState);
        this.unitItems.update();
        this.unitsQueue.updateUnitsQueue();
        this.battlefield.updateBattleField();
        this.battlefield.updateActionTargets();
        this.battlefield.updateWithExperience();
        this.booty.update();
        this.flowControls.update();
        this.flowControls.timeoutAutoNextPhase();
        this.logAction();
    }

    protected handlePlayerInfo(): void {
        this.unitItems.update();
        this.flowControls.update();
        this.flowControls.timeoutAutoNextPhase();
    }

    protected handleUserStatus(status: UserStatus): void {
        if (status !== UserStatus.IN_GAME && this.visible) {
            this.destroy();
            this.hide();
            this.configurator.show();
        }
    }

    protected logAction(): void {
        if (this.state.gameState.unitActionResult) {
            const unit: GameUnit = this.findUnitByUid(this.state.gameState.unitActionResult.action.uid!);
            const name: string = this.getUnitName(unit);
            this.gameLog.value =
                this.renderer.header(name, 2) + '<br>' +
                this.renderer.render(this.distinguishUnitActionResult(this.state.gameState.unitActionResult)) +
                '--------------------<br>' + this.gameLog.value;
        }
        if (this.state.gameState.endRoundResult) {
            this.gameLog.value =
                this.renderer.header('End Round result', 2) + '<br>' +
                this.renderer.render(this.distinguishEndRoundResult(this.state.gameState.endRoundResult)) +
                '--------------------<br>' + this.gameLog.value;
        }
        if (this.state.gameState.spotCompleteResult) {
            this.gameLog.value =
                this.renderer.header('End Battle result', 2) + '<br>' +
                this.renderer.render(this.distinguishSpotCompleteResultResult(this.state.gameState.spotCompleteResult)) +
                '--------------------<br>' + this.gameLog.value;
        }
    }

    protected updatePlayerInfoFromGameState(gameState: GameEvent): void {
        if (!this.state.playerInfo) { return; }
        this.state.playerInfo = gameState.players.filter(player => player.nickname === this.state.playerInfo.nickname)[0];
    }
}
