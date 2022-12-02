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
        const units: GameUnit[] = this.state.gameState.state.activeUnitsQueue.map(
            unitUid => this.findUnitByUid(unitUid));
        this.removeAllChildren();
        units.forEach(unit => this.updateUnitInQueue(unit));
    }

    protected updateUnitInQueue(data: GameUnit): void {
        const cell: SpotCell = SpotCell.createSpotCell(this, this.view)!;
        cell.updateWithUnit(data);
        cell.descriptionPopup = this._objectDescription;
    }

}
