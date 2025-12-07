import { injectable } from 'tsyringe';
import GameObjectRenderer from '../../../service/GameObjectRenderer';
import Container from '../container/Container';

@injectable()
export default class ObjectDescription extends Container {
    public constructor(private readonly renderer: GameObjectRenderer) {
        super();
    }

    protected initialize(): void {
        super.initialize();
        window.addEventListener('mousemove', e => this.updatepositionOnMouseMove(e));
    }

    protected updatepositionOnMouseMove(e: MouseEvent): void {
        this.leftPx = window.innerWidth / 2 > e.clientX ? e.clientX + 32 : e.clientX - this.width - 32;
        this.topPx = window.innerHeight / 2 > e.clientY ? e.clientY : e.clientY - this.height;
        if (this.topPx + this.height > window.innerHeight) {
            this.topPx = window.innerHeight - this.height;
        }
        if (this.topPx < 0) {
            this.topPx = 0;
        }
    }

    public set data(data: object) {
        const ignoreHeaders: string[] = [];
        const main = this.renderer.renderMain(data, ignoreHeaders);
        const misc = this.renderer.renderAttributes(data)
            + this.renderer.renderResistance(data)
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
