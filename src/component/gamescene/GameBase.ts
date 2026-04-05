import { ActionResult, ActionResultType, ActionType, ChatState, EndRoundResult, GamePhase, GameUnit, GameUnitActionResult, Item, SpotCompleteResult, UnitInventory } from '../../domain/domain';
import ActionService from '../../service/ActionService';
import GameStateService from '../../service/GameStateService';
import Component from '../Component';

export default class GameBase extends Component {
    protected chatState: ChatState;

    constructor(
        private readonly _state: GameStateService,
        private readonly _actionService: ActionService) {
        super();
    }

    protected initialize(): void {
    }

    protected canDoUnitConfiguration(): boolean {
        return this.canDoAction() ||
            this._state.gameState.nextPhase === GamePhase.PREPARE_UNIT ||
            this._state.gameState.nextPhase === GamePhase.SPOT_COMPLETE;
    }

    protected canUseItem(): boolean {
        return this.canDoAction() || this._state.gameState.nextPhase === GamePhase.SPOT_COMPLETE;
    }

    protected canDoAction(): boolean {
        return this._state.gameState.nextPhase === GamePhase.TAKE_ACTION;
    }

    public playersUnit(): GameUnit {
        return this.findUnitByUid(this._state.playerInfo?.unitUid ?? 0);
    }

    protected allActors(): GameUnit[] {
        return this._state.gameState.spot.battlefield.units?.filter(unit => Boolean(unit.playerInfo)) ?? [];
    }

    protected allEnemyIsDefeated(): boolean {
        return (this._state.gameState.spot.battlefield.units ?? []).length === this.allActors().length;
    }

    protected currentUnit(): GameUnit | null {
        const uid: number = this._state.gameState.state.activeUnitsQueue[0];
        if (!uid) { return null; }
        return this.findUnitByUid(uid);
    }

    public isCurrentUnitTurn(): boolean {
        const activeUnitUid = this._state.gameState.state.activeUnitsQueue[0];
        return Boolean(this._state.playerInfo?.unitUid === activeUnitUid);
    }

    protected isCurrentPlayerId(playerId: string): boolean {
        return this._state.playerInfo?.playerId === playerId;
    }

    protected isCurrentPlayerUnitId(uid: number): boolean {
        return this._state.playerInfo?.unitUid === uid;
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

    protected distinguishEndRoundResult(endRound: EndRoundResult): object {
        const result: any = {};
        endRound.damage && Object.keys(endRound.damage).forEach(key => {
            result.damage = result.damage || {};
            const unit = this.findUnitByUid(Number(key));
            result.damage[this.getUnitName(unit)] = endRound.damage![Number(key)];
        });
        endRound.recovery && Object.keys(endRound.recovery).forEach(key => {
            result.recovery = result.recovery || {};
            const unit = this.findUnitByUid(Number(key));
            result.recovery[this.getUnitName(unit)] = endRound.recovery![Number(key)];
        });
        endRound.experience && Object.keys(endRound.experience).forEach(key => {
            result.experience = result.experience || {};
            const unit = this.findUnitByUid(Number(key));
            result.experience[this.getUnitName(unit)] = endRound.experience![Number(key)];
        });
        endRound.drop && Object.keys(endRound.drop).forEach(key => {
            result.drop = result.drop || {};
            const unit = this.findUnitByUid(Number(key));
            result.drop[this.getUnitName(unit)] = endRound.drop![Number(key)];
        });
        endRound.achievements && Object.keys(endRound.achievements).forEach(key => {
            result.achievements = result.achievements || {};
            const unit = this.findUnitByUid(Number(key));
            result.achievements[this.getUnitName(unit)] = endRound.achievements![Number(key)];
        });
        if (endRound.achievements) {
            result.achievements = endRound.achievements;
        }
        return result;
    }

    protected distinguishSpotCompleteResultResult(spotComplete: SpotCompleteResult): object {
        const result: any = {};
        spotComplete.experience && Object.keys(spotComplete.experience).forEach(key => {
            result.experience = result.experience || {};
            const unit = this.findUnitByUid(Number(key));
            result.experience[this.getUnitName(unit)] = spotComplete.experience![Number(key)];
        });
        if (spotComplete.booty) {
            result.booty = spotComplete.booty;
        }
        spotComplete.achievements && Object.keys(spotComplete.achievements).forEach(key => {
            result.achievements = result.achievements || {};
            const unit = this.findUnitByUid(Number(key));
            result.achievements[this.getUnitName(unit)] = spotComplete.achievements![Number(key)];
        });
        return result;
    }

    protected distinguishUnitActionResult(action: GameUnitActionResult): object {
        const result: any = {
            action: { ...action.action },
            result: { ...action.result },
        };
        const actionResult: ActionResult = action.result;
        if (action.action.action === ActionType.USE &&
            actionResult.result === ActionResultType.ACCOMPLISHED) {
            if (!this._actionService.successfull(actionResult)) {
                result.result.result = 'no success!';
            } else if (!this._actionService.hasAnyEffect(actionResult)) {
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
        if (actionResult.experience) {
            const experience = { ...actionResult.experience };
            result.result.experience = {};
            Object.keys(experience).forEach(key => {
                const unit = this.findUnitByUid(Number(key));
                result.result.experience[this.getUnitName(unit)] = experience[Number(key)];
            });
        }
        if (actionResult.instantDamage) {
            const instantDamage = { ...actionResult.instantDamage };
            result.result.instantDamage = {};
            Object.keys(instantDamage).forEach(key => {
                const unit = this.findUnitByUid(Number(key));
                result.result.instantDamage[this.getUnitName(unit)] = instantDamage[Number(key)];
            });
        }
        if (actionResult.temporalDamage) {
            const temporalDamage = { ...actionResult.temporalDamage };
            result.result.temporalDamage = {};
            Object.keys(temporalDamage).forEach(key => {
                const unit = this.findUnitByUid(Number(key));
                result.result.temporalDamage[this.getUnitName(unit)] = temporalDamage[Number(key)];
            });
        }
        if (actionResult.instantRecovery) {
            const instantRecovery = { ...actionResult.instantRecovery };
            result.result.instantRecovery = {};
            Object.keys(instantRecovery).forEach(key => {
                const unit = this.findUnitByUid(Number(key));
                result.result.instantRecovery[this.getUnitName(unit)] = instantRecovery[Number(key)];
            });
        }
        if (actionResult.temporalModification) {
            const temporalModification = { ...actionResult.temporalModification };
            result.result.temporalModification = {};
            Object.keys(temporalModification).forEach(key => {
                const unit = this.findUnitByUid(Number(key));
                result.result.temporalModification[this.getUnitName(unit)] = temporalModification[Number(key)];
            });
        }
        if (actionResult.drop) {
            const drop = { ...actionResult.drop };
            result.result.drop = {};
            Object.keys(drop).forEach(key => {
                const unit = this.findUnitByUid(Number(key));
                result.result.drop[this.getUnitName(unit)] = drop[Number(key)];
            });
        }
        if (actionResult.achievements) {
            const achievements = { ...actionResult.achievements };
            result.result.achievements = {};
            Object.keys(achievements).forEach(key => {
                const unit = this.findUnitByUid(Number(key));
                result.result.achievements[this.getUnitName(unit)] = achievements[Number(key)];
            });
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
            ...(inventory.provision || []),
        ];
        return inventoryItems.find(i => i.uid === uid);
    }
}
