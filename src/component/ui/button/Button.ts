import Component from '../../Component';

export default class Button extends Component {
    private onClickCallback: (target: Button) => void;

    protected initialize(): void {
        this.view.onclick = (event: MouseEvent) => {
            this.onClickCallback && this.onClickCallback(this);
        };
    }

    public set onClick(callback: (target: Button) => void) {
        this.onClickCallback = callback;
    }
}
