import { injectable, singleton } from 'tsyringe';
import ActionService from '../../service/ActionService';
import GameStateService from '../../service/GameStateService';
import ItemIcon from '../ui/icon/ItemIcon';
import GameBase from './GameBase';
import ObjectDescription from '../ui/popup/ObjectDescription';

@injectable()
@singleton()
export default class GameBooty extends GameBase {
    private readonly bootyIcons: Map<string, ItemIcon> = new Map();

    constructor(
        private readonly state: GameStateService,
        private readonly actionService: ActionService) {
        super(state, actionService);
    }

    protected initialize(): void {
        this.bootyIcons.set('coins', ItemIcon.createItemIcon('coins', this)!);
        this.bootyIcons.set('rubies', ItemIcon.createItemIcon('rubies', this)!);
        this.bootyIcons.get('coins')!.name = 'Coins';
        this.bootyIcons.get('rubies')!.name = 'Rubies';
    }

    public update(): void {
        const coins = this.bootyIcons.get('coins')!;
        const rubies = this.bootyIcons.get('rubies')!;
        coins.quantity = this.state.gameState.state.booty.coins;
        rubies.quantity = this.state.gameState.state.booty.ruby ?? 0;
    }
}
