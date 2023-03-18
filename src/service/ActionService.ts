import { injectable, singleton } from 'tsyringe';
import { ActionResult } from '../domain/domain';

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
        return this.objectKeys(result.instantDamage)
            .concat(this.objectKeys(result.instantRecovery))
            .concat(this.objectKeys(result.temporalDamage))
            .concat(this.objectKeys(result.temporalModification));
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
