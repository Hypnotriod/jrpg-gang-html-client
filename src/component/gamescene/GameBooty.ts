import { injectable, singleton } from 'tsyringe';
import ActionService from '../../service/ActionService';
import GameStateService from '../../service/GameStateService';
import ItemIcon from '../ui/icon/ItemIcon';
import GameBase from './GameBase';

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
        this.bootyIcons.set('ruby', ItemIcon.createItemIcon('ruby', this)!);
        this.bootyIcons.get('coins')!.name = 'Coins';
        this.bootyIcons.get('ruby')!.name = 'Ruby';
    }

    public update(): void {
        this.bootyIcons.get('coins')!.quantity = this.state.gameState.state.booty.coins;
        this.bootyIcons.get('ruby')!.quantity = this.state.gameState.state.booty.ruby || 0;
    }
}
