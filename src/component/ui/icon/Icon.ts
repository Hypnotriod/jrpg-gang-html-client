import Component from '../../Component';

export default class Icon extends Component {
    private onClickCallback: (target: Icon) => void;
    private _selected: boolean = false;
    private _icon: string;
    private _uid: number;

    protected initialize(): void {
        this.view.onclick = (event: MouseEvent) => {
            this.onClickCallback && this.onClickCallback(this);
        };
        this.view.classList.add('unselected');
    }

    public static createIcon(icon: string, uid: number, parent: Component, containerId: string): Icon | null {
        const iconComponent: Icon | null = parent.create(containerId, Icon);
        if (iconComponent) {
            iconComponent.icon = icon;
            iconComponent.uid = uid;
            iconComponent.view.classList.add('selection-icon');
        }
        return iconComponent;
    }

    public set icon(value: string) {
        this._icon = value;
        this.backgroundImage = `assets/icons/${value}.png`;
    }

    public get icon(): string {
        return this._icon;
    }

    public set uid(value: number) {
        this._uid = this.uid;
    }

    public get uid(): number {
        return this._uid;
    }

    public select(): void {
        if (this._selected) { return; }
        this._selected = true;
        this.view.classList.add('selected');
        this.view.classList.remove('unselected');
    }

    public unselect(): void {
        if (!this._selected) { return; }
        this._selected = false;
        this.view.classList.remove('selected');
        this.view.classList.add('unselected');
    }

    public get selected(): boolean {
        return this._selected;
    }

    public set onClick(callback: (target: Icon) => void) {
        this.onClickCallback = callback;
    }
}
