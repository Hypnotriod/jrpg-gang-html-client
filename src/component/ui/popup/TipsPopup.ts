import { injectable, singleton } from 'tsyringe';
import { component } from '../../decorator/decorator';
import Button from '../button/Button';
import Container from '../container/Container';
import { GAME_TIPS, GameTipKey } from '../../../constants/Tips';
import Label from '../label/Label';
import { StorageService } from '../../../service/StorageService';

type Tip = {
    key: GameTipKey;
    message: string;
}

@injectable()
@singleton()
export class TipsPopup extends Container {
    protected _active: boolean = true;
    protected _queue: Tip[] = [];
    protected _currentTip?: Tip;
    protected _shadow?: Container;

    @component('button_ok', Button)
    protected readonly buttonOk: Button;
    @component('message_label', Label)
    protected readonly messageLabel: Label;

    constructor(protected readonly storage: StorageService) {
        super();
    }

    public get active(): boolean {
        return this._active;
    }

    public set active(value: boolean) {
        this._active = value;
        if (!this._active) {
            this.clearQueue();
        }
    }

    public clearQueue(): void {
        this._queue = [];
        this._currentTip = undefined;
        this.hide();
    }

    public override show(): void {
        super.show();
        this._shadow?.show();
    }

    public override hide(): void {
        super.hide();
        this._shadow?.hide();
    }

    public set shadow(value: Container) {
        this._shadow = value;
    }

    public showTip(key: GameTipKey): void {
        if (this.storage.getItem(key) || this._queue.some(tip => tip.key === key) || !this._active) return;
        const message = GAME_TIPS[key];
        if (!message) return;
        this._queue.push({ key, message });
        if (!this.visible) {
            this.nextTip();
        }
    }

    protected nextTip(): void {
        if (!this._queue.length) return;
        this.show();
        this._currentTip = this._queue[0];
        this.messageLabel.htmlValue = this._currentTip.message;
    }

    protected initialize(): void {
        this.buttonOk.onClick = () => {
            this.hide();
            this._queue.shift();
            this.storage.setItem(this._currentTip!.key, 'shown');
            this.nextTip();
        };
        this.hide();
    }
}