import { injectable } from 'tsyringe';
import GameObjectRenderer from '../../../service/GameObjectRenderer';
import Container from '../container/Container';
import { GameUnit } from '../../../domain/domain';

@injectable()
export default class ObjectDescription extends Container {
    private _unit?: GameUnit;

    public constructor(private readonly renderer: GameObjectRenderer) {
        super();
    }

    protected initialize(): void {
        super.initialize();
        window.addEventListener('mousemove', e => this.updatepositionOnMouseMove(e));
    }

    protected updatepositionOnMouseMove(e: MouseEvent): void {
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

    public set unit(value: GameUnit) {
        this._unit = value;
    }

    public set data(data: object) {
        const ignoreHeaders: string[] = [];
        const main = this.renderer.renderMain(data, ignoreHeaders);
        const misc = this.renderer.renderAttributes(data)
            + this.renderer.renderResistance(data)
            + this.renderer.renderItemRequirements(data, this._unit)
            + this.renderer.renderItemUseCost(data, this._unit)
            + this.renderer.renderPrice(data)
            + this.renderer.render(data, ignoreHeaders);
        if (!main) {
            this.value = misc;
        } else {
            this.value = this.renderer.row(
                this.renderer.column(main, 6) +
                this.renderer.column(misc, 6)
            );
        }
    }
}
