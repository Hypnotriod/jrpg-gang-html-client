import { container, injectable } from 'tsyringe';
import { LABEL_DESCRIPTION, LABEL_HEADER, LABEL_PRICE, LABEL_UPGRADE } from '../../constants/Components';
import { UPGRADE_DESIGN } from '../../constants/Resources';
import { EquipmentUpgrade } from '../../domain/domain';
import GameObjectRenderer from '../../service/GameObjectRenderer';
import GameStateService from '../../service/GameStateService';
import ResourceLoaderService from '../../service/ResourceLoaderService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Container from '../ui/container/Container';
import Label from '../ui/label/Label';

@injectable()
export default class UpgradeItem extends Component {
    @component(LABEL_HEADER, Label)
    protected readonly labelHeader: Label;
    @component(LABEL_DESCRIPTION, Label)
    protected readonly labelDescription: Label;
    @component(LABEL_UPGRADE, Container)
    protected readonly labelUpgrade: Container;
    @component(LABEL_PRICE, Container)
    protected readonly labelPrice: Container;
    @component('button_upgrade', Button)
    protected readonly buttonUpgrade: Button;

    protected data: EquipmentUpgrade;
    protected onUpgradeCallback?: (uid: number) => void;

    public set onUpgrade(callback: (uid: number) => void) {
        this.onUpgradeCallback = callback;
    }

    constructor(
        private readonly renderer: GameObjectRenderer,
        private readonly state: GameStateService) {
        super();
    }

    public static createItem(parent: Component, containerId: string): UpgradeItem | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        return parent.create(containerId, UpgradeItem, { design: resourceLoader.get(UPGRADE_DESIGN) });
    }

    public destroy(): void {
        this.buttonUpgrade.destroy();
        super.destroy();
    }

    protected initialize(): void {
        this.buttonUpgrade.onClick = target => this.onUpgradeCallback?.(this.data.uid!);
    }

    public update(upgrade: EquipmentUpgrade): void {
        const unit = this.state.userState.unit;
        this.data = upgrade;
        this.labelHeader.value = upgrade.name;
        this.labelDescription.value = upgrade.description!;
        const dmgs: any[] = upgrade.damage ?? [];
        const damage = dmgs.length > 1 ? dmgs.reduce((acc, d, n) => ({ ...acc, [`Damage ${n + 1}`]: d }), {}) : ({ damage: dmgs[0] });
        this.labelUpgrade.value = this.renderer.render({
            ...(this.data.modification ?? {}),
            ...damage,
            useCost: this.data.useCost,
        });
        this.labelPrice.value = this.renderer.renderApplicationPrice(upgrade.price ?? {}, this.state.userState.unit);

        if (this.state.checkPrice(unit, upgrade.price)) {
            this.buttonUpgrade.enable();
        } else {
            this.buttonUpgrade.disable();
        }
    }
}
