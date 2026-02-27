import { Key } from 'ts-key-enum';
import Component from '../../Component';

export default class TextInput extends Component {
    private _isValid: boolean = true;
    private _validationRegEx: RegExp;
    private onEnterPressCallback: (target: TextInput) => void;
    private onInputCallback: (target: TextInput) => void;

    protected initialize(): void {
        this.view.oninput = (event) => {
            this.validate();
            this.onInputCallback && this.onInputCallback(this);
        };
        this.view.onkeydown = (event: KeyboardEvent) => {
            if (event.key === Key.Enter && this.onEnterPressCallback) {
                this.onEnterPressCallback(this);
            }
        };
    }

    public get view(): HTMLTextAreaElement {
        return super.view as HTMLTextAreaElement;
    }

    public get validationRegEx(): RegExp {
        return this._validationRegEx;
    }

    public set validationRegEx(value: RegExp) {
        this._validationRegEx = value;
    }

    public get isValid(): boolean {
        return this._isValid;
    }

    public get value(): string {
        return this.view.value;
    }

    public set value(value: string) {
        this.view.value = value;
    }

    public set onEnter(callback: (target: TextInput) => void) {
        this.onEnterPressCallback = callback;
    }

    public set onInput(callback: (target: TextInput) => void) {
        this.onInputCallback = callback;
    }

    public makeInalid(): void {
        this.view.classList.add('invalid');
    }

    public makeValid(): void {
        this.view.classList.remove('invalid');
    }

    public validate(): boolean {
        if (!this._validationRegEx) { return true; }
        this._isValid = this._validationRegEx.test(this.view.value);
        if (this._isValid) {
            this.makeValid();
        } else {
            this.makeInalid();
        }
        return this._isValid;
    }

    public get maxLength(): number {
        return this.view.maxLength;
    }

    public set maxLength(value: number) {
        this.view.maxLength = value;
    }
}
