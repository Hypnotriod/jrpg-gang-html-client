import { injectable } from 'tsyringe';
import { ACHIEVEMENTS } from '../../constants/AchievementInfo';
import { ICON, LABEL_DESCRIPTION } from '../../constants/Components';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Icon from '../ui/icon/Icon';
import Label from '../ui/label/Label';
import { SoundName, SoundService } from '../../service/SoundService';

@injectable()
export class AchievementPopup extends Component {
    private static readonly TIMEOUT_MS: number = 6000;

    @component(ICON, Icon)
    protected readonly icon: Icon;
    @component(LABEL_DESCRIPTION, Label)
    protected readonly labelDescription: Label;

    private queue: string[] = [];

    protected initialize(): void {
    }

    public pop(code: string): void {
        this.queue.push(code);
        this.queue.length === 1 && this.popNext();
    }

    private popNext(): void {
        const code = this.queue[0];
        const achievement = ACHIEVEMENTS[code];
        if (!achievement) {
            this.queue.shift();
            this.hide();
            this.queue.length && this.popNext();
            return;
        }
        this.icon.icon = achievement.icon;
        this.labelDescription.value = achievement.popup;
        this.show();
        SoundService.play(SoundName.ACHIEVEMENT);
        setTimeout(() => {
            this.hide();
            setTimeout(() => {
                this.queue.shift();
                this.queue.length && this.popNext();
            }, 500);
        }, AchievementPopup.TIMEOUT_MS);
    }
}
