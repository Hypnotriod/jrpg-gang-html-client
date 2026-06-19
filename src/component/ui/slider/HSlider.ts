import Component from '../../Component';

export default class HSlider extends Component {
    private onChangeCallback: ((target: HSlider) => void) | null;

    override get view(): HTMLInputElement {
        return this._view as HTMLInputElement;
    }

    protected initialize(): void {
        this.view.oninput = () => {
            this.onChangeCallback?.(this);
        }
    }

    public set onChange(callback: (target: HSlider) => void) {
        this.onChangeCallback = callback;
    }

    public get value(): number {
        return Number(this.view.value);
    }

    public set value(value: number) {
        this.view.value = String(value);
        this.onChangeCallback?.(this);
    }

    public get min(): number {
        return Number(this.view.min);
    }

    public set min(value: number) {
        this.view.min = String(value);
        this.onChangeCallback?.(this);
    }

    public get max(): number {
        return Number(this.view.max);
    }

    public set max(value: number) {
        this.view.max = String(value);
        this.onChangeCallback?.(this);
    }
}