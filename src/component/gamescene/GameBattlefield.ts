import { injectable, singleton } from 'tsyringe';
import { ActionResultType, ActionType, Cell, EndRoundResult, GamePhase, GameUnit, GameUnitActionResult, Position, Weapon } from '../../domain/domain';
import { ActionRequestData, RequestType } from '../../dto/requests';
import ActionService from '../../service/ActionService';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import Container from '../ui/container/Container';
import SpotCell from '../ui/icon/SpotCell';
import ObjectDescription from '../ui/popup/ObjectDescription';
import GameBase from './GameBase';
import GameUnitItems from './GameUnitItems';
import { SoundName, SoundService } from '../../service/SoundService';

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
    private deathSoundPlayed: boolean = false;
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

    public updateActionTargets(): void {
        const unitActionResult: GameUnitActionResult | undefined = this.state.gameState.unitActionResult;
        if (unitActionResult?.result.result !== ActionResultType.ACCOMPLISHED) { return; }
        const targets: number[] = this.actionService.targets(unitActionResult.result);
        targets.forEach(targetUid => {
            const unit: GameUnit = this.findUnitByUid(unitActionResult.action.uid!)!;
            const item = this.findItemInInventory(unit.inventory, unitActionResult.action.itemUid!);
            const ammo = (item as Weapon | undefined)?.ammunitionKind ? unit.inventory.ammunition?.find(a => a.equipped) : undefined;
            const target: GameUnit = this.findUnitByUid(targetUid)!;
            this.spots[target.position.x][target.position.y].updateWithActionResult(unitActionResult.result, targetUid, item, ammo,);
        })
    }

    public updateWithExperience(): void {
        const unitActionResult: GameUnitActionResult | undefined = this.state.gameState.unitActionResult;
        const endRoundResult: EndRoundResult | undefined = this.state.gameState.endRoundResult;
        const spotCompleteResult: EndRoundResult | undefined = this.state.gameState.spotCompleteResult;
        if (unitActionResult?.result.result === ActionResultType.ACCOMPLISHED && unitActionResult.result.experience) {
            this.updateSpotsWithExperience(unitActionResult.result.experience);
        }
        endRoundResult?.experience && this.updateSpotsWithExperience(endRoundResult.experience);
        spotCompleteResult?.experience && this.updateSpotsWithExperience(spotCompleteResult.experience);
    }

    protected updateSpotsWithExperience(experience: { [key: number]: number }): void {
        Object.keys(experience).forEach(key => {
            const uid: number = Number(key);
            const exp: number = experience[uid];
            const unit: GameUnit = this.findUnitByUid(uid)!;
            this.spots[unit.position.x][unit.position.y].updateWithExperience(exp);
        });
    }

    public updateBattleField(): void {
        !this.spots && this.initBattlefield();
        this.updateBattlefieldCells();
        this.updateBattleFieldUnits();
        const unit = this.playersUnit();
        if (unit?.isDead === true && !this.deathSoundPlayed) {
            this.deathSoundPlayed = true;
            SoundService.play(SoundName.GAME_OVER);
        }
    }

    public updateUnitsTurnOrder(): void {
        if (!this.spots) return;
        const unitsQueue = this.state.gameState.state.activeUnitsQueue;
        for (let x = 0; x < this.spots.length; x++) {
            for (let y = 0; y < this.spots[x].length; y++) {
                const cell = this.spots[x][y];
                const unit = this.spots[x][y].unit;
                if (!unit) {
                    cell.updateWithTurnOrder(0);
                } else {
                    cell.updateWithTurnOrder(unitsQueue.indexOf(unit.uid!) + 1);
                }
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
                this.create(this.view, Container, { classList: ['column-container'], id });
                const spotCell: SpotCell = SpotCell.createSpotCell(this, id)!;
                spotCell.descriptionPopup = this._objectDescription;
                spotCell.displayActionChance = true;
                spotCell.x = Number(x);
                spotCell.y = Number(y);
                this.spots[x][y] = spotCell;
                spotCell.onClick = target => this.onSpotCellClick(target);
            }
        }
        this.communicator.sendMessage(RequestType.PLAYER_INFO);
        if (this.state.gameState.state.spotNumber === 1) {
            this.deathSoundPlayed = false;
        }
    }

    protected updateBattleFieldUnits(): void {
        const corpses: GameUnit[] = this.state.gameState.spot.battlefield.corpses;
        const units: GameUnit[] = this.state.gameState.spot.battlefield.units;
        if (this.state.gameState.nextPhase === GamePhase.ACTION_COMPLETE &&
            (this.state.gameState.phase === GamePhase.TAKE_ACTION ||
                this.state.gameState.phase === GamePhase.TAKE_ACTION_AI)) {
            this.currUnit = this.currUnit ? this.findUnitByUid(this.currUnit.uid!)! : this.currUnit;
        } else {
            this.currUnit = this.currentUnit()!;
        }
        corpses && corpses.forEach(corpse => {
            if (units.some(u => u.position.x === corpse.position.x && u.position.y === corpse.position.y)) return;
            this.spots[corpse.position.x]?.[corpse.position.y]?.updateWithCorpse(corpse);
        });
        const isActive = this.state.gameState.nextPhase !== GamePhase.PREPARE_UNIT;
        units.forEach(unit => {
            const spot: SpotCell = this.spots[unit.position.x][unit.position.y];
            spot.updateWithUnit(unit, isActive);
            if (this.currUnit && this.currUnit.uid === unit.uid && this.state.gameState.nextPhase !== GamePhase.PREPARE_UNIT) {
                spot.choose(this.currUnit.state.actionPoints);
            }
            isActive && spot.showActionChance();
        });
    }

    protected updateBattlefieldCells(): void {
        const matrix: Cell[][] = this.state.gameState.spot.battlefield.matrix;
        const isActive =
            (this.state.gameState.nextPhase === GamePhase.TAKE_ACTION &&
                this.isCurrentUnitTurn() && !this.allEnemiesAreDefeated() ||
                this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT);
        for (const x in matrix) {
            for (const y in matrix[x]) {
                this.spots[x][y].updateWithCell(matrix[x][y], isActive);
            }
        }
    }

    protected onSpotCellClick(target: SpotCell): void {
        const unut = this.playersUnit();
        if (!unut || unut.isDead) return;
        if (this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) {
            this.placeUnit({ x: target.x, y: target.y });
        } else if (this.canUseItem() && target.unit) {
            this.useItem(target.unit.uid!);
        } else if (this.state.gameState.nextPhase === GamePhase.TAKE_ACTION) {
            this.moveUnit({ x: target.x, y: target.y });
        }
    }

    protected placeUnit(position: Position): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: ActionType.PLACE,
            position,
        } as ActionRequestData);
    }

    protected moveUnit(position: Position): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: ActionType.MOVE,
            position,
        } as ActionRequestData);
    }

    protected useItem(targetUid: number): void {
        const weapon = this._unitItems.getChosenItem();
        if (!weapon) { return; }
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: ActionType.USE,
            itemUid: weapon.data.uid!,
            targetUid,
        } as ActionRequestData);
    }
}
