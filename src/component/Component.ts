import { container } from 'tsyringe';
import DomService from '../service/DomService';
import ResourceLoaderService, { RESOURCE_DESIGN, RESOURCE_STYLE } from '../service/ResourceLoaderService';

export default class Component {
    private _view: HTMLElement;
    private display: string;

    protected init(view: HTMLElement): Component {
        this._view = view;
        this.display = this._view.style.display;
        return this;
    }

    protected get view(): HTMLElement {
        return this._view;
    }

    public static async instantiateHighOrderComponent<T extends Component>(
        id: string, designPath: string, stylePath: string, clazz: new (...args: any) => T): Promise<T | null> {
        const loaderService: ResourceLoaderService = container.resolve(ResourceLoaderService);
        const domService: DomService = container.resolve(DomService);
        const design: string = await loaderService.load(designPath, RESOURCE_DESIGN);
        const style: string = await loaderService.load(stylePath, RESOURCE_STYLE);
        const view: HTMLElement | null = domService.renderDesignTemplate(id, design, style);
        return view ? container.resolve(clazz).init(view) as T : null;
    }

    public instantiate<T extends Component>(id: string, clazz: new (...args: any) => T): T | null {
        const child: HTMLElement | null = this.findChild(id);
        return child ? container.resolve(clazz).init(child) as T : null;
    }

    public show(): void {
        this._view.style.display = this.display || 'block';
    }

    public hide(): void {
        this._view.style.display = 'none';
    }

    public disable(): void {
        this._view.setAttribute('disabled', 'disabled');
    }

    public enable(): void {
        this._view.removeAttribute('disabled');
    }

    public findChild(id: string): HTMLElement | null {
        return this._view.querySelector(`#${id}`);
    }

    public setBackgroundColor(value: string): void {
        this._view.style.backgroundColor = value;
    }
}
