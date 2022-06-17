import { INPUT_USER_NAME, LABEL_ERROR } from '../../constants/Components';
import { USER_NAME_REGEXP } from '../../constants/RegularExpressions';
import Component from '../Component';
import TextInput from '../ui/input/TextInput';
import Label from '../ui/label/Label';

export default class Login extends Component {
    private userNameInput: TextInput;
    private errorLabel: Label;

    protected initialize(): void {
        this.userNameInput = this.instantiate(INPUT_USER_NAME, TextInput)!;
        this.userNameInput.validationRegEx = USER_NAME_REGEXP;
        this.errorLabel = this.instantiate(LABEL_ERROR, Label)!;
        this.errorLabel.hide();
    }
}
