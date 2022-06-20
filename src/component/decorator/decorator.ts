import { container } from 'tsyringe';
import Component from '../Component';

export function component<T extends Component>(id: string, clazz: new (...args: any) => T):
    (target: Component, propertyKey: string) => void {
    return function (target: Component, propertyKey: string): void {
        target.addToInstantiateOnInitList(id, clazz, propertyKey);
    };
}
