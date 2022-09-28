import { injectable, singleton } from 'tsyringe';
import { ActionResult, Damage } from '../domain/domain';

@singleton()
@injectable()
export default class ActionService {
    public successfull(result: ActionResult): boolean {
        return !!result.instantDamage ||
            !!result.instantRecovery ||
            !!result.temporalDamage ||
            !!result.temporalModification;
    }

    public hasEffect(result: ActionResult): boolean {
        return !this.nullOrEmptyArray(result.instantDamage) ||
            !this.nullOrEmptyArray(result.instantRecovery) ||
            !this.nullOrEmptyArray(result.temporalDamage) ||
            !this.nullOrEmptyArray(result.temporalModification);
    }

    public hasRecovery(result: ActionResult): boolean {
        return !this.nullOrEmptyArray(result.instantRecovery) ||
            !this.nullOrEmptyArray(result.temporalModification);
    }

    public hasDamage(result: ActionResult): boolean {
        return !this.nullOrEmptyArray(result.instantDamage) ||
            !this.nullOrEmptyArray(result.temporalDamage);
    }


    public physicalInstantDamage(result: ActionResult): number {
        return result.instantDamage ? result.instantDamage.reduce((acc, d) =>
            acc + (d.bleeding || 0) +
            acc + (d.cold || 0) +
            acc + (d.crushing || 0) +
            acc + (d.cutting || 0) +
            acc + (d.fire || 0) +
            acc + (d.lighting || 0) +
            acc + (d.poison || 0) +
            acc + (d.stabbing || 0)
            , 0) : 0;
    }

    protected nullOrEmptyArray(arr: Array<any>): boolean {
        return !arr || !arr.length;
    }
}
