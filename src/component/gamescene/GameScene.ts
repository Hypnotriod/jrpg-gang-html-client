import { injectable, singleton } from 'tsyringe';
import { BATTLEFIELD_CONTAINER } from '../../constants/Components';
import { Cell, GameUnit } from '../../domain/domain';
import { RequestType } from '../../dto/requests';
import { GameStateData, Response } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import Container from '../ui/container/Container';
import SpotCell from '../ui/icon/SpotCell';

@injectable()
@singleton()
export default class GameScene extends Component implements ServerCommunicatorHandler {
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
        }
    }

    public handleConnectionLost(): void {
        this.hide();
    }

    protected updateBattleField(): void {
        !this.spots && this.initBattlefield();
        const units: GameUnit[] = this.gameState.gameState.spot.battlefield.units;
        units.forEach(unit => {
            this.spots[unit.position.x][unit.position.y].icon = unit.code!;
        });
    }

    protected initBattlefield(): void {
        const matrix: Cell[][] = this.gameState.gameState.spot.battlefield.matrix;
        this.spots = [];
        for (const x in matrix) {
            this.spots[x] = [];
            for (const y in matrix[x]) {
                const id: string = `cells_row_${x}`;
                const cell: Cell = matrix[x][y];
                this.create(BATTLEFIELD_CONTAINER, Container, { classList: ['column-container'], id });
                const spotCell: SpotCell = SpotCell.createSpotCell(cell.code, this, id)!;
                this.spots[x][y] = spotCell;
            }
        }
    }
}
