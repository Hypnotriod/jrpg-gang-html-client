import { injectable, singleton } from 'tsyringe';
import { Unit } from '../domain/domain';
import ActionService, { sum } from './ActionService';

@injectable()
@singleton()
export default class GameObjectRenderer {
    constructor(protected readonly actionService: ActionService) { }

    public column(html: string, s: number): string {
        return `<div class="col s${s}" style="width: 190px;">${html}</div>`;
    }

    public row(html: string): string {
        return `<div class="row" style="margin: 0;">${html}</div>`;
    }

    public renderMain(data: any, ignoreHeaders: string[] = []): string {
        let result = '';
        if (data.code) {
            result += `<img src="./assets/icons/${data.code}.png"><br>`;
        }
        if (data.name) {
            result += `<span class="purple lighten-1">${data.name}</span><br>`;
        }
        if (data.description) {
            result += data.description + '<br>';
        }
        if (this.isUnitData(data)) {
            result += this.keyValue('level', data.stats.progress.level)
            if (data.stats.progress.experienceNext) {
                result += this.keyValue('experience', `${data.stats.progress.experience} / ${data.stats.progress.experienceNext}`);
            } else {
                result += this.keyValue('experience', data.stats.progress.experience)
            }
            result += this.keyValueColor('health', 'red', `${data.state.health} / ${sum(this.actionService.baseAttributeTotalValue(data, 'health'))}`);
            result += this.keyValueColor('stamina', 'green', `${data.state.stamina} / ${sum(this.actionService.baseAttributeTotalValue(data, 'stamina'))}`);
            result += this.keyValueColor('mana', 'blue', `${data.state.mana} / ${sum(this.actionService.baseAttributeTotalValue(data, 'mana'))}`);
            result += this.keyValueColor('action points', 'orange', `${data.state.actionPoints} / ${sum(this.actionService.baseAttributeTotalValue(data, 'actionPoints'))}`);
            result += this.keyValueColor('stress', 'blue-grey', `${data.state.stress}`);
            result += data.state.isStunned ? this.keyValue('stunned', data.state.isStunned) : '';
            if (data.damage) {
                result += this.renderObjects(data.damage, [], 'damage', 13);
            }
            if (data.modification) {
                result += this.renderObjects(data.modification, [], 'modification', 2);
            }
            ignoreHeaders.push('baseAttributes', 'stats', 'inventory', 'state', 'progress', 'damage');
        }
        if (data.type) {
            result += this.keyValueColor('type', 'blue', data.type);
        }
        if (data.slot) {
            result += this.keyValueColor('slot', 'orange', data.slot);
        }
        if (data.slotsNumber) {
            result += this.keyValue('slotsNumber', data.slotsNumber);
        }
        if (data.wearout || data.durability) {
            result += this.keyValueColor('wearout', 'blue-grey', `${data.wearout ?? 0} / ${data.durability}`);
        }
        if (data.equipped) {
            result += this.keyValue('equipped', data.equipped);
        }
        if (data.canBeThrownAway) {
            result += this.keyValue('canBeThrownAway', data.canBeThrownAway);
        }
        if (data.canBeSold) {
            result += this.keyValue('canBeSold', data.canBeSold);
        }

        return result;
    }

    public renderAttributes(data: any): string {
        let result = '';
        if (this.isUnitData(data)) {
            result = this.header('Attributes', 1);
            result += this.keyValueExtra('Strength', this.actionService.attributeTotalValue(data, 'strength'));
            result += this.keyValueExtra('Physique', this.actionService.attributeTotalValue(data, 'physique'));
            result += this.keyValueExtra('Agility', this.actionService.attributeTotalValue(data, 'agility'));
            result += this.keyValueExtra('Endurance', this.actionService.attributeTotalValue(data, 'endurance'));
            result += this.keyValueExtra('Intelligence', this.actionService.attributeTotalValue(data, 'intelligence'));
            result += this.keyValueExtra('Initiative', this.actionService.attributeTotalValue(data, 'initiative'));
            result += this.keyValueExtra('Luck', this.actionService.attributeTotalValue(data, 'luck'));
        }
        return result;
    }

    public renderResistance(data: any): string {
        let result = '';
        if (this.isUnitData(data)) {
            result = this.header('Resistance', 1);
            result += this.keyValueExtra('Stabbing', this.actionService.resistanceTotalValue(data, 'stabbing'));
            result += this.keyValueExtra('Cutting', this.actionService.resistanceTotalValue(data, 'cutting'));
            result += this.keyValueExtra('Crushing', this.actionService.resistanceTotalValue(data, 'crushing'));
            result += this.keyValueExtra('Fire', this.actionService.resistanceTotalValue(data, 'fire'));
            result += this.keyValueExtra('Cold', this.actionService.resistanceTotalValue(data, 'cold'));
            result += this.keyValueExtra('Lightning', this.actionService.resistanceTotalValue(data, 'lightning'));
            result += this.keyValueExtra('Poison', this.actionService.resistanceTotalValue(data, 'poison'));
            result += this.keyValueExtra('Exhaustion', this.actionService.resistanceTotalValue(data, 'exhaustion'));
            result += this.keyValueExtra('ManaDrain', this.actionService.resistanceTotalValue(data, 'manaDrain'));
            result += this.keyValueExtra('Bleeding', this.actionService.resistanceTotalValue(data, 'bleeding'));
            result += this.keyValueExtra('Fear', this.actionService.resistanceTotalValue(data, 'fear'));
            result += this.keyValueExtra('Curse', this.actionService.resistanceTotalValue(data, 'curse'));
            result += this.keyValueExtra('Madness', this.actionService.resistanceTotalValue(data, 'madness'));
        }
        return result;
    }

    public render(data: Object, ignoreHeaders: string[] = [], key: string = '', depth: number = 0, header: string = ''): string {
        if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
            return this.valueNotZeroOrEmpty(ignoreHeaders, header, key, data as (string | number | boolean));
        } else if (data instanceof Array) {
            return this.renderObjects(data, ignoreHeaders, key, depth);
        } else {
            return this.renderObject(data, ignoreHeaders, key, depth);
        }
    }

    protected isUnitData(data: any): data is Unit {
        return Boolean(data.state && data.stats);
    }

    protected renderObjects(data: Object[], ignoreHeaders: string[], header: string, depth: number): string {
        if (!data || !data.length || this.ignoreKey(ignoreHeaders, header)) { return ''; }
        const result = data.reduce((acc, d, i) => acc + this.renderObject(d, ignoreHeaders, `${header} #${i + 1}`, depth), '');
        return result.toString();
    }

    protected renderObject(data: Object, ignoreHeaders: string[], header: string, depth: number): string {
        if (!data || this.emptyOrAllFieldsZeros(ignoreHeaders, header, data) || this.ignoreKey(ignoreHeaders, header)) { return ''; }
        return this.header(header, depth) + Object.keys(data)
            .reduce((acc, key) => acc + this.render(data[key], ignoreHeaders, key, depth + 1, header), '');
    }

    public header(value: string, depth: number): string {
        value = this.capitalize(value);
        switch (depth) {
            case 0:
                return '';
            case 1:
                return `<span class="light-green lighten-1">${value}:</span><br>`;
            case 3:
                return `<span class="orange lighten-1">${value}:</span><br>`;
            case 13:
                return `<span class="red lighten-1">${value}:</span><br>`;
            default:
            case 2:
                return `<span class="light-blue lighten-1">${value}:</span><br>`;
        }
    }

    protected valueNotZeroOrEmpty(ignoreHeaders: string[], header: string, key: string, value: number | string | boolean | undefined): string {
        return (value || this.isZeroValueKey(header, key)) && !this.ignoreKey(ignoreHeaders, header, key) ? this.keyValue(key, value) : '';
    }

    protected keyValue(key: string, value: number | string | boolean | undefined): string {
        key = this.capitalize(key);
        return `<span class="orange-text text-lighten-1">${key}</span>: ${value}<br>`;
    }

    protected keyValueExtra(key: string, value: [number, number]): string {
        key = this.capitalize(key);
        return !value[1] ?
            `<span class="orange-text text-lighten-1">${key}</span>: ${value[0]}<br>` :
            `<span class="orange-text text-lighten-1">${key}</span>: <span class="green-text text-lighten-2">${value[0] + value[1]}</span> <br>`;
    }

    protected keyValueColor(key: string, colorClass: string, value: number | string | boolean | undefined): string {
        key = this.capitalize(key);
        return `<span class="orange-text text-lighten-1">${key}</span>:
        <span class="${colorClass} lighten-1">${value}</span><br>`;
    }

    protected emptyOrAllFieldsZeros(ignoreHeaders: string[], header: string, data: Object): boolean {
        return !data || Object.keys(data).every(key => !data[key] &&
            !this.isZeroValueKey(header, key) && !this.ignoreKey(ignoreHeaders, header, key));
    }

    protected isZeroValueKey(header: string, key: string): boolean {
        switch (key) {
            case 'x':
            case 'y':
                return true;
        }
        return false;
    }

    protected ignoreKey(ignoreHeaders: string[], header: string, key?: string): boolean {
        if (ignoreHeaders.includes(header)) return true;
        switch (key) {
            case 'name':
            case 'code':
            case 'uid':
            case 'unitUid':
            case 'wearout':
            case 'durability':
            case 'type':
            case 'slot':
            case 'description':
            case 'slotsNumber':
            case 'equipped':
            case 'canBeThrownAway':
            case 'canBeSold':
                return true;
        }
        return false;
    }

    protected capitalize(value: string): string {
        return value.replace(/^./, char => char.toUpperCase());
    }
}
