import { ICON, LABEL_NAME } from '../../../constants/Components';
import { Ammunition, Disposable } from '../../../domain/domain';
import Component from '../../Component';
import { component } from '../../decorator/decorator';
import Label from '../label/Label';
import Icon from './Icon';

export default class ItemIcon extends Component {
    @component(ICON, Icon)
    protected readonly icon: Icon;
    @component(LABEL_NAME, Label)
    protected readonly nameLabel: Label;

    protected initialize(): void {
    }

    public update(data: Disposable | Ammunition): void {
        this.nameLabel.value = data.name;
        this.icon.icon = data.code;
    }
}
