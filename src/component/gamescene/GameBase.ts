import { ChatState, GamePhase, GameUnit, GameUnitFaction, Item, UnitInventory } from '../../domain/domain';
import ActionService from '../../service/ActionService';
import GameStateService from '../../service/GameStateService';
import Component from '../Component';

export default class GameBase extends Component {
    protected chatState: ChatState;

    constructor(
        private readonly _state: GameStateService,
        private readonly _actionService: ActionService) {
        super();
    }

    protected initialize(): void {
    }

    protected canDoUnitConfiguration(): boolean {
        return this.canDoAction() ||
            this._state.gameState.nextPhase === GamePhase.PREPARE_UNIT ||
            this._state.gameState.nextPhase === GamePhase.SPOT_COMPLETE;
    }

    protected canUseItem(): boolean {
        return this.canDoAction() || this._state.gameState.nextPhase === GamePhase.SPOT_COMPLETE;
    }

    protected canDoAction(): boolean {
        return this._state.gameState.nextPhase === GamePhase.TAKE_ACTION;
    }

    public playersUnit(): GameUnit {
        return this.findUnitByUid(this._state.playerInfo?.unitUid ?? 0);
    }

    protected allActors(): GameUnit[] {
        return this._state.gameState.spot.battlefield.units?.filter(unit => Boolean(unit.faction === GameUnitFaction.PARTY)) ?? [];
    }

    protected allEnemiesAreDefeated(): boolean {
        return (this._state.gameState.spot.battlefield.units ?? []).length === this.allActors().length;
    }

    protected currentUnit(): GameUnit | undefined {
        const uid: number = this._state.gameState.state.activeUnitsQueue[0];
        if (!uid) { return undefined; }
        return this.findUnitByUid(uid);
    }

    public isCurrentUnitTurn(): boolean {
        const activeUnitUid = this._state.gameState.state.activeUnitsQueue[0];
        return Boolean(this._state.playerInfo?.unitUid === activeUnitUid);
    }

    protected isCurrentPlayerId(playerId: string): boolean {
        return this._state.playerInfo?.playerId === playerId;
    }

    protected isCurrentPlayerUnitId(uid: number): boolean {
        return this._state.playerInfo?.unitUid === uid;
    }

    protected findUnitByUid(unitUid: number): GameUnit {
        return this._state.gameState.spot.battlefield.units?.find(unit => unit.uid === unitUid)
            ?? this._state.gameState.spot.battlefield.corpses?.find(unit => unit.uid === unitUid)!;
    }

    protected getUnitName(unit: GameUnit): string {
        return unit.playerInfo ? `${unit.name} (${unit.playerInfo.nickname})` : (`${unit.name}`);
    }


    protected findItemInInventory(inventory: UnitInventory, uid: number): Item | undefined {
        const inventoryItems: Item[] = [
            ...(inventory.weapon || []),
            ...(inventory.ammunition || []),
            ...(inventory.magic || []),
            ...(inventory.armor || []),
            ...(inventory.disposable || []),
            ...(inventory.provision || []),
        ];
        return inventoryItems.find(i => i.uid === uid);
    }
}
