import Component from '../../Component';

export default class Container extends Component {
    protected initialize(): void {
    }

    public set value(value: string) {
        this._view.innerHTML = value;
    }

    public get value(): string {
        return this._view.innerHTML;
    }
}
