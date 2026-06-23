import { injectable } from 'tsyringe';
import { component } from '../../decorator/decorator';
import Button from '../button/Button';
import Container from '../container/Container';

@injectable()
export class InstructionsPopup extends Container {
    protected _onHide?: (() => void) | undefined;
    protected _shadow?: Container;

    @component('button_ok', Button)
    protected readonly buttonOk: Button;

    public set onHide(value: (() => void) | undefined) {
        this._onHide = value;
    }

    public override show(): void {
        super.show();
        this._shadow?.show();
    }

    public override hide(): void {
        super.hide();
        this._shadow?.hide();
        this._onHide?.();
    }

    public set shadow(value: Container) {
        this._shadow = value;
    }

    protected initialize(): void {
        this.buttonOk.onClick = () => this.hide();
    }
}