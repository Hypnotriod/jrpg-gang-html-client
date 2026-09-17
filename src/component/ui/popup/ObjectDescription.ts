import { injectable } from 'tsyringe';
import GameObjectRenderer from '../../../service/GameObjectRenderer';
import Container from '../container/Container';
import { GameUnit, Position } from '../../../domain/domain';
import { RESIZE_CONFIG } from '../../../constants/Configuration';

@injectable()
export default class ObjectDescription extends Container {
    private static _active: boolean = true;
    private static popups: ObjectDescription[] = [];

    private _unit?: GameUnit;
    private _shown: boolean = false;
    private _isShopItem: boolean = false;
    private _e?: MouseEvent;
    private _stickTo?: DOMRect;
    private _showTimeout: number;

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
            this.show({ stickTo: this._stickTo });
        }
    }

    public override show(options?: { stickTo?: DOMRect, timeoutMs?: number }): void {
        this._stickTo = options?.stickTo;
        this._shown = true;
        if (!ObjectDescription._active) return;
        clearTimeout(this._showTimeout);
        this._showTimeout = window.setTimeout(
            () => {
                if (!ObjectDescription._active) return;
                super.show();
                this.updatePositionOnMouseMove(this._e);
            },
            options?.timeoutMs ?? 0);
    }

    public override hide(): void {
        this._shown = false;
        clearTimeout(this._showTimeout);
        super.hide();
    }

    protected updatePositionOnMouseMove(e: MouseEvent | undefined = undefined): void {
        this._e = e ?? this._e;
        e = this._e;
        if (!e) { return; }
        this.leftPx = 0;
        this.topPx = 0;
        const scale = this.scaleFactor(RESIZE_CONFIG);
        if (this._stickTo) {
            this.leftPx = this._stickTo.x + this._stickTo.width * scale + 2 + this.width * scale < window.innerWidth ?
                this._stickTo.x + this._stickTo.width + 2 * scale : this._stickTo.x - this.width * scale - 2 * scale;
            this.topPx = this._stickTo.y + (this._stickTo.height - this.height * scale) / 2;
            // this.topPx = this._stickTo.y;
        } else {
            this.leftPx = e.clientX + 32 + this.width < window.innerWidth ? e.clientX + 32 : e.clientX - this.width - 32;
            this.topPx = e.clientY - this.height * scale / 2;
        }
        if (this.topPx < 32) {
            this.topPx = 32;
        }
        if (this.topPx + this.height * scale + 32 > window.innerHeight) {
            this.topPx = window.innerHeight - this.height * scale - 32;
        }
        this.leftPx = (this.leftPx - window.innerWidth / 2) / scale + window.innerWidth / 2;
        this.topPx = (this.topPx - window.innerHeight / 2) / scale + window.innerHeight / 2;
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
        this.updatePositionOnMouseMove(this._e);
    }
}
