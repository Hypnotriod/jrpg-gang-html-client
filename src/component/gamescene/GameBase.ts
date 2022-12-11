import { ActionResult, ActionResultType, ActionType, EndTurnResult, GamePhase, GameUnit, GameUnitActionResult, Item, UnitInventory } from '../../domain/domain';
import ActionService from '../../service/ActionService';
import GameStateService from '../../service/GameStateService';
import Component from '../Component';

export default class GameBase extends Component {
    constructor(
        private readonly _state: GameStateService,
        private readonly _actionService: ActionService) {
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

    protected currentActor(): GameUnit {
        return this.findUnitByUid(this._state.playerInfo.unitUid!);
    }

    protected allActors(): GameUnit[] {
        return this._state.gameState.spot.battlefield.units?.filter(unit => Boolean(unit.playerInfo));
    }

    protected currentUnit(): GameUnit | null {
        const uid: number = this._state.gameState.state.activeUnitsQueue[0];
        if (!uid) { return null; }
        return this.findUnitByUid(uid);
    }

    protected hasCriticalMiss(result: ActionResult): boolean {
        return !!result.instantDamage.find(d => d.isCriticalMiss) ||
            !!result.temporalDamage.find(d => d.isCriticalMiss);
    }

    protected isCurrentUnitTurn(): boolean {
        const activeUnitUid = this._state.gameState.state.activeUnitsQueue[0];
        return Boolean(this._state.playerInfo && this._state.playerInfo.unitUid === activeUnitUid);
    }

    protected findUnitByUid(unitUid: number): GameUnit {
        const result: GameUnit | undefined = this._state.gameState.spot.battlefield.units?.find(
            unit => unit.uid === unitUid);
        return result || this._state.gameState.spot.battlefield.corpses?.find(
            unit => unit.uid === unitUid)!;
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
            if (!this._actionService.successfull(action.result)) {
                result.result.result = 'no success!';
            } else if (!this._actionService.hasEffect(action.result)) {
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
}
