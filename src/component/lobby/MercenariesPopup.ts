import { injectable, singleton } from 'tsyringe';
import { Mercenary } from '../../domain/domain';
import { GameRoomHireMercenaryRequestData, RequestType } from '../../dto/requests';
import ServerCommunicatorService from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Container from '../ui/container/Container';
import MercenaryItem from './MercenaryItem';
import ObjectDescription from '../ui/popup/ObjectDescription';

@injectable()
@singleton()
export default class MercenariesPopup extends Component {
    @component('button_close', Button)
    protected readonly buttonClose: Button;

    public roomUid: number;

    protected items: MercenaryItem[] = [];
    protected _shadow?: Container;
    private _descriptionPopup?: ObjectDescription;

    public set descriptionPopup(value: ObjectDescription) {
        this._descriptionPopup = value;
    }

    public get descriptionPopup(): ObjectDescription | undefined {
        return this._descriptionPopup;
    }

    public set shadow(value: Container) {
        this._shadow = value;
    }

    constructor(
        private readonly communicator: ServerCommunicatorService) {
        super();
    }

    public override show(): void {
        super.show();
        this._shadow?.show();
    }

    public override hide(): void {
        super.hide();
        this._shadow?.hide();
    }

    protected initialize(): void {
        this.buttonClose.onClick = target => this.hide();
    }

    public update(mercenaries: Mercenary[]): void {
        this.items.forEach(item => item.destroy());
        this.items = mercenaries.map(mercenary => {
            const item = MercenaryItem.createMercenaryItem(this, 'mercenaries_container')!;
            item.update(mercenary);
            item.onHireMercenary = code => this.hireMercenaryClick(code);
            item.descriptionPopup = this._descriptionPopup!;
            return item;
        });
    }

    protected hireMercenaryClick(code: string): void {
        this.communicator.sendMessage(RequestType.HIRE_MERCENARY, {
            code,
        } as GameRoomHireMercenaryRequestData);
        this.hide();
    }
}