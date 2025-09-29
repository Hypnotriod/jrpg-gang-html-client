import Component from '../../Component';
import ObjectDescription from '../popup/ObjectDescription';

export default class Label extends Component {
    private _descriptionPopup?: ObjectDescription;
    private _description: object;

    protected initialize(): void {
        this.view.onmouseover = (event: MouseEvent) => this.onHover();
        this.view.onmouseleave = (event: MouseEvent) => this.onLeave();
    }

    protected onHover(): void {
        if (!this._descriptionPopup || !this._description) { return; }
        this._descriptionPopup.data = this._description;
        this._descriptionPopup.show();
    }

    protected onLeave(): void {
        if (!this._descriptionPopup || !this._description) { return; }
        this._descriptionPopup.hide();
    }

    public get view(): HTMLTextAreaElement {
        return this._view as HTMLTextAreaElement;
    }

    public get value(): string {
        return this.view.textContent!;
    }

    public set value(value: string) {
        this.view.textContent = value;
    }

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
}
