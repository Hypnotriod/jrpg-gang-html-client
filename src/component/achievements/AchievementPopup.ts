import { injectable } from 'tsyringe';
import { ACHIEVEMENTS } from '../../constants/AchievementInfo';
import { ICON, LABEL_DESCRIPTION, LABEL_REQUIREMENTS } from '../../constants/Components';
import { GameUnit } from '../../domain/domain';
import { SoundName, SoundService } from '../../service/SoundService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Icon from '../ui/icon/Icon';
import Label from '../ui/label/Label';

@injectable()
export class AchievementPopup extends Component {
    private static readonly TIMEOUT_MS: number = 6000;

    @component(ICON, Icon)
    protected readonly icon: Icon;
    @component(LABEL_DESCRIPTION, Label)
    protected readonly labelDescription: Label;
    @component(LABEL_REQUIREMENTS, Label)
    protected readonly labelRequirements: Label;

    private queue: string[] = [];
    private playersUnit: GameUnit;

    protected initialize(): void {
    }

    public pop(code: string, playersUnit: GameUnit): void {
        this.playersUnit = playersUnit;
        this.queue.push(code);
        this.queue.length === 1 && this.popNext();
    }

    private popNext(): void {
        const code = this.queue[0];
        const achievement = ACHIEVEMENTS[code];
        if (!achievement) {
            this.queue.shift();
            this.queue.length && this.popNext();
            return;
        }
        this.icon.icon = achievement.icon;
        this.labelDescription.value = achievement.popup;
        if (achievement.target) {
            this.labelRequirements.value = `${this.playersUnit.achievements[code] ?? 0} / ${achievement.target}`;
            this.labelRequirements.show();
        } else {
            this.labelRequirements.hide();
        }
        this.show();
        SoundService.play(SoundName.ACHIEVEMENT);
        window.setTimeout(() => {
            this.hide();
            window.setTimeout(() => {
                this.queue.shift();
                this.queue.length && this.popNext();
            }, 500);
        }, AchievementPopup.TIMEOUT_MS);
    }
}
