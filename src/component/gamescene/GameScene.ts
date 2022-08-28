import { injectable, singleton } from 'tsyringe';
import { BATTLEFIELD_CONTAINER, BUTTON_NEXT_PHASE, ITEM_DESCRIPTION_POPUP, LABEL_GAME_STATUS, UNITS_QUEUE_CONTAINER, UNIT_ITEMS_CONTAINER } from '../../constants/Components';
import { Ammunition, AtionType, Cell, Disposable, GamePhase, GameUnit, GameUnitFaction, ItemType, PlayerInfo, Position, UnitInventory } from '../../domain/domain';
import { ActionData, GameActionRequestData, RequestType } from '../../dto/requests';
import { GameActionData, GameStateData, Response } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Button from '../ui/button/Button';
import Container from '../ui/container/Container';
import Icon from '../ui/icon/Icon';
import ItemIcon from '../ui/icon/ItemIcon';
import SpotCell from '../ui/icon/SpotCell';
import Label from '../ui/label/Label';
import ItemDescription from '../ui/popup/ItemDescription';

@injectable()
@singleton()
export default class GameScene extends Component implements ServerCommunicatorHandler {
    @component(LABEL_GAME_STATUS, Label)
    private readonly gameStatusLabel: Label;
    @component(BUTTON_NEXT_PHASE, Button)
    private readonly nextPhaseButton: Button;
    @component(ITEM_DESCRIPTION_POPUP, ItemDescription)
    private readonly itemDescription: ItemDescription;
    @component(UNITS_QUEUE_CONTAINER, Container)
    private readonly unitsQueueContainer: Container;

    private readonly unitItems: Map<number, ItemIcon> = new Map();

    private spots: SpotCell[][];

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.communicator.subscribe([
            RequestType.GAME_STATE,
            RequestType.NEXT_GAME_PHASE,
            RequestType.GAME_ACTION,
        ], this);
        this.hide();
        this.nextPhaseButton.onClick = target => this.onNextPhaseClick();
        this.itemDescription.hide();
    }

    public handleServerResponse(response: Response): void {
        switch (response.type) {
            case RequestType.GAME_STATE:
                this.state.gameState = (response.data as GameStateData).gameState;
                this.updateBattleField();
                this.updateUserItems();
                this.updateUnitsQueue();
                break;
            case RequestType.GAME_ACTION:
            case RequestType.NEXT_GAME_PHASE:
                this.state.gameState = (response.data as GameActionData).actionResult;
                this.updateBattleField();
                this.updateUserItems();
                this.updateUnitsQueue();
                break;
        }
    }

    public handleConnectionLost(): void {
        this.hide();
        this.unitItems.forEach(item => item.destroy());
        this.unitItems.clear();
    }

    protected updateBattleField(): void {
        !this.spots && this.initBattlefield();
        this.updateBattlefieldCells();
        this.updateBattleFieldUnits();
        this.updateNextPhaseButton();
        this.gameStatusLabel.value = this.state.gameState.nextPhase;
    }

    protected updateNextPhaseButton(): void {
        const gamePhase: string = this.state.gameState.nextPhase;
        switch (gamePhase) {
            case GamePhase.READY_FOR_START_ROUND:
            case GamePhase.PREPARE_UNIT:
            case GamePhase.MAKE_MOVE_OR_ACTION_AI:
            case GamePhase.MAKE_ACTION_AI:
            case GamePhase.ACTION_COMPLETE:
                this.nextPhaseButton.enable();
                break;
            default:
                this.nextPhaseButton.disable();
                break;
        }
        const playerInfo: PlayerInfo | undefined = this.currentPlayerInfo();
        if (!playerInfo || !playerInfo.isHost) {
            this.nextPhaseButton.hide();
        } else {
            this.nextPhaseButton.show();
        }
    }

    protected updateBattleFieldUnits(): void {
        const units: GameUnit[] = this.state.gameState.spot.battlefield.units;
        units.forEach(unit => {
            this.spots[unit.position.x][unit.position.y].updateWithUnit(unit);
        });
    }

    protected updateBattlefieldCells(): void {
        const matrix: Cell[][] = this.state.gameState.spot.battlefield.matrix;
        for (const x in matrix) {
            for (const y in matrix[x]) {
                this.spots[x][y].updateWithCell(matrix[x][y]);
            }
        }
    }

    protected initBattlefield(): void {
        const matrix: Cell[][] = this.state.gameState.spot.battlefield.matrix;
        this.spots = [];
        for (const x in matrix) {
            this.spots[x] = [];
            for (const y in matrix[x]) {
                const id: string = `cells_row_${x}`;
                this.create(BATTLEFIELD_CONTAINER, Container, { classList: ['column-container'], id });
                const spotCell: SpotCell = SpotCell.createSpotCell(this, id)!;
                spotCell.x = Number(x);
                spotCell.y = Number(y);
                this.spots[x][y] = spotCell;
                spotCell.onClick = target => this.onSpotCellClick(target);
            }
        }
    }

    protected onSpotCellClick(target: SpotCell): void {
        if (this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) {
            this.placeUnit({ x: target.x, y: target.y });
        }
        if ((this.state.gameState.nextPhase === GamePhase.MAKE_MOVE_OR_ACTION ||
            this.state.gameState.nextPhase === GamePhase.MAKE_ACTION) &&
            target.unit?.faction === GameUnitFaction.ENEMY) {
            this.attackUnit(target.unit.uid!);
        }
        if (this.state.gameState.nextPhase === GamePhase.MAKE_MOVE_OR_ACTION) {
            this.moveUnit({ x: target.x, y: target.y });
        }
    }

    protected placeUnit(position: Position): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            action: AtionType.PLACE,
            position,
        } as GameActionRequestData);
    }

    protected moveUnit(position: Position): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            action: AtionType.MOVE,
            position,
        } as GameActionRequestData);
    }

    protected attackUnit(targetUid: number): void {
        const unit = this.currentActor();
        if (!unit) { return; }
        const weapon = unit.inventory.weapon?.find(weapon => weapon.equipped);
        if (!weapon) { return; }
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            action: AtionType.USE,
            itemUid: weapon.uid!,
            targetUid,
        } as GameActionRequestData);
    }

    protected updateUserItems(): void {
        const playerInfo: PlayerInfo | undefined = this.currentPlayerInfo();
        if (!playerInfo) { return; }
        const unit: GameUnit | undefined = this.state.gameState.spot.battlefield.units.find(
            unit => unit.uid === playerInfo.unitUid);
        if (!unit) { return; }
        this.updateUnitInventoryIcons(unit.inventory);
    }

    protected currentPlayerInfo(): PlayerInfo | undefined {
        return this.state.gameState.players.find(
            player => player.nickname === this.state.userState.playerInfo.nickname);
    }

    protected currentActor(): GameUnit | undefined {
        return this.state.gameState.spot.battlefield.units.find(
            unit => unit.playerInfo?.nickname === this.state.userState.playerInfo.nickname);
    }

    protected updateUnitInventoryIcons(inventory: UnitInventory): void {
        const inventoryItems: (Disposable | Ammunition)[] = [
            ...(inventory.weapon || []),
            ...(inventory.ammunition || []),
            ...(inventory.magic || []),
            ...(inventory.armor || []),
            ...(inventory.disposable || []),
        ];
        inventoryItems.forEach(v => this.updateUnitItem(v));
        this.unitItems.forEach((icon, uid) => {
            if (!inventoryItems.find(i => i.uid === uid)) {
                icon.destroy();
                this.unitItems.delete(uid);
            }
        });
    }

    protected updateUnitsQueue(): void {
        const units: GameUnit[] = this.state.gameState.state.activeUnitsQueue.map(
            unitUid => this.state.gameState.spot.battlefield.units.find(
                unit => unit.uid === unitUid)!);
        this.unitsQueueContainer.removeAllChildren();
        units.forEach(unit => this.updateUnitInQueue(unit));
    }

    protected updateUnitInQueue(data: GameUnit): void {
        const icon: string = data.playerInfo ? data.playerInfo.class! : data.code!;
        Icon.createIcon(icon, this, UNITS_QUEUE_CONTAINER)!;
    }

    protected updateUnitItem(data: Disposable | Ammunition): void {
        let iconItem = this.unitItems.get(data.uid!);
        if (!iconItem) {
            iconItem = ItemIcon.createItemIcon(data.code, this, UNIT_ITEMS_CONTAINER)!;
            iconItem.onClick = target => this.onUnitItemClick(target);
            iconItem.descriptionPopup = this.itemDescription;
        }
        this.unitItems.set(data.uid!, iconItem);
        iconItem.update(data);
    }

    protected onUnitItemClick(target: ItemIcon): void {
        if (target.data.type === ItemType.NONE || target.data.type === ItemType.DISPOSABLE) { return; }
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            action: !(target.data as Ammunition).equipped ? AtionType.EQUIP : AtionType.UNEQUIP,
            itemUid: target.data.uid!,
        } as ActionData);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected onNextPhaseClick(): void {
        this.communicator.sendMessage(RequestType.NEXT_GAME_PHASE);
    }
}
