import { injectable, singleton } from 'tsyringe';
import { GameUnit } from '../../domain/domain';
import ActionService from '../../service/ActionService';
import GameStateService from '../../service/GameStateService';
import SpotCell from '../ui/icon/SpotCell';
import ObjectDescription from '../ui/popup/ObjectDescription';
import GameBase from './GameBase';

@injectable()
@singleton()
export default class GameUnitsQueue extends GameBase {
    constructor(
        private readonly state: GameStateService,
        private readonly actionService: ActionService) {
        super(state, actionService);
    }

    private _objectDescription: ObjectDescription;

    public set objectDescription(value: ObjectDescription) {
        this._objectDescription = value;
    }

    public updateUnitsQueue(): void {
        this.removeAllChildren();
        const activeUnits: GameUnit[] = this.state.gameState.state.activeUnitsQueue
            .map(unitUid => this.findUnitByUid(unitUid));
        activeUnits.forEach(unit => this.updateUnitInQueue(unit, true));
        const inactiveUnits = this.state.gameState.state.inactiveUnits
            .map(unitUid => this.findUnitByUid(unitUid))
            .filter(u => !u.isDead);
        const inactiveUnitsInOrder = [
            ...inactiveUnits.filter(u => !u.state.isStunned),
            ...inactiveUnits.filter(u => u.state.isStunned),
        ];
        inactiveUnitsInOrder.forEach(unit => this.updateUnitInQueue(unit, false));
    }

    protected updateUnitInQueue(data: GameUnit, isActive: boolean): void {
        const cell: SpotCell = SpotCell.createSpotCell(this, this.view)!;
        cell.updateWithUnit(data, isActive, true);
        cell.descriptionPopup = this._objectDescription;
    }

}
