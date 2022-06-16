import Component from '../../Component';

export default class TextField extends Component {
    public get value(): string {
        return this.view.innerHTML;
    }

    public set value(value: string) {
        this.view.innerHTML = value;
    }
}
