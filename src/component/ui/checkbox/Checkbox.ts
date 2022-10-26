import Component from '../../Component';

export default class Checkbox extends Component {
    private onChangeCallback: ((target: Checkbox) => void) | null;

    protected initialize(): void {
        (this.view as HTMLInputElement).onchange = (event: MouseEvent) => {
            this.onChangeCallback && this.onChangeCallback(this);
            event.stopPropagation();
        };
    }

    public set onChange(callback: (target: Checkbox) => void) {
        this.onChangeCallback = callback;
    }

    public destroy(): void {
        this.onChangeCallback = null;
        this.view.onclick = null;
        super.destroy();
    }

    public get checked(): boolean {
        return (this.view as HTMLInputElement).checked;
    }
    public set checked(value: boolean) {
        (this.view as HTMLInputElement).checked = value;
    }
}