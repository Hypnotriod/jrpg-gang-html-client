import { injectable, singleton } from 'tsyringe';
import { ActionResult, DamageImpact, GameUnit, Unit, UnitModificationImpact } from '../domain/domain';

@singleton()
@injectable()
export default class ActionService {
    public successfull(result: ActionResult): boolean {
        return !!result.instantDamage ||
            !!result.instantRecovery ||
            !!result.temporalDamage ||
            !!result.temporalModification;
    }

    public targets(result: ActionResult): number[] {
        const s: Set<number> = new Set([
            ...this.objectKeys(result.instantDamage),
            ...this.objectKeys(result.instantRecovery),
            ...this.objectKeys(result.temporalDamage),
            ...this.objectKeys(result.temporalModification),
        ]);
        return Array.from(s);
    }

    public hasAnyEffect(result: ActionResult): boolean {
        return !this.nullOrEmptyObject(result.instantDamage) ||
            !this.nullOrEmptyObject(result.instantRecovery) ||
            !this.nullOrEmptyObject(result.temporalDamage) ||
            !this.nullOrEmptyObject(result.temporalModification);
    }

    public hasEffect(result: ActionResult, unitUid: number): boolean {
        return !this.nullOrEmptyArray(result.instantDamage && result.instantDamage[unitUid]) ||
            !this.nullOrEmptyArray(result.instantRecovery && result.instantRecovery[unitUid]) ||
            !this.nullOrEmptyArray(result.temporalDamage && result.temporalDamage[unitUid]) ||
            !this.nullOrEmptyArray(result.temporalModification && result.temporalModification[unitUid]);
    }

    public hasRecovery(result: ActionResult, unitUid: number): boolean {
        return !this.nullOrEmptyArray(result.instantRecovery && result.instantRecovery[unitUid]) ||
            !this.nullOrEmptyArray(result.temporalModification && result.temporalModification[unitUid]);
    }

    public hasDamage(result: ActionResult, unitUid: number): boolean {
        return !this.nullOrEmptyArray(result.instantDamage && result.instantDamage[unitUid]) ||
            !this.nullOrEmptyArray(result.temporalDamage && result.temporalDamage[unitUid]);
    }

    protected hasCriticalMiss(result: ActionResult, unitUid: number): boolean {
        return !this.nullOrEmptyArray(result.instantDamage && result.instantDamage[unitUid]) && !!result.instantDamage![unitUid].find(d => d.isCriticalMiss) ||
            !this.nullOrEmptyArray(result.temporalDamage && result.temporalDamage[unitUid]) && !!result.temporalDamage![unitUid].find(d => d.isCriticalMiss);
    }

    public physicalInstantDamage(result: ActionResult, unitUid: number): number {
        return result.instantDamage && result.instantDamage[unitUid] ?
            result.instantDamage[unitUid].reduce((acc, d) => acc +
                (d.bleeding || 0) +
                (d.cold || 0) +
                (d.crushing || 0) +
                (d.cutting || 0) +
                (d.fire || 0) +
                (d.lightning || 0) +
                (d.poison || 0) +
                (d.stabbing || 0)
                , 0) : 0;
    }

    public attackChance(impact: DamageImpact[], unit: GameUnit, target: GameUnit): number {
        let chance = 100;
        if (impact[0]?.chance) {
            chance = impact[0].chance;
            chance += target.state.isStunned
                ? (this.attributeTotalValue(unit, 'agility') - unit.state.stress) - (this.attributeTotalValue(target, 'agility') - target.state.stress)
                : (this.attributeTotalValue(unit, 'agility') - unit.state.stress) + target.state.stress;
        }
        return Math.max(1, Math.min(100, chance));
    }

    public modificationChance(impact: UnitModificationImpact[], unit: GameUnit): number {
        let chance = 100;
        if (impact[0]?.chance) {
            chance = impact[0].chance;
            chance += (this.attributeTotalValue(unit, 'intelligence') - unit.state.stress);
        }
        return Math.max(1, Math.min(100, chance));
    }

    public baseAttributeTotalValue(unit: Unit, fieldName: string): number {
        let result = unit.stats.baseAttributes[fieldName] ?? 0;
        result += (unit.modification?.reduce((acc, m) => acc + (m.baseAttributes?.[fieldName] ?? 0), 0) ?? 0);
        unit.inventory.armor?.filter(a => a.equipped).forEach(a => {
            result += a.modification?.reduce((acc, m) => acc + (m.baseAttributes?.[fieldName] ?? 0), 0) ?? 0;
        });
        unit.inventory.weapon?.filter(w => w.equipped).forEach(w => {
            result += w.modification?.reduce((acc, m) => acc + (m.baseAttributes?.[fieldName] ?? 0), 0) ?? 0;
        });
        if (fieldName === 'actionPoints') {
            result += Math.floor(unit.stats.attributes.initiative / 10)
        }
        return result;
    }

    public attributeTotalValue(unit: Unit, fieldName: string): number {
        let result = unit.stats.attributes[fieldName] ?? 0;
        result += (unit.modification?.reduce((acc, m) => acc + (m.attributes?.[fieldName] ?? 0), 0) ?? 0);
        unit.inventory.armor?.filter(a => a.equipped).forEach(a => {
            result += a.modification?.reduce((acc, m) => acc + (m.attributes?.[fieldName] ?? 0), 0) ?? 0;
        });
        unit.inventory.weapon?.filter(w => w.equipped).forEach(w => {
            result += w.modification?.reduce((acc, m) => acc + (m.attributes?.[fieldName] ?? 0), 0) ?? 0;
        });
        return result;
    }

    protected objectKeys(obj?: object): number[] {
        return obj ? Object.keys(obj).map(v => Number(v)) : [];
    }

    protected nullOrEmptyObject(obj?: object): boolean {
        return !obj || !Object.keys(obj).length;
    }

    protected nullOrEmptyArray(arr?: Array<any>): boolean {
        return !arr || !arr.length;
    }
}
