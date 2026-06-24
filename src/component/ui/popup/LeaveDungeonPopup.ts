import { injectable } from 'tsyringe';
import { UnitBooty } from '../../../domain/domain';
import GameObjectRenderer from '../../../service/GameObjectRenderer';
import { component } from '../../decorator/decorator';
import Container from '../container/Container';
import Label from '../label/Label';
import Button from '../button/Button';
import { LABEL_DESCRIPTION } from '../../../constants/Components';

@injectable()
export class LeaveDungeonPopup extends Container {
    @component('label_booty', Label)
    protected readonly labelBooty: Label;
    @component('button_yes', Button)
    protected readonly yesButton: Button;
    @component('button_no', Button)
    protected readonly noButton: Button;
    @component(LABEL_DESCRIPTION, Label)
    protected readonly labelDescription: Label;

    protected onYesCallback: (() => void) | null;
    protected _shadow?: Container;

    constructor(
        private readonly renderer: GameObjectRenderer,
    ) {
        super();
    }

    protected initialize(): void {
        this.noButton.onClick = () => {
            this.hide();
        }
        this.yesButton.onClick = () => {
            this.hide();
            this.onYesCallback?.();
        }
    }

    public override show(): void {
        super.show();
        this._shadow?.show();
    }

    public override hide(): void {
        super.hide();
        this._shadow?.hide();
    }

    public set onYes(value: (() => void) | null) {
        this.onYesCallback = value;
    }

    public set shadow(value: Container) {
        this._shadow = value;
    }

    public set booty(value: UnitBooty | undefined) {
        if (value) {
            this.labelDescription.value = 'Take your share and leave?';
            this.labelBooty.htmlValue =
                this.renderer.keyValueIcon('coins', 'coin', value.coins) +
                (value.ruby ? ('<br>' + this.renderer.keyValueIcon('ruby', 'ruby', value.ruby)) : '');
        } else {
            this.labelDescription.value = 'Abandon the Dungeon?';
            this.labelBooty.htmlValue = 'All the loot will be lost';
        }
    }
}