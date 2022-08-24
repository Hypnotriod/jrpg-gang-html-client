import { singleton } from 'tsyringe';
import Component from '../component/Component';
import MainScene from '../component/mainscene/MainScene';
import { MAIN_SCENE_CONTAINER } from '../constants/Components';
import { MAIN_SCENE_DESIGN, MAIN_SCENE_STYLE } from '../constants/Resources';

@singleton()
export default class Application {
    public launch(): void {
        this.createMainSceneComponent();
    }

    public async createMainSceneComponent(): Promise<void> {
        await Component.instantiateHighOrderComponent(MAIN_SCENE_CONTAINER, MAIN_SCENE_DESIGN, MAIN_SCENE_STYLE, MainScene);
    }
}
