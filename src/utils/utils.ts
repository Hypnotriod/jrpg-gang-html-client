import { Item } from '../domain/domain';

export function compareItemsByName(a: Item, b: Item): number {
    return a.name.localeCompare(b.name);
}