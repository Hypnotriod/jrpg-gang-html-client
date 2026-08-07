import { injectable } from 'tsyringe';
import GameObjectRenderer from '../../../service/GameObjectRenderer';
import Container from '../container/Container';
import { GameUnit } from '../../../domain/domain';

@injectable()
export default class ObjectDescription extends Container {
    private static _active: boolean = true;
    private static popups: ObjectDescription[] = [];

    private _unit?: GameUnit;
    private _shown: boolean = false;
    private _isShopItem: boolean = false;
    private _e?: MouseEvent;

    public constructor(private readonly renderer: GameObjectRenderer) {
        super();
    }

    public static get active(): boolean {
        return ObjectDescription._active;
    }

    public static set active(value: boolean) {
        ObjectDescription._active = value;
        ObjectDescription.popups.forEach(p => p.onActiveToggle());
    }

    protected initialize(): void {
        ObjectDescription.popups.push(this);
        super.initialize();
        window.addEventListener('mousemove', e => this.updatePositionOnMouseMove(e));
    }

    protected onActiveToggle(): void {
        if (!ObjectDescription._active) {
            super.hide();
        } else if (this._shown) {
            this.show();
        }
    }

    public override show(): void {
        this._shown = true;
        if (!ObjectDescription._active) return;
        super.show();
    }

    public override hide(): void {
        this._shown = false;
        super.hide();
    }

    protected updatePositionOnMouseMove(e: MouseEvent | undefined = undefined): void {
        this._e = e ?? this._e;
        e = this._e;
        if (!e) { return; }
        this.leftPx = 0;
        this.topPx = 0;
        this.leftPx = e.clientX + 32 + this.width < window.innerWidth ? e.clientX + 32 : e.clientX - this.width - 32;
        this.topPx = (window.innerHeight - this.height) / 2;
        if (e.clientY - this.height > this.topPx) {
            this.topPx = e.clientY - this.height;
        } else if (e.clientY < this.topPx) {
            this.topPx = e.clientY;
        }
    }

    public get isShopItem(): boolean {
        return this._isShopItem;
    }

    public set isShopItem(value: boolean) {
        this._isShopItem = value;
    }

    public set unit(value: GameUnit | undefined) {
        this._unit = value;
    }

    public get unit(): GameUnit | undefined {
        return this._unit;
    }

    public set data(data: object) {
        const ignoreHeaders: string[] = [];
        const main = this.renderer.renderMain(data, ignoreHeaders);
        const misc = this.renderer.renderAttributes(data)
            + this.renderer.renderResistance(data)
            + this.renderer.renderItemRequirements(data, this._unit)
            + this.renderer.renderItemUseCost(data, this._unit)
            + this.renderer.renderPrice(data, this._unit, this._isShopItem)
            + this.renderer.render(data, ignoreHeaders);
        if (!main) {
            this.value = misc;
        } else if (!misc) {
            this.value = main;
        } else {
            this.value = this.renderer.row(
                this.renderer.column(main, 6) +
                this.renderer.column(misc, 6)
            );
        }
        this.updatePositionOnMouseMove();
    }
}
