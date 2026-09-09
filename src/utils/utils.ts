import { Item } from '../domain/domain';

export function compareItemsByName(a: Item, b: Item): number {
    return a.name.localeCompare(b.name);
}

export function timeout(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => resolve(), ms);
    })
} 