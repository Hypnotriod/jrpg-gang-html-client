import { injectable } from 'tsyringe';
import { UnitBooty } from '../../../domain/domain';
import GameObjectRenderer from '../../../service/GameObjectRenderer';
import { component } from '../../decorator/decorator';
import Container from '../container/Container';
import Label from '../label/Label';

@injectable()
export class DungeonLootPopup extends Container {
    private static readonly TIMEOUT_MS: number = 4000;

    @component('label_booty', Label)
    protected readonly labelBooty: Label;

    constructor(
        private readonly renderer: GameObjectRenderer,
    ) {
        super();
    }

    protected initialize(): void {
    }

    public override show(): void {
        super.show();
        window.setTimeout(() => {
            this.hide();
        }, DungeonLootPopup.TIMEOUT_MS);
    }

    public set booty(value: UnitBooty) {
        this.labelBooty.htmlValue =
            this.renderer.keyValueIcon('coins', 'coin', value.coins) +
            (value.ruby ? ('<br>' + this.renderer.keyValueIcon('ruby', 'ruby', value.ruby)) : '');
    }
}