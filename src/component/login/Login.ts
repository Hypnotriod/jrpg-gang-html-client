import { BUTTON_JOIN, ICONS_CONTAINER, INPUT_USER_NAME, LABEL_ERROR } from '../../constants/Components';
import { USER_NAME_REGEXP } from '../../constants/RegularExpressions';
import Component from '../Component';
import Button from '../ui/button/Button';
import Icon from '../ui/icon/Icon';
import TextInput from '../ui/input/TextInput';
import Label from '../ui/label/Label';

export default class Login extends Component {
    private userNameInput: TextInput;
    private errorLabel: Label;
    private joinButton: Button;
    private readonly icons: Icon[] = [];

    protected initialize(): void {
        this.userNameInput = this.instantiate(INPUT_USER_NAME, TextInput)!;
        this.userNameInput.validationRegEx = USER_NAME_REGEXP;
        this.userNameInput.onInput = target => this.updateJoinButtonState();
        this.errorLabel = this.instantiate(LABEL_ERROR, Label)!;
        this.errorLabel.hide();

        this.joinButton = this.instantiate(BUTTON_JOIN, Button)!;
        this.joinButton.onClick = target => this.onJoin();
        this.joinButton.disable();

        this.icons.push(Icon.createIcon('warrior', 0, this, ICONS_CONTAINER)!);
        this.icons.push(Icon.createIcon('magician', 1, this, ICONS_CONTAINER)!);
        this.icons.push(Icon.createIcon('archer', 2, this, ICONS_CONTAINER)!);
        this.icons.forEach(icon => {
            icon.onClick = target => this.onClassIconClick(target);
        });
        this.icons[0].select();
    }

    protected onClassIconClick(target: Icon): void {
        this.icons.forEach(icon => icon.unselect());
        target.select();
        this.updateJoinButtonState();
    }

    protected updateJoinButtonState(): void {
        if (this.userNameInput.isValid && this.userNameInput.value !== '') {
            this.joinButton.enable();
        } else {
            this.joinButton.disable();
        }
    }

    protected onJoin(): void {

    }
}
