import { injectable, singleton } from 'tsyringe';
import GameStateService from './GameStateService';
import ActionService from './ActionService';
import { ActionResult, ActionResultType, ActionType, EndRoundResult, GamePhase, GameUnit, GameUnitActionResult, Item, SpotCompleteResult, UnitInventory } from '../domain/domain';

@injectable()
@singleton()
export default class GameLogRenderer {

    constructor(private readonly _state: GameStateService,
        private readonly _actionService: ActionService) {
    }

    protected getUnitName(unit: GameUnit): string {
        return unit.playerInfo ? `${unit.name} (${unit.playerInfo.nickname})` : (`${unit.name}`);
    }

    protected findUnitByUid(unitUid: number): GameUnit {
        return this._state.gameState.spot.battlefield.units?.find(unit => unit.uid === unitUid)
            ?? this._state.gameState.spot.battlefield.corpses?.find(unit => unit.uid === unitUid)!;
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

    protected distinguishEndRoundResult(endRound: EndRoundResult): any {
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

    protected distinguishSpotCompleteResultResult(spotComplete: SpotCompleteResult): any {
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

    protected distinguishUnitActionResult(action: GameUnitActionResult): any {
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

    public renderSpotCompleteResult(endRoundResult: EndRoundResult): string {
        let result = '';
        const data = this.distinguishSpotCompleteResultResult(endRoundResult);
        if (data.experience) {
            result += this.brPrefix(result) + Object.keys(data.experience).map(target => {
                const exp = data.experience[target];
                return `${target} gains ${exp} experience.`;
            }).join('<br>');
        }
        if (data.booty) {
            result += this.brPrefix(result);
            const booty = Object.keys(data.booty).map(k => `${data.booty[k]} ${k}`);
            result += `The party receives ${booty.join(', ')} of loot.`;
        }
        result += this.brPrefix(result) + 'Level cleared!';
        return result;
    }

    public renderEndRoundResult(endRoundResult: EndRoundResult): string {
        let result = '';
        const data = this.distinguishEndRoundResult(endRoundResult);
        if (data.damage) {
            result += this.brPrefix(result) + Object.keys(data.damage).map(target => {
                const damage = data.damage[target];
                const d = Object.keys(data.damage[target])
                    .filter(k => damage[k] !== 0 && Number.isInteger(damage[k])).map(k => `${damage[k]} ${k}`);
                return `${target} takes ${d.join(', ')} damage.`;
            }).join('<br>');
        }
        if (data.recovery) {
            result += this.brPrefix(result) + Object.keys(data.recovery).map(target => {
                const recovery = data.recovery[target];
                const r = Object.keys(data.recovery[target])
                    .filter(k => recovery[k] !== 0 && Number.isInteger(recovery[k])).map(k => `${recovery[k]} ${k}`);
                return `${target} restores ${r.join(', ')}.`;
            }).join('<br>');
        }
        endRoundResult.damage && Object.keys(endRoundResult.damage).forEach(k => {
            const targetUnit = this.findUnitByUid(Number(k));
            const name: string = this.getUnitName(targetUnit);
            if (targetUnit?.isDead !== true && endRoundResult.damage![Number(k)].withStun) {
                result += this.brPrefix(result) + `${name} is stunned.`;
            }
            if (targetUnit?.isDead) {
                result += this.brPrefix(result) + `${name} is defeated.`;
            }
        });
        if (data.experience) {
            result += this.brPrefix(result) + Object.keys(data.experience).map(target => {
                const exp = data.experience[target];
                return `${target} gains ${exp} experience.`;
            }).join('<br>');
        }
        if (data.drop) {
            result += this.brPrefix(result) + Object.keys(data.drop).map(target => {
                const drop = data.drop[target];
                const d = Object.keys(data.drop[target])
                    .filter(k => drop[k] !== 0 && Number.isInteger(drop[k])).map(k => `${drop[k]} ${k}`);
                return `${target} drops ${d.join(', ')}.`;
            }).join('<br>');
        }
        return result;
    }

    public renderUnitActionResult(action: GameUnitActionResult): string {
        const unit: GameUnit = this.findUnitByUid(action.action.uid!)!;
        const name: string = this.getUnitName(unit);
        const data = this.distinguishUnitActionResult(action);
        if (action.result.result !== ActionResultType.ACCOMPLISHED) {
            switch (action.result.result) {
                case ActionResultType.CANT_USE:
                    return `<span class="red-text darken-3">Can't use</span>`;
                case ActionResultType.IS_BROKEN:
                    return `<span class="red-text darken-3">Item is broken</span>`;
                case ActionResultType.NOT_ALLOWED:
                    return `<span class="red-text darken-3">Not allowed</span>`;
                case ActionResultType.NOT_EMPTY:
                    return `<span class="red-text darken-3">Not empty</span>`;
                case ActionResultType.NOT_EUIPPED:
                    return `<span class="red-text darken-3">Not equipped</span>`;
                case ActionResultType.NOT_REACHABLE:
                    return `<span class="red-text darken-3">Can't reach</span>`;
                case ActionResultType.NOT_ACCOMPLISHED:
                    return `<span class="red-text darken-3">Not accomplished</span>`;
                case ActionResultType.NOT_FOUND:
                    return `<span class="red-text darken-3">Not found</span>`;
                case ActionResultType.NO_AMMUNITION:
                    return `<span class="red-text darken-3">No ammunition</span>`;
            }
            return '';
        }
        switch (action.action.action) {
            case ActionType.EQUIP:
                return `${name} equips ${data.action.item}.`;
            case ActionType.UNEQUIP:
                return `${name} unequips ${data.action.item}.`;
            case ActionType.PLACE:
            case ActionType.MOVE:
                return this._state.gameState.nextPhase === GamePhase.RETREAT_ACTION ?
                    `${name} runs in panic.` : `${name} moves.`;
            case ActionType.WAIT:
                return `${name} waits.`;
            case ActionType.SKIP:
                return `${name} skips.`;
            case ActionType.USE:
                return this.renderUseAction(name, action, data);
        }
        return '';
    }

    protected renderUseAction(name: string, action: GameUnitActionResult, data: any): string {
        let result = '';
        new Set([
            ...Object.keys(action.result.instantDamage || {}).map(k => Number(k)),
            ...Object.keys(action.result.temporalDamage || {}).map(k => Number(k)),
        ]).forEach(targetUid => {
            if (!this._actionService.hasEffect(action.result, targetUid)) {
                const targetUnit = this.findUnitByUid(targetUid);
                result += this.brPrefix(result) + `${name} misses ${this.getUnitName(targetUnit)}.`;
            }
        })
        if (data.result.instantDamage) {
            result += Object.keys(data.result.instantDamage).map(target => {
                const damages = data.result.instantDamage[target] as any[];
                const damage = damages.flatMap(d => Object.keys(d)
                    .filter(k => Number.isInteger(d[k])).map(k => `${d[k]} ${k}`));
                if (!damage.length) return '';
                return `${name} deals ${damage.join(', ')} damage to ${target}.`;
            }).filter(s => s).join('<br>');
        }
        if (data.result.temporalDamage) {
            const temporalDamage = Object.keys(data.result.temporalDamage)
                .map(target => {
                    const damage = data.result.temporalDamage[target] as any[];
                    if (!damage.length) return '';
                    return damage.flatMap(d => {
                        const damage = Object.keys(d).filter(k => k !== 'duration' && Number.isInteger(d[k])).map(k => `${d[k]} ${k}`)
                        return `${name} deals ${damage.join(', ')} damage to ${target} for ${d.duration} rounds.`;
                    }).filter(s => s).join('<br>');
                }).filter(s => s);
            if (temporalDamage.length) {
                result += this.brPrefix(result) + temporalDamage.join('<br>');
            }
        }
        if (data.result.instantRecovery) {
            const recovery = Object.keys(data.result.instantRecovery).map(target => {
                const recoveries = data.result.instantRecovery[target] as any[];
                const recovery = recoveries.flatMap(r => Object.keys(r)
                    .filter(k => r[k] !== 0 && Number.isInteger(r[k])).map(k => `${r[k]} ${k}`));
                if (!recovery.length) return '';
                return `${name} restores ${recovery.join(', ')} to ${target}.`;
            }).filter(s => s).join('<br>');
            if (recovery) {
                result += this.brPrefix(result) + recovery;
            }
        }
        if (data.result.temporalModification) {
            const modification = Object.keys(data.result.temporalModification).map(target => {
                return (data.result.temporalModification[target] as any[]).flatMap(r => {
                    let result = '';
                    const duration = r.duration;
                    if (r.recovery) {
                        const recovery = Object.keys(r.recovery)
                            .filter(k => r.recovery[k] !== 0 && Number.isInteger(r.recovery[k])).map(k => `${r.recovery[k]} ${k}`);
                        result += this.brPrefix(result) + `${name} adds ${recovery.join(', ')} of recovery to ${target} for ${duration} rounds.`;
                    }
                    if (r.damage) {
                        const damage = Object.keys(r.damage)
                            .filter(k => r.damage[k] !== 0 && Number.isInteger(r.damage[k])).map(k => `${r.damage[k]} ${k}`);
                        result += this.brPrefix(result) + `${name} adds ${damage.join(', ')} of damage to ${target} for ${duration} rounds.`;
                    }
                    if (r.attributes) {
                        const attributes = Object.keys(r.attributes)
                            .filter(k => r.attributes[k] !== 0 && Number.isInteger(r.attributes[k])).map(k => `${r.attributes[k]} ${k}`);
                        result += this.brPrefix(result) + `${name} adds ${attributes.join(', ')} attributes to ${target} for ${duration} rounds.`;
                    }
                    if (r.baseAttributes) {
                        const baseAttributes = Object.keys(r.baseAttributes)
                            .filter(k => r.baseAttributes[k] !== 0 && Number.isInteger(r.baseAttributes[k])).map(k => `${r.baseAttributes[k]} ${k}`);
                        result += this.brPrefix(result) + `${name} adds ${baseAttributes.join(', ')} attributes to ${target} for ${duration} rounds.`;
                    }
                    if (r.resistance) {
                        const resistance = Object.keys(r.resistance)
                            .filter(k => r.resistance[k] !== 0 && Number.isInteger(r.resistance[k])).map(k => `${r.resistance[k]} ${k}`);
                        result += this.brPrefix(result) + `${name} adds ${resistance.join(', ')} resistance to ${target} for ${duration} rounds.`;
                    }
                    return result;
                }).filter(s => s).join('<br>');
            }).filter(s => s).join('<br>');
            if (modification) {
                result += this.brPrefix(result) + modification;
            }
        }
        action.result.instantDamage && Object.keys(action.result.instantDamage).forEach(k => {
            const targetUnit = this.findUnitByUid(Number(k));
            const name: string = this.getUnitName(targetUnit);
            if (targetUnit?.isDead !== true && action.result.instantDamage![Number(k)].some(d => d.withStun)) {
                result += this.brPrefix(result) + `${name} is stunned.`;
            }
            if (targetUnit?.isDead) {
                result += this.brPrefix(result) + `${name} is defeated.`;
            }
        });
        if (data.result.experience) {
            result += this.brPrefix(result) + Object.keys(data.result.experience).map(target => {
                const exp = data.result.experience[target];
                return `${target} gains ${exp} experience.`;
            }).join('<br>');
        }
        if (data.result.drop) {
            result += this.brPrefix(result) + Object.keys(data.result.drop).map(target => {
                const drop = data.result.drop[target];
                const d = Object.keys(data.result.drop[target])
                    .filter(k => drop[k] !== 0 && Number.isInteger(drop[k])).map(k => `${drop[k]} ${k}`);
                return `${target} drops ${d.join(', ')}.`;
            }).join('<br>');
        }
        return result;
    }

    protected brPrefix(str: string): string {
        return (str.length ? '<br>' : '');
    }
}