export default class Component {
    private readonly _view: HTMLElement;
    private readonly display: string;

    constructor(view: HTMLElement) {
        this._view = view;
        this.display = this._view.style.display;

        this.initialize();
    }

    protected initialize(): void {
    }

    protected get view(): HTMLElement {
        return this._view;
    }

    public instantiate<T extends Component>(id: string, clazz: new (view: HTMLElement) => T): T | null {
        const child: HTMLElement | null = this.findChild(id);
        return child ? new clazz(child) : null;
    }

    public show(): void {
        this._view.style.display = this.display || 'block';
    }

    public hide(): void {
        this._view.style.display = 'none';
    }

    public disable(): void {
        this._view.setAttribute('disabled', 'disabled');
    }

    public enable(): void {
        this._view.removeAttribute('disabled');
    }

    public findChild(id: string): HTMLElement | null {
        return this._view.querySelector(`#${id}`);
    }

    public setBackgroundColor(value: string): void {
        this._view.style.backgroundColor = value;
    }
}
