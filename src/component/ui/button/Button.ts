import Component from '../../Component';
import { SoundName, SoundService } from '../../../service/SoundService';

export default class Button extends Component {
    private onClickCallback: ((target: Button) => void) | null;

    protected initialize(): void {
        this.view.onclick = (event: MouseEvent) => {
            SoundService.play(SoundName.CLICK);
            this.onClickCallback && this.onClickCallback(this);
            event.stopPropagation();
        };
    }

    public set onClick(callback: (target: Button) => void) {
        this.onClickCallback = callback;
    }

    public destroy(): void {
        this.onClickCallback = null;
        this.view.onclick = null;
        super.destroy();
    }
}
