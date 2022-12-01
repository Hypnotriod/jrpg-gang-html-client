import { injectable, singleton } from 'tsyringe';
import { BATTLEFIELD_CONTAINER, BOOTY_CONTAINER, BUTTON_LEAVE_GAME, BUTTON_NEXT_PHASE, BUTTON_SKIP, CHECKBOX_AUTO, GAME_LOG, ITEM_DESCRIPTION_POPUP, LABEL_GAME_STATUS, UNITS_QUEUE_CONTAINER, UNIT_ITEMS_CONTAINER } from '../../constants/Components';
import { ActionResultType, ActionType, Cell, GameEvent, GamePhase, GameUnit, PlayerInfo, Position } from '../../domain/domain';
import { ActionData, GameActionRequestData, NextGamePhaseData, RequestType } from '../../dto/requests';
import { GameActionData, GameNextPhaseData, GameStateData, PlayerInfoData, Response, ResponseStatus, UserStateData, UserStatus } from '../../dto/responces';
import ActionService from '../../service/ActionService';
import GameObjectRenderer from '../../service/GameObjectRenderer';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Checkbox from '../ui/checkbox/Checkbox';
import Container from '../ui/container/Container';
import ItemIcon from '../ui/icon/ItemIcon';
import SpotCell from '../ui/icon/SpotCell';
import Label from '../ui/label/Label';
import ObjectDescription from '../ui/popup/ObjectDescription';
import TextField from '../ui/textfield/TextField';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';
import GameBase from './GameBase';
import GameUnitItems from './GameUnitItems';

@injectable()
@singleton()
export default class GameScene extends GameBase implements ServerCommunicatorHandler {
    @component(LABEL_GAME_STATUS, Label)
    private readonly gameStatusLabel: Label;
    @component(GAME_LOG, TextField)
    private readonly gameLog: TextField;
    @component(BUTTON_NEXT_PHASE, Button)
    private readonly nextPhaseButton: Button;
    @component(BUTTON_SKIP, Button)
    private readonly skipButton: Button;
    @component(BUTTON_LEAVE_GAME, Button)
    private readonly leaveGameButton: Button;
    @component(CHECKBOX_AUTO, Checkbox)
    private readonly autoCheckbox: Checkbox;
    @component(ITEM_DESCRIPTION_POPUP, ObjectDescription)
    private readonly objectDescription: ObjectDescription;
    @component(UNITS_QUEUE_CONTAINER, Container)
    private readonly unitsQueueContainer: Container;
    @component(BOOTY_CONTAINER, Container)
    private readonly bootyContainer: Container;
    @component(UNIT_ITEMS_CONTAINER, GameUnitItems)
    private readonly unitItems: GameUnitItems;

    private readonly bootyIcons: Map<string, ItemIcon> = new Map();

    private currUnit: GameUnit | null = null;
    private nextPhaseTimeoutId: NodeJS.Timeout;
    private spots: SpotCell[][];

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
        this.nextPhaseButton.onClick = target => this.onNextPhase();
        this.leaveGameButton.onClick = target => this.onLeaveGameClick();
        this.skipButton.onClick = target => this.onSkipButtonClick();
        this.autoCheckbox.onChange = target => this.timeoutAutoNextPhase();
        this.autoCheckbox.checked = true;
        this.objectDescription.hide();
        this.unitItems.objectDescription = this.objectDescription;
        this.bootyIcons.set('coins', ItemIcon.createItemIcon('coins', this, BOOTY_CONTAINER)!);
        this.bootyIcons.set('ruby', ItemIcon.createItemIcon('ruby', this, BOOTY_CONTAINER)!);
        this.bootyIcons.get('coins')!.name = 'Coins';
        this.bootyIcons.get('ruby')!.name = 'Ruby';
    }

    public handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        switch (response.type) {
            case RequestType.GAME_STATE:
                this.state.gameState = (response.data as GameStateData).gameState;
                this.updatePlayerInfoFromGameState(this.state.gameState);
                this.updateBattleField();
                this.updateUserItems();
                this.updateUnitsQueue();
                break;
            case RequestType.GAME_ACTION:
            case RequestType.NEXT_GAME_PHASE:
                this.state.gameState = (response.data as GameActionData | GameNextPhaseData).actionResult;
                if (this.state.gameState.phase === GamePhase.BATTLE_COMPLETE &&
                    this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) {
                    this.destroy();
                }
                this.updatePlayerInfoFromGameState(this.state.gameState);
                this.updateBattleField();
                this.updateUserItems();
                this.updateUnitsQueue();
                this.updateActionTarget();
                this.logAction();
                this.timeoutAutoNextPhase();
                break;
            case RequestType.PLAYER_INFO:
                this.state.playerInfo = (response.data as PlayerInfoData).playerInfo;
                this.updateUserItems();
                this.updateNextPhaseSkipButton();
                break;
            case RequestType.USER_STATUS:
                const status: UserStatus = (response.data as UserStateData).status;
                if (status !== UserStatus.IN_GAME && this.visible) {
                    this.destroy();
                    this.hide();
                    this.configurator.show();
                }
                break;
        }
    }

    public handleConnectionLost(): void {
        this.hide();
        this.destroy();
    }

    public destroy(): void {
        this.unitItems.destroy();
        for (const x in this.spots) {
            for (const y in this.spots[x]) {
                this.spots[x][y].destroy();
            }
        }
        (this.spots as SpotCell[][] | undefined) = undefined;
    }

    protected updateActionTarget(): void {
        if (this.state.gameState.unitActionResult && this.state.gameState.unitActionResult.result.result === ActionResultType.ACCOMPLISHED) {
            const targetuid = this.state.gameState.unitActionResult.action.targetUid;
            if (!targetuid) { return; }
            const unit: GameUnit = this.findUnitByUid(targetuid);
            this.spots[unit.position.x][unit.position.y].updateWithActionResult(this.state.gameState.unitActionResult.result);
        }
    }

    protected logAction(): void {
        if (this.state.gameState.unitActionResult) {
            const unit: GameUnit = this.findUnitByUid(this.state.gameState.unitActionResult.action.uid!);
            const name: string = this.getUnitName(unit);
            this.gameLog.value =
                this.renderer.header(name, 2) + '<br>' +
                this.renderer.render(this.distinguishUnitActionResult(this.state.gameState.unitActionResult));
        }
        if (this.state.gameState.endRoundResult) {
            this.gameLog.value =
                this.renderer.header('End Round result', 2) + '<br>' +
                this.renderer.render(this.distinguishEndRoundResult(this.state.gameState.endRoundResult));
        }
    }

    protected updateBattleField(): void {
        !this.spots && this.initBattlefield();
        this.updateBattlefieldCells();
        this.updateBattleFieldUnits();
        this.updateNextPhaseSkipButton();
        this.bootyIcons.get('coins')!.quantity = this.state.gameState.state.booty.coins;
        this.bootyIcons.get('ruby')!.quantity = this.state.gameState.state.booty.ruby || 0;
        this.gameStatusLabel.value = `${this.state.gameState.nextPhase}`;
    }

    protected updateNextPhaseSkipButton(): void {
        const gamePhase: string = this.state.gameState.nextPhase;
        const playerInfo: PlayerInfo | undefined = this.state.playerInfo;
        switch (gamePhase) {
            case GamePhase.READY_FOR_START_ROUND:
            case GamePhase.PREPARE_UNIT:
            case GamePhase.MAKE_MOVE_OR_ACTION_AI:
            case GamePhase.MAKE_ACTION_AI:
            case GamePhase.ACTION_COMPLETE:
            case GamePhase.RETREAT_ACTION:
            case GamePhase.BATTLE_COMPLETE:
                playerInfo && !playerInfo.isReady ? this.nextPhaseButton.show() : this.nextPhaseButton.hide();
                this.skipButton.hide();
                break;
            default:
                this.nextPhaseButton.hide();
                this.isCurrentUnitTurn() ? this.skipButton.show() : this.skipButton.hide();
                break;
        }
    }

    protected updatePlayerInfoFromGameState(gameState: GameEvent): void {
        if (!this.state.playerInfo) { return; }
        this.state.playerInfo = gameState.players.filter(player => player.nickname === this.state.playerInfo.nickname)[0];
    }

    protected updateBattleFieldUnits(): void {
        const corpses: GameUnit[] = this.state.gameState.spot.battlefield.corpses;
        const units: GameUnit[] = this.state.gameState.spot.battlefield.units;
        if (this.state.gameState.nextPhase === GamePhase.ACTION_COMPLETE &&
            (this.state.gameState.phase === GamePhase.MAKE_ACTION ||
                this.state.gameState.phase === GamePhase.MAKE_MOVE_OR_ACTION ||
                this.state.gameState.phase === GamePhase.MAKE_ACTION_AI ||
                this.state.gameState.phase === GamePhase.MAKE_MOVE_OR_ACTION_AI)) {
        } else {
            this.currUnit = this.currentUnit();
        }
        corpses && corpses.forEach(corpse => {
            this.spots[corpse.position.x][corpse.position.y].updateWithCorpse(corpse);
        });
        units.forEach(unit => {
            const spot: SpotCell = this.spots[unit.position.x][unit.position.y];
            spot.updateWithUnit(unit);
            if (this.currUnit && this.currUnit.uid === unit.uid && this.state.gameState.nextPhase !== GamePhase.PREPARE_UNIT) {
                spot.choose();
            }
        });
    }

    protected updateBattlefieldCells(): void {
        const matrix: Cell[][] = this.state.gameState.spot.battlefield.matrix;
        for (const x in matrix) {
            for (const y in matrix[x]) {
                this.spots[x][y].updateWithCell(matrix[x][y]);
            }
        }
    }

    protected initBattlefield(): void {
        const matrix: Cell[][] = this.state.gameState.spot.battlefield.matrix;
        this.spots = [];
        for (const x in matrix) {
            this.spots[x] = [];
            for (const y in matrix[x]) {
                const id: string = `cells_row_${x}`;
                this.create(BATTLEFIELD_CONTAINER, Container, { classList: ['column-container'], id });
                const spotCell: SpotCell = SpotCell.createSpotCell(this, id)!;
                spotCell.descriptionPopup = this.objectDescription;
                spotCell.x = Number(x);
                spotCell.y = Number(y);
                this.spots[x][y] = spotCell;
                spotCell.onClick = target => this.onSpotCellClick(target);
            }
        }
        this.communicator.sendMessage(RequestType.PLAYER_INFO);
    }

    protected onSpotCellClick(target: SpotCell): void {
        if (this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) {
            this.placeUnit({ x: target.x, y: target.y });
        } else if (this.canDoAction() && target.unit) {
            this.useItem(target.unit.uid!);
        } else if (this.state.gameState.nextPhase === GamePhase.MAKE_MOVE_OR_ACTION) {
            this.moveUnit({ x: target.x, y: target.y });
        }
    }

    protected isCurrentUnitTurn(): boolean {
        const activeUnitUid = this.state.gameState.state.activeUnitsQueue[0];
        return Boolean(this.state.playerInfo && this.state.playerInfo.unitUid === activeUnitUid);
    }

    protected placeUnit(position: Position): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: ActionType.PLACE,
            position,
        } as GameActionRequestData);
    }

    protected moveUnit(position: Position): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: ActionType.MOVE,
            position,
        } as GameActionRequestData);
    }

    protected useItem(targetUid: number): void {
        const weapon = this.unitItems.getChoosedItem();
        if (!weapon) { return; }
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: ActionType.USE,
            itemUid: weapon.data.uid!,
            targetUid,
        } as GameActionRequestData);
    }

    protected updateUserItems(): void {
        if (!this.state.playerInfo) { return; }
        const unit: GameUnit = this.currentActor();
        if (!unit) { return; }
        this.unitItems.updateUnitInventoryIcons(unit.inventory);
    }

    protected updateUnitsQueue(): void {
        const units: GameUnit[] = this.state.gameState.state.activeUnitsQueue.map(
            unitUid => this.findUnitByUid(unitUid));
        this.unitsQueueContainer.removeAllChildren();
        units.forEach(unit => this.updateUnitInQueue(unit));
    }

    protected updateUnitInQueue(data: GameUnit): void {
        const cell: SpotCell = SpotCell.createSpotCell(this, UNITS_QUEUE_CONTAINER)!;
        cell.updateWithUnit(data);
        cell.descriptionPopup = this.objectDescription;
    }

    protected onNextPhase(): void {
        this.clearAutoNextPhase();
        this.communicator.sendMessage(RequestType.NEXT_GAME_PHASE, {
            isReady: true,
        } as NextGamePhaseData);
    }

    protected onSkipButtonClick(): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: ActionType.SKIP,
        } as ActionData);
    }

    private autoNextPhaseInProgress: boolean = false;
    protected timeoutAutoNextPhase(): void {
        if (!this.checkAutoNextPhaseConditions()) { return; }
        this.clearAutoNextPhase();
        if (this.state.userState.playerInfo.isReady) { return; }
        this.autoNextPhaseInProgress = true;
        this.nextPhaseTimeoutId = setTimeout(() => this.callAutoNextPhase(), 1500);
    }

    protected callAutoNextPhase(): void {
        this.clearAutoNextPhase();
        if (!this.checkAutoNextPhaseConditions()) { return; }
        this.onNextPhase();
    }

    protected clearAutoNextPhase(): void {
        clearTimeout(this.nextPhaseTimeoutId);
        this.autoNextPhaseInProgress = false;
    }

    protected checkAutoNextPhaseConditions(): boolean {
        if (this.state.gameState.spot.battlefield.units?.every(unit => unit.isDead)) { return false; }
        const unit: GameUnit = this.currentActor();
        if (!unit || this.autoNextPhaseInProgress) { return false; }
        if (!this.autoCheckbox.checked || !this.nextPhaseButton.visible ||
            (this.state.gameState.nextPhase === GamePhase.BATTLE_COMPLETE ||
                this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) && !unit.isDead) {
            return false;
        }
        return true;
    }

    protected onLeaveGameClick(): void {
        this.communicator.sendMessage(RequestType.LEAVE_GAME);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }
}
