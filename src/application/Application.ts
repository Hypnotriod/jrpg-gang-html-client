import { singleton } from 'tsyringe';
import Component from '../component/Component';
import MainScene from '../component/mainscene/MainScene';
import { MAIN_SCENE } from '../constants/Components';
import { MAIN_SCENE_DESIGN, MAIN_SCENE_STYLE } from '../constants/Resources';

@singleton()
export default class Application {
    public launch(): void {
        this.createMainSceneComponent();
    }

    public async createMainSceneComponent(): Promise<void> {
        const mainScene = await Component.instantiateHighOrderComponent(MAIN_SCENE, MAIN_SCENE_DESIGN, MAIN_SCENE_STYLE, MainScene);
    }
}
