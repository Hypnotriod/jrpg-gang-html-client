import { injectable, singleton } from 'tsyringe';
import { BATTLEFIELD_CONTAINER, LABEL_GAME_STATUS } from '../../constants/Components';
import { AtionType, Cell, GamePhase, GameUnit, Position } from '../../domain/domain';
import { GameActionRequestData, RequestType } from '../../dto/requests';
import { GameActionData, GameStateData, Response } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Container from '../ui/container/Container';
import SpotCell from '../ui/icon/SpotCell';
import Label from '../ui/label/Label';

@injectable()
@singleton()
export default class GameScene extends Component implements ServerCommunicatorHandler {
    @component(LABEL_GAME_STATUS, Label)
    private readonly gameStatusLabel: Label;

    private spots: SpotCell[][];

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly gameState: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.communicator.subscribe([
            RequestType.GAME_STATE,
            RequestType.NEXT_GAME_PHASE,
            RequestType.GAME_ACTION,
        ], this);
        this.hide();
    }

    public handleServerResponse(response: Response): void {
        switch (response.type) {
            case RequestType.GAME_STATE:
                this.gameState.gameState = (response.data as GameStateData).gameState;
                this.updateBattleField();
                break;
            case RequestType.GAME_ACTION:
                this.gameState.gameState = (response.data as GameActionData).actionResult;
                this.updateBattleField();
                break;
        }
    }

    public handleConnectionLost(): void {
        this.hide();
    }

    protected updateBattleField(): void {
        !this.spots && this.initBattlefield();
        this.updateBattlefieldCells();
        this.updateBattleFieldUnits();
        const gamePhase: string = this.gameState.gameState.nextPhase;
        this.gameStatusLabel.value = `Game Phase: ${gamePhase}`;
    }

    protected updateBattleFieldUnits(): void {
        const units: GameUnit[] = this.gameState.gameState.spot.battlefield.units;
        units.forEach(unit => {
            this.spots[unit.position.x][unit.position.y].updateWithUnit(unit);
        });
    }

    protected updateBattlefieldCells(): void {
        const matrix: Cell[][] = this.gameState.gameState.spot.battlefield.matrix;
        for (const x in matrix) {
            for (const y in matrix[x]) {
                this.spots[x][y].updateWithCell(matrix[x][y]);
            }
        }
    }

    protected initBattlefield(): void {
        const matrix: Cell[][] = this.gameState.gameState.spot.battlefield.matrix;
        this.spots = [];
        for (const x in matrix) {
            this.spots[x] = [];
            for (const y in matrix[x]) {
                const id: string = `cells_row_${x}`;
                this.create(BATTLEFIELD_CONTAINER, Container, { classList: ['column-container'], id });
                const spotCell: SpotCell = SpotCell.createSpotCell(this, id)!;
                spotCell.x = Number(x);
                spotCell.y = Number(y);
                this.spots[x][y] = spotCell;
                spotCell.onClick = target => this.onSpotCellClick(target);
            }
        }
    }

    protected onSpotCellClick(target: SpotCell): void {
        if (this.gameState.gameState.phase === GamePhase.PLACE_UNIT) {
            this.placeUnit({ x: target.x, y: target.y });
        }
    }

    protected placeUnit(position: Position): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            action: AtionType.PLACE,
            position,
        } as GameActionRequestData);
    }
}
