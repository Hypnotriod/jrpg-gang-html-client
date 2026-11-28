import 'reflect-metadata';
import Component from '../Component';

export function component(id: string):
    (target: Component, propertyKey: string) => void {
    return function (target: Component, propertyKey: string): void {
        const clazz = Reflect.getMetadata('design:type', target, propertyKey) as new (...args: any[]) => Component;
        if (typeof clazz !== 'function' || !(clazz.prototype instanceof Component)) {
            throw new TypeError(`Component class metadata is missing or invalid for ${propertyKey}`);
        }
        target.addToInstantiateOnInitList(id, clazz, propertyKey);
    };
}
