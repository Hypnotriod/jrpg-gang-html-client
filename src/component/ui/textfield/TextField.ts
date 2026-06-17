import Component from '../../Component';

export default class TextField extends Component {
    protected _autoScroll: boolean = false;

    protected initialize(): void {
    }

    public get autoScroll(): boolean {
        return this._autoScroll;
    }

    public set autoScroll(value: boolean) {
        this._autoScroll = value;
    }

    public get value(): string {
        return this.view.innerHTML;
    }

    public set value(value: string) {
        const needScroll = this._autoScroll && this.view.scrollTop + this.view.clientHeight >= this.view.scrollHeight - 1;
        this.view.innerHTML = value;
        if (needScroll) {
            this.view.scrollTop = this.view.scrollHeight;
        }
    }
}
