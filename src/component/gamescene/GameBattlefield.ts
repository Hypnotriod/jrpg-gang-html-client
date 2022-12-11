import { injectable, singleton } from 'tsyringe';
import { ActionResultType, ActionType, Cell, GamePhase, GameUnit, GameUnitActionResult, Position } from '../../domain/domain';
import { GameActionRequestData, RequestType } from '../../dto/requests';
import ActionService from '../../service/ActionService';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import Container from '../ui/container/Container';
import SpotCell from '../ui/icon/SpotCell';
import ObjectDescription from '../ui/popup/ObjectDescription';
import GameBase from './GameBase';
import GameUnitItems from './GameUnitItems';

@injectable()
@singleton()
export default class GameBattlefield extends GameBase {
    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService,
        private readonly actionService: ActionService) {
        super(state, actionService);
    }

    private _objectDescription: ObjectDescription;
    private _unitItems: GameUnitItems;

    private currUnit: GameUnit | null = null;
    private spots: SpotCell[][];

    public destroy(): void {
        for (const x in this.spots) {
            for (const y in this.spots[x]) {
                this.spots[x][y].destroy();
            }
        }
        (this.spots as SpotCell[][] | undefined) = undefined;
    }

    public set objectDescription(value: ObjectDescription) {
        this._objectDescription = value;
    }

    public set unitItems(value: GameUnitItems) {
        this._unitItems = value;
    }

    public updateActionTarget(): void {
        const unitActionResult: GameUnitActionResult | undefined = this.state.gameState.unitActionResult;
        if (!unitActionResult || unitActionResult.result.result !== ActionResultType.ACCOMPLISHED) { return; }
        const targetuid = this.hasCriticalMiss(unitActionResult.result) ?
            unitActionResult.action.uid :
            unitActionResult.action.targetUid;
        if (!targetuid) { return; }
        const unit: GameUnit = this.findUnitByUid(targetuid);
        this.spots[unit.position.x][unit.position.y].updateWithActionResult(unitActionResult.result);
    }

    public updateBattleField(): void {
        !this.spots && this.initBattlefield();
        this.updateBattlefieldCells();
        this.updateBattleFieldUnits();
    }

    protected initBattlefield(): void {
        const matrix: Cell[][] = this.state.gameState.spot.battlefield.matrix;
        this.spots = [];
        for (const x in matrix) {
            this.spots[x] = [];
            for (const y in matrix[x]) {
                const id: string = `cells_row_${x}`;
                this.create(this.view, Container, { classList: ['column-container'], id });
                const spotCell: SpotCell = SpotCell.createSpotCell(this, id)!;
                spotCell.descriptionPopup = this._objectDescription;
                spotCell.x = Number(x);
                spotCell.y = Number(y);
                this.spots[x][y] = spotCell;
                spotCell.onClick = target => this.onSpotCellClick(target);
            }
        }
        this.communicator.sendMessage(RequestType.PLAYER_INFO);
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

    protected onSpotCellClick(target: SpotCell): void {
        if (this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) {
            this.placeUnit({ x: target.x, y: target.y });
        } else if (this.canDoAction() && target.unit) {
            this.useItem(target.unit.uid!);
        } else if (this.state.gameState.nextPhase === GamePhase.MAKE_MOVE_OR_ACTION) {
            this.moveUnit({ x: target.x, y: target.y });
        }
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
        const weapon = this._unitItems.getChoosedItem();
        if (!weapon) { return; }
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: ActionType.USE,
            itemUid: weapon.data.uid!,
            targetUid,
        } as GameActionRequestData);
    }
}
