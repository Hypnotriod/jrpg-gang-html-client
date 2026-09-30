import { Item } from '../domain/domain';

export function compareItemsByName(a: Item, b: Item): number {
    return a.name.localeCompare(b.name);
}

export class Token {
    private _cancelled: boolean = false;

    public get cancelled(): boolean {
        return this._cancelled;
    }

    public cancel(): void {
        this._cancelled = true;
    }
}

export function timeout(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => resolve(), ms);
    })
} 