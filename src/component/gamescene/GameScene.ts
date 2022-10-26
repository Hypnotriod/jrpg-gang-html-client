import { injectable, singleton } from 'tsyringe';
import { BATTLEFIELD_CONTAINER, BOOTY_CONTAINER, BUTTON_LEAVE_GAME, BUTTON_NEXT_PHASE, BUTTON_SKIP, CHECKBOX_AUTO, GAME_LOG, ITEM_DESCRIPTION_POPUP, LABEL_GAME_STATUS, UNITS_QUEUE_CONTAINER, UNIT_ITEMS_CONTAINER } from '../../constants/Components';
import { ActionResultType, ActionType, Cell, EndTurnResult, GameEvent, GamePhase, GameUnit, GameUnitActionResult, Item, PlayerInfo, Position, UnitInventory } from '../../domain/domain';
import { ActionData, GameActionRequestData, RequestType } from '../../dto/requests';
import { GameActionData, GameStateData, PlayerInfoData, Response, UserStateData, UserStatus } from '../../dto/responces';
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

    private nextPhaseTimeoutId: NodeJS.Timeout;

    private spots: SpotCell[][];

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly configurator: UnitConfigurator,
        private readonly renderer: GameObjectRenderer,
        private readonly state: GameStateService,
        private readonly actionService: ActionService) {
        super(state);
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
        this.nextPhaseButton.onClick = target => this.onNextPhaseClick();
        this.leaveGameButton.onClick = target => this.onLeaveGameClick();
        this.skipButton.onClick = target => this.onSkipButtonClick();
        this.autoCheckbox.onChange = target => this.timeoutAutoNextPhase();
        this.objectDescription.hide();
        this.unitItems.objectDescription = this.objectDescription;
        this.bootyIcons.set('coins', ItemIcon.createItemIcon('coins', this, BOOTY_CONTAINER)!);
        this.bootyIcons.set('ruby', ItemIcon.createItemIcon('ruby', this, BOOTY_CONTAINER)!);
        this.bootyIcons.get('coins')!.name = 'Coins';
        this.bootyIcons.get('ruby')!.name = 'Ruby';
    }

    public handleServerResponse(response: Response): void {
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
                this.state.gameState = (response.data as GameActionData).actionResult;
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

    protected getUnitName(unit: GameUnit): string {
        return unit.playerInfo ? `${unit.name} (${unit.playerInfo.nickname})` : (`${unit.name} (${unit.uid})`);
    }

    protected distinguishEndRoundResult(endRound: EndTurnResult): object {
        const result: any = {};
        Object.keys(endRound.damage).forEach(key => {
            if (!Object.keys(endRound.damage[key]).length) { return; }
            result.damage = result.damage || {};
            const unit = this.findUnitByUid(Number(key));
            result.damage[this.getUnitName(unit)] = endRound.damage[key];
        });
        Object.keys(endRound.recovery).forEach(key => {
            if (!Object.keys(endRound.recovery[key]).length) { return; }
            result.recovery = result.recovery || {};
            const unit = this.findUnitByUid(Number(key));
            result.recovery[this.getUnitName(unit)] = endRound.recovery[key];
        });
        if (endRound.booty.coins || endRound.booty.ruby) {
            result.booty = endRound.booty;
        }
        return result;
    }

    protected distinguishUnitActionResult(action: GameUnitActionResult): object {
        const result: any = {
            ...action,
        };
        if (action.action.action === ActionType.USE &&
            action.result.result === ActionResultType.ACCOMPLISHED) {
            if (!this.actionService.successfull(action.result)) {
                result.result.result = 'no success!';
            } else if (!this.actionService.hasEffect(action.result)) {
                result.result.result = 'no effect!';
            }
        }
        const actorUnit = this.findUnitByUid(action.action.uid!);
        const targetUnit = this.findUnitByUid(action.action.targetUid!);
        if (action.action.itemUid) {
            const actorItem = this.findItemInInventory(actorUnit.inventory, action.action.itemUid);
            if (actorItem) {
                result.action.itemUid = undefined;
                result.action.item = actorItem.name;
            }
        }
        if (targetUnit) {
            result.action.targetUid = undefined;
            result.action.target = this.getUnitName(targetUnit);
        }
        return result;
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
                playerInfo && playerInfo.isHost ? this.nextPhaseButton.show() : this.nextPhaseButton.hide();
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
        corpses && corpses.forEach(corpse => {
            this.spots[corpse.position.x][corpse.position.y].updateWithCorpse(corpse);
        });
        units.forEach(unit => {
            this.spots[unit.position.x][unit.position.y].updateWithUnit(unit);
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

    protected currentActor(): GameUnit {
        return this.findUnitByUid(this.state.playerInfo.unitUid!);
    }

    protected findItemInInventory(inventory: UnitInventory, uid: number): Item | undefined {
        const inventoryItems: Item[] = [
            ...(inventory.weapon || []),
            ...(inventory.ammunition || []),
            ...(inventory.magic || []),
            ...(inventory.armor || []),
            ...(inventory.disposable || []),
        ];
        return inventoryItems.find(i => i.uid === uid);
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

    protected onNextPhaseClick(): void {
        this.communicator.sendMessage(RequestType.NEXT_GAME_PHASE);
    }

    protected onSkipButtonClick(): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: ActionType.SKIP,
        } as ActionData);
    }

    protected timeoutAutoNextPhase(): void {
        clearTimeout(this.nextPhaseTimeoutId);
        this.nextPhaseTimeoutId = setTimeout(() => this.callAutoNextPhase(), 1500);
    }

    protected callAutoNextPhase(): void {
        if (!this.autoCheckbox.checked || !this.nextPhaseButton.visible ||
            this.state.gameState.nextPhase === GamePhase.BATTLE_COMPLETE ||
            this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) {
            return;
        }
        this.onNextPhaseClick();
    }

    protected onLeaveGameClick(): void {
        this.communicator.sendMessage(RequestType.LEAVE_GAME);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected findUnitByUid(unitUid: number): GameUnit {
        const result: GameUnit | undefined = this.state.gameState.spot.battlefield.units?.find(
            unit => unit.uid === unitUid);
        return result || this.state.gameState.spot.battlefield.corpses?.find(
            unit => unit.uid === unitUid)!;
    }
}
