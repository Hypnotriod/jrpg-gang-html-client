import { container, injectable } from 'tsyringe';
import { ICON, LABEL_DESCRIPTION, LABEL_HEADER, LABEL_PRICE, LABEL_REQUIREMENTS } from '../../constants/Components';
import { MERCENARY_DESIGN } from '../../constants/Resources';
import { Mercenary } from '../../domain/domain';
import GameObjectRenderer from '../../service/GameObjectRenderer';
import GameStateService from '../../service/GameStateService';
import ResourceLoaderService from '../../service/ResourceLoaderService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Container from '../ui/container/Container';
import Icon from '../ui/icon/Icon';
import Label from '../ui/label/Label';
import ObjectDescription from '../ui/popup/ObjectDescription';

@injectable()
export default class MercenaryItem extends Component {
    @component(ICON, Icon)
    protected readonly icon: Icon;
    @component(LABEL_HEADER, Label)
    protected readonly labelHeader: Label;
    @component(LABEL_DESCRIPTION, Label)
    protected readonly labelDescription: Label;
    @component(LABEL_REQUIREMENTS, Container)
    protected readonly labelRequirements: Container;
    @component(LABEL_PRICE, Container)
    protected readonly labelPrice: Container;
    @component('button_hire', Button)
    protected readonly buttonHire: Button;

    public set descriptionPopup(value: ObjectDescription) {
        this.icon.descriptionPopup = value;
    }

    protected data: Mercenary;
    protected onHireMercenaryCallback?: (code: string) => void;

    public set onHireMercenary(callback: (code: string) => void) {
        this.onHireMercenaryCallback = callback;
    }

    constructor(
        private readonly renderer: GameObjectRenderer,
        private readonly state: GameStateService) {
        super();
    }

    public static createMercenaryItem(parent: Component, containerId: string): MercenaryItem | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        return parent.create(containerId, MercenaryItem, { design: resourceLoader.get(MERCENARY_DESIGN) });
    }

    public destroy(): void {
        this.buttonHire.destroy();
        super.destroy();
    }

    protected initialize(): void {
        this.buttonHire.onClick = target => this.onHireMercenaryCallback?.(this.data.code!);
    }

    public update(mercenary: Mercenary): void {
        this.data = mercenary;
        this.icon.icon = mercenary.code!;
        this.icon.description = {
            description: mercenary.description,
            code: mercenary.code,
            level: mercenary.stats.progress.level,
            baseAttributes: mercenary.stats.baseAttributes,
            attributes: mercenary.stats.attributes,
            resistance: mercenary.stats.resistance,
        };
        this.labelHeader.value = mercenary.name;
        this.labelDescription.value = mercenary.description!;
        this.labelRequirements.value = this.renderer.renderApplicationRequirements(mercenary.requirements || {}, this.state.userState.unit);
        this.labelPrice.value = this.renderer.renderApplicationPrice(mercenary.price ?? {}, this.state.userState.unit);

        if (this.state.checkRequirements(mercenary.requirements) && this.state.checkPrice(mercenary.price)) {
            this.buttonHire.enable();
        } else {
            this.buttonHire.disable();
        }
    }
}
