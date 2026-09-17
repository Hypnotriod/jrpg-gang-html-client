import { container } from 'tsyringe';
import DomService from '../service/DomService';
import ResourceLoaderService, { RESOURCE_DESIGN, RESOURCE_STYLE } from '../service/ResourceLoaderService';

interface InstantiateOnInitData {
    id: string;
    clazz: new (...args: any) => any;
    propertyKey: string;
}

export interface ComponentResizeConfig {
    minScale: number;
    maxScale: number;
    contentWidth: number;
    contentHeight: number;
}

export default abstract class Component {
    protected instantiateOnInitList: InstantiateOnInitData[];
    protected _view: HTMLElement;
    protected display: string;
    protected _enabled: boolean = true;
    protected _resizeConfig?: ComponentResizeConfig;

    public get resizeConfig(): ComponentResizeConfig | undefined {
        return this._resizeConfig;
    }

    public set resizeConfig(value: ComponentResizeConfig | undefined) {
        this._resizeConfig = value;
        this.onResize();
    }

    public init(view: HTMLElement): Component {
        this._view = view;
        this.display = this._view.style.display;
        this.instantiateOnInit();
        this.initialize();
        window.addEventListener("resize", (event) => this.onResize());
        return this;
    }

    protected onResize(): void {
        const conf = this.resizeConfig;
        if (!conf) return;
        const scale = this.scaleFactor(conf);
        this.view.style.transform = `scale(${scale})`;
    }

    protected scaleFactor(config: ComponentResizeConfig): number {
        const scaleRaw = (window.innerWidth / window.innerHeight < config.contentWidth / config.contentHeight) ?
            window.innerWidth / config.contentWidth : window.innerHeight / config.contentHeight;
        const scale = Math.min(config.maxScale, Math.max(config.minScale, scaleRaw));
        return Math.round(scale * 1000) / 1000;
    }

    protected instantiateOnInit(): void {
        this.instantiateOnInitList && this.instantiateOnInitList.forEach(({ id, clazz, propertyKey }) => {
            (this as any)[propertyKey] = this.instantiate(id, clazz);
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

    public click(): void {
        this.view.click();
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
        this._enabled = false;
        this._view.setAttribute('disabled', 'disabled');
    }

    public enable(): void {
        this._enabled = true;
        this._view.removeAttribute('disabled');
    }

    public set enabled(value: boolean) {
        this._enabled = value;
        value ? this.enable() : this.disable();
    }

    public get enabled(): boolean {
        return this._enabled;
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
        this.view.style.left = `${Math.round(value)}px`;
    }

    public get leftPx(): number {
        return Number(this.view.style.left.replace('px', ''));
    }

    public set topPx(value: number) {
        this.view.style.top = `${Math.round(value)}px`;
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

    public scrollTo(options: ScrollToOptions): void {
        this.view.scrollTo(options);
    }

    public getBoundingRect(): DOMRect {
        return this.view.getBoundingClientRect();
    }

    protected async delay(ms?: number): Promise<void> {
        return new Promise(resolve => {
            window.setTimeout(resolve, ms);
        });
    }

    protected addHorizontalScroll(container: HTMLElement, scrollStep: number = 50): void {
        container.addEventListener('wheel', function (e) {
            container.scrollLeft += e.deltaY > 0 ? scrollStep : -scrollStep;
            e.preventDefault();
        });
    }
}
