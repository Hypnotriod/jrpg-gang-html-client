import Component from '../../Component';

export default class Button extends Component {
    private onClickCallback: (target: Button) => void;

    protected init(view: HTMLElement): Component {
        super.init(view);
        this.view.onclick = (event: MouseEvent) => {
            this.onClickCallback && this.onClickCallback(this);
        };
        return this;
    }

    public set onClick(callback: (target: Button) => void) {
        this.onClickCallback = callback;
    }
}
