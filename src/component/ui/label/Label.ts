import Component from '../../Component';

export default class Label extends Component {
    protected get view(): HTMLTextAreaElement {
        return this.view as HTMLTextAreaElement;
    }

    public get value(): string {
        return this.view.textContent!;
    }

    public set value(value: string) {
        this.view.textContent = value;
    }
}
