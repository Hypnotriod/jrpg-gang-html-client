import Component from '../../Component';

export default class Icon extends Component {
    private onClickCallback: ((target: Icon) => void) | null;
    private onHoverCallback: ((target: Icon) => void) | null;
    private onLeaveCallback: ((target: Icon) => void) | null;
    private _selected: boolean = false;
    private _icon: string;

    protected initialize(): void {
        this.view.onclick = (event: MouseEvent) => {
            this.onClickCallback && this.onClickCallback(this);
        };
        this.view.onmouseover = (event: MouseEvent) => {
            this.onHoverCallback && this.onHoverCallback(this);
        };
        this.view.onmouseleave = (event: MouseEvent) => {
            this.onLeaveCallback && this.onLeaveCallback(this);
        };
        this.view.classList.add('unselected');
    }

    public destroy(): void {
        this.onClickCallback = null;
        this.onHoverCallback = null;
        this.onLeaveCallback = null;
        this.view.onclick = null;
        this.view.onmouseover = null;
        super.destroy();
    }

    public static createIcon(icon: string, parent: Component, containerId: string): Icon | null {
        const iconComponent: Icon | null = parent.create(containerId, null, Icon);
        if (iconComponent) {
            iconComponent.icon = icon;
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

    public set onHover(callback: (target: Icon) => void) {
        this.onHoverCallback = callback;
    }

    public set onLeave(callback: (target: Icon) => void) {
        this.onLeaveCallback = callback;
    }
}
