import { injectable, singleton } from 'tsyringe';
import { Unit } from '../domain/domain';
import { Key } from 'ts-key-enum';

@injectable()
@singleton()
export default class GameObjectRenderer {
    public renderMain(data: any): string {
        let result = '';
        if (data.name) {
            result += `<span class="purple lighten-1">${data.name}</span><br>`;
        }
        if (this.isUnitData(data)) {
            result += this.keyValueColor('health', 'red', `${data.state.health} / ${data.stats.baseAttributes.health}`);
            result += this.keyValueColor('stamina', 'green', `${data.state.stamina} / ${data.stats.baseAttributes.stamina}`);
            result += this.keyValueColor('mana', 'blue', `${data.state.mana} / ${data.stats.baseAttributes.mana}`);
            result += this.keyValueColor('action points', 'orange', `${data.state.actionPoints} / ${data.stats.baseAttributes.actionPoints}`);
            result += this.keyValueColor('stress', 'blue-grey', `${data.state.stress}`);
            result += data.state.isStunned ? this.keyValue('stunned', data.state.isStunned) : '';
        }
        if (data.type) {
            result += this.keyValueColor('type', 'blue', data.type);
        }
        if (data.slot) {
            result += this.keyValueColor('slot', 'orange', data.slot);
        }
        if (data.wearout || data.durability) {
            result += this.keyValueColor('wearout', 'blue-grey', `${data.wearout ?? 0} / ${data.durability}`);
        }

        return result;
    }

    public render(data: Object, key: string = '', deep: number = 0, header: string = ''): string {
        if (key === 'uid' || key === 'code') { return ''; }
        if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
            return this.valueNotZeroOrEmpty(header, key, data as (string | number | boolean));
        } else if (data instanceof Array) {
            return this.renderObjects(data, key, deep);
        } else {
            return this.renderObject(data, key, deep);
        }
    }

    protected isUnitData(data: any): data is Unit {
        return Boolean(data.state && data.stats);
    }

    protected renderObjects(data: Object[], header: string, deep: number): string {
        if (!data || !data.length || this.ignoreKey(header)) { return ''; }
        const result = data.reduce((acc, d, i) => acc + this.renderObject(d, `${header} #${i + 1}`, deep), '');
        return result.toString();
    }

    protected renderObject(data: Object, header: string, deep: number): string {
        if (!data || this.emptyOrAllFieldsZeros(header, data) || this.ignoreKey(header)) { return ''; }
        return this.header(header, deep) + Object.keys(data)
            .reduce((acc, key) => acc + this.render(data[key], key, deep + 1, header), '');
    }

    public header(value: string, deep: number): string {
        value = this.capitalize(value);
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

    protected valueNotZeroOrEmpty(header: string, key: string, value: number | string | boolean | undefined): string {
        return (value || this.isZeroValueKey(header, key)) && !this.ignoreKey(header, key) ? this.keyValue(key, value) : '';
    }

    protected keyValue(key: string, value: number | string | boolean | undefined): string {
        key = this.capitalize(key);
        return `<span class="orange-text text-lighten-1">${key}</span>: ${value}<br>`;
    }

    protected keyValueColor(key: string, colorClass: string, value: number | string | boolean | undefined): string {
        key = this.capitalize(key);
        return `<span class="orange-text text-lighten-1">${key}</span>:
        <span class="${colorClass} lighten-1">${value}</span><br>`;
    }

    protected emptyOrAllFieldsZeros(header: string, data: Object): boolean {
        return !data || Object.keys(data).every(key => !data[key] &&
            !this.isZeroValueKey(header, key) && !this.ignoreKey(header, key));
    }

    protected isZeroValueKey(header: string, key: string): boolean {
        switch (key) {
            case 'x':
            case 'y':
                return true;
        }
        return false;
    }

    protected ignoreKey(header: string, key?: string): boolean {
        switch (header) {
            case 'state':
            case 'baseAttributes':
                return true;
        }
        switch (key) {
            case 'name':
            case 'unitUid':
            case 'wearout':
            case 'durability':
            case 'type':
            case 'slot':
                return true;
        }
        return false;
    }

    protected capitalize(value: string): string {
        return value.replace(/^./, char => char.toUpperCase());
    }
}
