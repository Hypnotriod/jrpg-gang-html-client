import { Ammunition, Disposable } from '../../../domain/domain';
import TextField from '../textfield/TextField';

export default class ItemDescription extends TextField {

    protected initialize(): void {
        super.initialize();
        window.addEventListener('mousemove', e => {
            this.left = window.innerWidth / 2 > e.clientX ? e.clientX : e.clientX - this.view.clientWidth;
            this.top = window.innerHeight / 2 > e.clientY ? e.clientY : e.clientY - this.view.clientHeight;
        });
    }

    public set data(data: Disposable | Ammunition) {
        this.value = this.render(data, '');
    }

    protected render(data: Object, key: string, deep: number = 0): string {
        if (key === 'uid' || key === 'code') { return ''; }
        if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
            return this.valueNotZeroOrEmpty(key, data as (string | number | boolean));
        } else if (data instanceof Array) {
            return this.renderObjects(data, key, deep);
        } else {
            return this.renderObject(data, key, deep);
        }
    }

    protected renderObjects(data: Object[], header: string, deep: number): string {
        if (!data || !data.length) { return ''; }
        const result = data.reduce((acc, d, i) => acc + this.renderObject(d, `${header} #${i + 1}`, deep), '');
        return result.toString();
    }

    protected renderObject(data: Object, header: string, deep: number): string {
        if (!data || this.emptyOrAllFieldsZeros(data)) { return ''; }
        return this.header(header, deep) + Object.keys(data)
            .reduce((acc, key) => acc + this.render(data[key], key, deep + 1), '');
    }

    protected header(value: string, deep: number): string {
        switch (deep) {
            case 0:
                return '';
            case 1:
                return `<span class="light-green lighten-1">${value}:</span><br>`;
            default:
            case 2:
                return `<span class="light-blue lighten-1">${value}:</span><br>`;
        }
    }

    protected valueNotZeroOrEmpty(key: string, value: number | string | boolean | undefined): string {
        return value ? `<span class="orange-text text-darken-1">${key}</span>: ${value}<br>` : '';
    }

    protected emptyOrAllFieldsZeros(data: Object): boolean {
        return !data || Object.keys(data).every(key => !data[key]);
    }
}
