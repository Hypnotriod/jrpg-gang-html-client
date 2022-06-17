import Component from '../../Component';

export default class TextField extends Component {
    protected initialize(): void {
    }

    public get value(): string {
        return this.view.innerHTML;
    }

    public set value(value: string) {
        this.view.innerHTML = value;
    }
}
