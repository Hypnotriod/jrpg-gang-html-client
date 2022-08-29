import { injectable } from 'tsyringe';
import { Ammunition, Disposable, GameUnit } from '../../../domain/domain';
import GameObjectRenderer from '../../../service/GameObjectRenderer';
import TextField from '../textfield/TextField';

@injectable()
export default class ObjectDescription extends TextField {
    public constructor(private readonly renderer: GameObjectRenderer) {
        super();
    }

    protected initialize(): void {
        super.initialize();
        window.addEventListener('mousemove', e => {
            this.leftPx = window.innerWidth / 2 > e.clientX ? e.clientX : e.clientX - this.view.clientWidth;
            this.topPx = window.innerHeight / 2 > e.clientY ? e.clientY : e.clientY - this.view.clientHeight;
        });
    }

    public set data(data: object) {
        this.value = this.renderer.render(data, '');
    }
}
