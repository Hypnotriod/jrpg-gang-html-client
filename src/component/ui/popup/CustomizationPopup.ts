import { injectable, singleton } from 'tsyringe';
import { component } from '../../decorator/decorator';
import Button from '../button/Button';
import Container from '../container/Container';
import ItemIcon from '../icon/ItemIcon';
import { ICONS_CONTAINER } from '../../../constants/Components';
import { SoundName, SoundService } from '../../../service/SoundService';

@injectable()
@singleton()
export class CustomizationPopup extends Container {
    @component('button_ok', Button)
    private readonly buttonOk: Button;
    private icons: ItemIcon[] = [];
    private _shadow?: Container;
    private _onSelect: (skin: string) => void;

    public set onSelect(callback: (skin: string) => void) {
        this._onSelect = callback;
    }

    public set shadow(value: Container) {
        this._shadow = value;
    }

    public update(skins: string[], current: string) {
        this.icons.forEach(icon => icon.destroy());
        this.icons = [];
        skins.forEach((skin) => {
            const icon = ItemIcon.createBigItemIcon(skin, this, ICONS_CONTAINER)!;
            icon.onClick = target => this.onSkinIconClick(target);
            this.icons.push(icon);
            if (skin === current) {
                icon.select();
                icon.choose();
            }
        });
    }

    protected onSkinIconClick(target: ItemIcon): void {
        this.icons.forEach(icon => icon.unselect());
        this.icons.forEach(icon => icon.unchoose());
        target.select();
        target.choose();
        SoundService.play(SoundName.CLICK);
    }

    public override show(): void {
        super.show();
        this._shadow?.show();
    }

    public override hide(): void {
        super.hide();
        this._shadow?.hide();
    }

    protected initialize(): void {
        this.buttonOk.onClick = () => {
            this.hide();
            this._onSelect?.(this.icons.find(icon => icon.selected)!.icon);
        };
    }
}