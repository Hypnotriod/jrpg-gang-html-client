import { GamePhase } from '../../domain/domain';
import GameStateService from '../../service/GameStateService';
import Component from '../Component';

export default class GameBase extends Component {
    constructor(
        private readonly _state: GameStateService) {
        super();
    }

    protected initialize(): void {
    }

    protected canDoUnitConfiguration(): boolean {
        return this.canDoAction() || this._state.gameState.nextPhase === GamePhase.PREPARE_UNIT;
    }

    protected canDoAction(): boolean {
        return this._state.gameState.nextPhase === GamePhase.MAKE_MOVE_OR_ACTION ||
            this._state.gameState.nextPhase === GamePhase.MAKE_ACTION;
    }
}
