import { container } from 'tsyringe';
import DomService from '../service/DomService';
import ResourceLoaderService, { RESOURCE_DESIGN, RESOURCE_STYLE } from '../service/ResourceLoaderService';

interface InstantiateOnInitData {
    id: string;
    clazz: new (...args: any) => any;
    propertyKey: string;
}

export default abstract class Component {
    private instantiateOnInitList: InstantiateOnInitData[];
    private _view: HTMLElement;
    private display: string;

    public init(view: HTMLElement): Component {
        this._view = view;
        this.display = this._view.style.display;
        this.instantiateOnInit();
        this.initialize();
        return this;
    }

    private instantiateOnInit(): void {
        this.instantiateOnInitList && this.instantiateOnInitList.forEach(({ id, clazz, propertyKey }) => {
            (this as Object)[propertyKey] = this.instantiate(id, clazz);
        });
    }

    protected abstract initialize(): void;

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

    public addToInstantiateOnInitList(id: string, clazz: new (...args: any) => any, propertyKey: string): void {
        if (!this.instantiateOnInitList) { this.instantiateOnInitList = []; }
        this.instantiateOnInitList.push({ id, clazz, propertyKey });
    }

    public instantiate<T extends Component>(id: string, clazz: new (...args: any) => T): T | null {
        const child: HTMLElement | null = this.findChild(id);
        return child ? container.resolve(clazz).init(child) as T : null;
    }

    public create<T extends Component>(containerId: string, design: string | null, clazz: new (...args: any) => T): T | null {
        const root: HTMLElement | null = this.findChild(containerId);
        if (!root) { return null; }
        const child: HTMLDivElement = document.createElement('div');
        root.appendChild(child);
        if (design) { child.innerHTML = design; }
        return container.resolve(clazz).init(child) as T;
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

    public set backgroundImage(url: string) {
        this.view.style.backgroundImage = `url('${url}')`;
    }

    public get backgroundImage(): string {
        return this.view.style.backgroundImage;
    }

    public set backgroundColor(value: string) {
        this._view.style.backgroundColor = value;
    }

    public get backgroundColor(): string {
        return this._view.style.backgroundColor;
    }
}
