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

    protected nullOrEmptyArray(arr: Array<any>): boolean {
        return !arr || !arr.length;
    }
}
