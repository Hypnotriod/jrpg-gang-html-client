import { injectable, singleton } from 'tsyringe';
import { BATTLEFIELD_CONTAINER, BUTTON_LEAVE_GAME, BUTTON_NEXT_PHASE, BUTTON_SKIP, GAME_LOG, ITEM_DESCRIPTION_POPUP, LABEL_GAME_STATUS, UNITS_QUEUE_CONTAINER, UNIT_ITEMS_CONTAINER } from '../../constants/Components';
import { ActionResultType, Ammunition, AtionType, Cell, Disposable, EndTurnResult, GameEvent, GamePhase, GameUnit, GameUnitActionResult, Item, ItemType, PlayerInfo, Position, UnitInventory } from '../../domain/domain';
import { ActionData, GameActionRequestData, RequestType } from '../../dto/requests';
import { GameActionData, GameStateData, PlayerInfoData, Response, UserStateData, UserStatus } from '../../dto/responces';
import GameObjectRenderer from '../../service/GameObjectRenderer';
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
import ObjectDescription from '../ui/popup/ObjectDescription';
import TextField from '../ui/textfield/TextField';
import UnitConfigurator from '../unitconfigurator/UnitConfigurator';

@injectable()
@singleton()
export default class GameScene extends Component implements ServerCommunicatorHandler {
    @component(LABEL_GAME_STATUS, Label)
    private readonly gameStatusLabel: Label;
    @component(GAME_LOG, TextField)
    private readonly gameLog: TextField;
    @component(BUTTON_NEXT_PHASE, Button)
    private readonly nextPhaseButton: Button;
    @component(BUTTON_SKIP, Button)
    private readonly skipButton: Button;
    @component(BUTTON_LEAVE_GAME, Button)
    private readonly leaveGameButton: Button;
    @component(ITEM_DESCRIPTION_POPUP, ObjectDescription)
    private readonly itemDescription: ObjectDescription;
    @component(UNITS_QUEUE_CONTAINER, Container)
    private readonly unitsQueueContainer: Container;

    private readonly unitItems: Map<number, ItemIcon> = new Map();

    private spots: SpotCell[][];

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly configurator: UnitConfigurator,
        private readonly renderer: GameObjectRenderer,
        private readonly state: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.communicator.subscribe([
            RequestType.GAME_STATE,
            RequestType.USER_STATUS,
            RequestType.NEXT_GAME_PHASE,
            RequestType.GAME_ACTION,
            RequestType.PLAYER_INFO,
        ], this);
        this.hide();
        this.nextPhaseButton.onClick = target => this.onNextPhaseClick();
        this.leaveGameButton.onClick = target => this.onLeaveGameClick();
        this.skipButton.onClick = target => this.onSkipButtonClick();
        this.itemDescription.hide();
    }

    public handleServerResponse(response: Response): void {
        switch (response.type) {
            case RequestType.GAME_STATE:
                this.state.gameState = (response.data as GameStateData).gameState;
                this.updatePlayerInfoFromGameState(this.state.gameState);
                this.updateBattleField();
                this.updateUserItems();
                this.updateUnitsQueue();
                break;
            case RequestType.GAME_ACTION:
            case RequestType.NEXT_GAME_PHASE:
                this.state.gameState = (response.data as GameActionData).actionResult;
                this.updatePlayerInfoFromGameState(this.state.gameState);
                this.updateBattleField();
                this.updateUserItems();
                this.updateUnitsQueue();
                this.logAction();
                break;
            case RequestType.PLAYER_INFO:
                this.state.playerInfo = (response.data as PlayerInfoData).playerInfo;
                this.updateUserItems();
                this.updateNextPhaseSkipButton();
                break;
            case RequestType.USER_STATUS:
                const status: UserStatus = (response.data as UserStateData).status;
                if (status !== UserStatus.IN_GAME && this.visible) {
                    this.hide();
                    this.configurator.show();
                }
                break;
        }
    }

    public handleConnectionLost(): void {
        this.hide();
        this.unitItems.forEach(item => item.destroy());
        this.unitItems.clear();
    }

    protected logAction(): void {
        if (this.state.gameState.unitActionResult) {
            const unit: GameUnit = this.findUnitByUid(this.state.gameState.unitActionResult.action.uid!);
            const name: string = this.getUnitName(unit);
            this.gameLog.value =
                this.renderer.header(name, 2) + '<br>' +
                this.renderer.render(this.distinguishUnitActionResult(this.state.gameState.unitActionResult));
        }
        if (this.state.gameState.endRoundResult) {
            this.gameLog.value =
                this.renderer.header('End Round result', 2) + '<br>' +
                this.renderer.render(this.distinguishEndRoundResult(this.state.gameState.endRoundResult));
        }
    }

    protected getUnitName(unit: GameUnit): string {
        return unit.playerInfo ? `${unit.name} (${unit.playerInfo.nickname})` : unit.name;
    }

    protected distinguishEndRoundResult(endRound: EndTurnResult): object {
        const result: any = {};
        Object.keys(endRound.damage).forEach(key => {
            if (!Object.keys(endRound.damage[key]).length) { return; }
            result.damage = result.damage || {};
            const unit = this.findUnitByUid(Number(key));
            result.damage[this.getUnitName(unit)] = endRound.damage[key];
        });
        Object.keys(endRound.recovery).forEach(key => {
            if (!Object.keys(endRound.recovery[key]).length) { return; }
            result.recovery = result.recovery || {};
            const unit = this.findUnitByUid(Number(key));
            result.recovery[this.getUnitName(unit)] = endRound.recovery[key];
        });
        return result;
    }

    protected nullOrEmpty(arr: Array<any>): boolean {
        return !arr || !arr.length;
    }

    protected distinguishUnitActionResult(action: GameUnitActionResult): object {
        const result: any = {
            ...action,
        };
        if (action.action.action === AtionType.USE &&
            action.result.result === ActionResultType.ACCOMPLISHED) {
            if (!action.result.instantDamage &&
                !action.result.instantRecovery &&
                !action.result.temporalDamage &&
                !action.result.temporalModification) {
                result.result.result = 'no success!';
            } else if (this.nullOrEmpty(action.result.instantDamage) &&
                this.nullOrEmpty(action.result.instantRecovery) &&
                this.nullOrEmpty(action.result.temporalDamage) &&
                this.nullOrEmpty(action.result.temporalModification)) {
                result.result.result = 'no effect!';
            }
        }
        const actorUnit = this.findUnitByUid(action.action.uid!);
        const targetUnit = this.findUnitByUid(action.action.targetUid!);
        if (action.action.itemUid) {
            const actorItem = this.findItemInInventory(actorUnit.inventory, action.action.itemUid);
            if (actorItem) {
                result.action.itemUid = undefined;
                result.action.item = actorItem.name;
            }
        }
        if (targetUnit) {
            result.action.targetUid = undefined;
            result.action.target = this.getUnitName(targetUnit);
        }
        return result;
    }

    protected updateBattleField(): void {
        !this.spots && this.initBattlefield();
        this.updateBattlefieldCells();
        this.updateBattleFieldUnits();
        this.updateNextPhaseSkipButton();
        this.gameStatusLabel.value = this.state.gameState.nextPhase;
    }

    protected updateNextPhaseSkipButton(): void {
        const gamePhase: string = this.state.gameState.nextPhase;
        const playerInfo: PlayerInfo | undefined = this.state.playerInfo;
        switch (gamePhase) {
            case GamePhase.READY_FOR_START_ROUND:
            case GamePhase.PREPARE_UNIT:
            case GamePhase.MAKE_MOVE_OR_ACTION_AI:
            case GamePhase.MAKE_ACTION_AI:
            case GamePhase.ACTION_COMPLETE:
            case GamePhase.RETREAT_ACTION:
                playerInfo && playerInfo.isHost ? this.nextPhaseButton.show() : this.nextPhaseButton.hide();
                this.skipButton.hide();
                break;
            default:
                this.nextPhaseButton.hide();
                this.isCurrentUnitTurn() ? this.skipButton.show() : this.skipButton.hide();
                break;
        }
    }

    protected updatePlayerInfoFromGameState(gameState: GameEvent): void {
        if (!this.state.playerInfo) { return; }
        this.state.playerInfo = gameState.players.filter(player => player.nickname === this.state.playerInfo.nickname)[0];
    }

    protected updateBattleFieldUnits(): void {
        const corpses: GameUnit[] = this.state.gameState.spot.battlefield.corpses;
        const units: GameUnit[] = this.state.gameState.spot.battlefield.units;
        corpses && corpses.forEach(corpse => {
            this.spots[corpse.position.x][corpse.position.y].updateWithCorpse(corpse);
        });
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
                spotCell.descriptionPopup = this.itemDescription;
                spotCell.x = Number(x);
                spotCell.y = Number(y);
                this.spots[x][y] = spotCell;
                spotCell.onClick = target => this.onSpotCellClick(target);
            }
        }
        this.communicator.sendMessage(RequestType.PLAYER_INFO);
    }

    protected onSpotCellClick(target: SpotCell): void {
        if (this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT) {
            this.placeUnit({ x: target.x, y: target.y });
        } else if (this.canDoAction() && target.unit) {
            this.useItem(target.unit.uid!);
        } else if (this.state.gameState.nextPhase === GamePhase.MAKE_MOVE_OR_ACTION) {
            this.moveUnit({ x: target.x, y: target.y });
        }
    }

    protected canDoAction(): boolean {
        return this.state.gameState.nextPhase === GamePhase.MAKE_MOVE_OR_ACTION ||
            this.state.gameState.nextPhase === GamePhase.MAKE_ACTION;
    }

    protected canDoUnitConfiguration(): boolean {
        return this.canDoAction() || this.state.gameState.nextPhase === GamePhase.PREPARE_UNIT;
    }

    protected isCurrentUnitTurn(): boolean {
        const activeUnitUid = this.state.gameState.state.activeUnitsQueue[0];
        return Boolean(this.state.playerInfo && this.state.playerInfo.unitUid === activeUnitUid);
    }

    protected placeUnit(position: Position): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: AtionType.PLACE,
            position,
        } as GameActionRequestData);
    }

    protected moveUnit(position: Position): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: AtionType.MOVE,
            position,
        } as GameActionRequestData);
    }

    protected useItem(targetUid: number): void {
        const weapon = this.getChoosedItem();
        if (!weapon) { return; }
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: AtionType.USE,
            itemUid: weapon.data.uid!,
            targetUid,
        } as GameActionRequestData);
    }

    protected getChoosedItem(): ItemIcon | undefined {
        return [...this.unitItems.values()].find(i => i.choosed);
    }

    protected updateUserItems(): void {
        if (!this.state.playerInfo) { return; }
        const unit: GameUnit = this.currentActor();
        this.updateUnitInventoryIcons(unit.inventory);
    }

    protected currentActor(): GameUnit {
        return this.findUnitByUid(this.state.playerInfo.unitUid!);
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

    protected findItemInInventory(inventory: UnitInventory, uid: number): Item | undefined {
        const inventoryItems: Item[] = [
            ...(inventory.weapon || []),
            ...(inventory.ammunition || []),
            ...(inventory.magic || []),
            ...(inventory.armor || []),
            ...(inventory.disposable || []),
        ];
        return inventoryItems.find(i => i.uid === uid);
    }

    protected updateUnitsQueue(): void {
        const units: GameUnit[] = this.state.gameState.state.activeUnitsQueue.map(
            unitUid => this.findUnitByUid(unitUid));
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
        if (!this.canDoUnitConfiguration()) { return; }
        if (target.data.type === ItemType.WEAPON || target.data.type === ItemType.DISPOSABLE) {
            const wansntChoosed = !target.choosed && target.selected;
            this.unitItems.forEach(i => i.unchoose());
            target.choose();
            if (wansntChoosed) { return; }
        }
        if (target.data.type === ItemType.NONE || target.data.type === ItemType.DISPOSABLE) { return; }
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: !(target.data as Ammunition).equipped ? AtionType.EQUIP : AtionType.UNEQUIP,
            itemUid: target.data.uid!,
        } as ActionData);
    }

    protected onNextPhaseClick(): void {
        this.communicator.sendMessage(RequestType.NEXT_GAME_PHASE);
    }

    protected onSkipButtonClick(): void {
        this.communicator.sendMessage(RequestType.GAME_ACTION, {
            uid: this.state.playerInfo.unitUid,
            action: AtionType.SKIP,
        } as ActionData);
    }

    protected onLeaveGameClick(): void {
        this.communicator.sendMessage(RequestType.LEAVE_GAME);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected findUnitByUid(unitUid: number): GameUnit {
        const result: GameUnit | undefined = this.state.gameState.spot.battlefield.units?.find(
            unit => unit.uid === unitUid);
        return result || this.state.gameState.spot.battlefield.corpses?.find(
            unit => unit.uid === unitUid)!;
    }
}
