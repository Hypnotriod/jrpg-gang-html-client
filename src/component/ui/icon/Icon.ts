import Component from '../../Component';
import ObjectDescription from '../popup/ObjectDescription';

export default class Icon extends Component {
    private onClickCallback: ((target: Icon) => void) | null;
    private onHoverCallback: ((target: Icon) => void) | null;
    private onLeaveCallback: ((target: Icon) => void) | null;
    private _selected: boolean = false;
    private _chosen: boolean = false;
    private _icon: string;
    private _descriptionPopup?: ObjectDescription;
    private _description: object;


    public set descriptionPopup(value: ObjectDescription) {
        this._descriptionPopup = value;
    }

    public get descriptionPopup(): ObjectDescription | undefined {
        return this._descriptionPopup;
    }

    public set description(value: object) {
        this._description = value;
    }

    public get description(): object {
        return this._description;
    }

    protected initialize(): void {
        this.view.onclick = (event: MouseEvent) => {
            if (!this._enabled) { return; }
            this.onClickCallback?.(this);
        };
        this.view.onmouseover = (event: MouseEvent) => {
            this.onHoverCallback?.(this);
            if (!this._descriptionPopup || !this._description) { return; }
            this._descriptionPopup.data = this._description;
            this._descriptionPopup.show();
        };
        this.view.onmouseleave = (event: MouseEvent) => {
            this.onLeaveCallback?.(this);
            if (!this._descriptionPopup || !this._description) { return; }
            this._descriptionPopup.hide();
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
        const iconComponent: Icon = parent.create(containerId, Icon, { classList: ['selection-icon'] })!;
        iconComponent.icon = icon;
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
        if (this._selected || !this._enabled) { return; }
        this._selected = true;
        this.view.classList.add('selected');
        this.view.classList.remove('unselected');
    }

    public unselect(): void {
        if (!this._selected || !this._enabled) { return; }
        this._selected = false;
        this.view.classList.remove('selected');
        this.view.classList.add('unselected');
    }

    public get selected(): boolean {
        return this._selected;
    }

    public choose(): void {
        if (this._chosen || !this._enabled) { return; }
        this._chosen = true;
        this.view.classList.add('chosen');
    }

    public unchoose(): void {
        if (!this._chosen) { return; }
        this._chosen = false;
        this.view.classList.remove('chosen');
    }

    public get chosen(): boolean {
        return this._chosen;
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

    public disable(): void {
        this._enabled = false;
        this.view.classList.add('red');
        this.view.classList.add('lighten-4');
    }

    public enable(): void {
        this._enabled = true;
        this.view.classList.remove('red');
        this.view.classList.remove('lighten-4');
    }
}
