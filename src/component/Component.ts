import { container } from 'tsyringe';
import DomService from '../service/DomService';
import ResourceLoaderService, { RESOURCE_DESIGN, RESOURCE_STYLE } from '../service/ResourceLoaderService';

interface InstantiateOnInitData {
    id: string;
    clazz: new (...args: any) => any;
    propertyKey: string;
}

export default abstract class Component {
    protected instantiateOnInitList: InstantiateOnInitData[];
    protected _view: HTMLElement;
    protected display: string;

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

    public destroy(): void {
        this._view.remove();
        (this._view as HTMLElement | null) = null;
    }

    public get view(): HTMLElement {
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

    public create<T extends Component>(
        containerOrContainerId: HTMLElement | string,
        clazz: new (...args: any) => T,
        config?: { design?: string, classList?: string[], id?: string, tagName?: string }): T | null {
        config = config || {};
        const root: HTMLElement | null = (containerOrContainerId instanceof HTMLElement)
            ? containerOrContainerId : this.findChild(containerOrContainerId);
        if (!root) { return null; }
        const tagName: string = config.tagName || 'div';
        const child: HTMLElement = document.createElement(tagName);
        if (config.design) { child.innerHTML = config.design; }
        if (config.id) { child.id = config.id; }
        config.classList && config.classList.forEach(c => child.classList.add(c));
        root.appendChild(child);
        return container.resolve(clazz).init(child) as T;
    }

    public removeAllChildren(): void {
        while (this.view.lastChild) {
            this.view.removeChild(this.view.lastChild);
        }
    }

    public appendChild(child: HTMLElement): void {
        this.view.appendChild(child);
    }

    public show(): void {
        this._view.style.display = this.display || 'block';
    }

    public hide(): void {
        this._view.style.display = 'none';
    }

    public get visible(): boolean {
        return this._view.style.display !== 'none';
    }

    public disable(): void {
        this._view.setAttribute('disabled', 'disabled');
    }

    public enable(): void {
        this._view.removeAttribute('disabled');
    }

    public set enabled(value: boolean) {
        value ? this.enable() : this.disable();
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

    public set leftPx(value: number) {
        this.view.style.left = `${value}px`;
    }

    public get leftPx(): number {
        return Number(this.view.style.left.replace('px', ''));
    }

    public set topPx(value: number) {
        this.view.style.top = `${value}px`;
    }

    public get topPx(): number {
        return Number(this.view.style.top.replace('px', ''));
    }

    public get width(): number {
        return this.view.clientWidth;
    }

    public set width(value: number) {
        this.view.style.width = value + 'px';
    }

    public get height(): number {
        return this.view.clientHeight;
    }

    public set height(value: number) {
        this.view.style.height = value + 'px';
    }

    protected async delay(ms?: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    protected addHorizontalScroll(container: HTMLElement, scrollStep: number = 50): void {
        container.addEventListener('wheel', function (e) {
            container.scrollLeft += e.deltaY > 0 ? scrollStep : -scrollStep;
            e.preventDefault();
        });
    }
}
