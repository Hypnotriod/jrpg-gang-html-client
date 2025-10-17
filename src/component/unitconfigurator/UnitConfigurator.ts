import { delay, inject, injectable, singleton } from 'tsyringe';
import { BUTTON_AGILITY, BUTTON_ENDURANCE, BUTTON_HEALTH, BUTTON_INITIATIVE, BUTTON_INTELLIGENCE, BUTTON_JOBS, BUTTON_LEVEL_UP, BUTTON_LOBBY, BUTTON_LUCK, BUTTON_MANA, BUTTON_NEXT, BUTTON_PHYSIQUE, BUTTON_PREVIOUS, BUTTON_SORT, BUTTON_STAMINA, BUTTON_STRENGTH, CHECKBOX_REPAIR, CHECKBOX_SELL, ITEM_DESCRIPTION_POPUP, LABEL_ACTION_POINTS, LABEL_AGILITY, LABEL_CLASS, LABEL_ENDURANCE, LABEL_HEALTH, LABEL_INITIATIVE, LABEL_INTELLIGENCE, LABEL_LUCK, LABEL_MANA, LABEL_PHYSIQUE, LABEL_STAMINA, LABEL_STRENGTH, SHOP_ITEMS_CONTAINER, UNIT_BOOTY, UNIT_ICON, UNIT_INFO, UNIT_ITEMS_CONTAINER, UNIT_PROGRESS, UNIT_RESISTANCE } from '../../constants/Components';
import { ActionType, Ammunition, InventoryItem, ItemType, UnitAttributes, UnitBaseAttributes, UnitInventory, ActionProperty, UnitProgress, UnitResistance, UnitBooty, GameShopStatus, Equipment, UnitModification } from '../../domain/domain';
import { ActionRequestData, RequestType, SwitchUnitRequestData } from '../../dto/requests';
import { Response, ResponseStatus, ShopStatusData, UserStateData } from '../../dto/responces';
import GameStateService from '../../service/GameStateService';
import ServerCommunicatorService, { ServerCommunicatorHandler } from '../../service/ServerCommunicatorService';
import Component from '../Component';
import { component } from '../decorator/decorator';
import Jobs from '../jobs/Jobs';
import Lobby from '../lobby/Lobby';
import Button from '../ui/button/Button';
import Checkbox from '../ui/checkbox/Checkbox';
import Container from '../ui/container/Container';
import Icon from '../ui/icon/Icon';
import ItemIcon from '../ui/icon/ItemIcon';
import ShopItemIcon from '../ui/icon/ShopItemIcon';
import Label from '../ui/label/Label';
import ObjectDescription from '../ui/popup/ObjectDescription';
import { USER_CLASSES } from '../../constants/Configuration';
import GameObjectRenderer from '../../service/GameObjectRenderer';

@singleton()
@injectable()
export default class UnitConfigurator extends Component implements ServerCommunicatorHandler {
    @component(BUTTON_LOBBY, Button)
    private readonly lobbyButton: Button;
    @component(BUTTON_JOBS, Button)
    private readonly jobsButton: Button;
    @component(UNIT_ICON, Icon)
    private readonly unitIcon: Icon;
    @component(UNIT_INFO, Container)
    private readonly unitInfo: Container;
    @component(UNIT_BOOTY, Container)
    private readonly unitBooty: Container;
    @component(UNIT_PROGRESS, Container)
    private readonly unitProgress: Container;
    @component(BUTTON_HEALTH, Button)
    private readonly btnHealth: Button;
    @component(BUTTON_STAMINA, Button)
    private readonly btnStamina: Button;
    @component(BUTTON_MANA, Button)
    private readonly btnMana: Button;
    @component(BUTTON_STRENGTH, Button)
    private readonly btnStrength: Button;
    @component(BUTTON_PHYSIQUE, Button)
    private readonly btnPhysique: Button;
    @component(BUTTON_AGILITY, Button)
    private readonly btnAgility: Button;
    @component(BUTTON_ENDURANCE, Button)
    private readonly btnEndurance: Button;
    @component(BUTTON_INTELLIGENCE, Button)
    private readonly btnIntelligence: Button;
    @component(BUTTON_INITIATIVE, Button)
    private readonly btnInitiative: Button;
    @component(BUTTON_LUCK, Button)
    private readonly btnLuck: Button;
    @component(BUTTON_PREVIOUS, Button)
    private readonly btnUnitPrevious: Button;
    @component(BUTTON_NEXT, Button)
    private readonly btnUnitNext: Button;
    @component(LABEL_CLASS, Label)
    private readonly labelClass: Label;
    @component(LABEL_HEALTH, Label)
    private readonly labelHealth: Label;
    @component(LABEL_STAMINA, Label)
    private readonly labelStamina: Label;
    @component(LABEL_MANA, Label)
    private readonly labelMana: Label;
    @component(LABEL_ACTION_POINTS, Label)
    private readonly labelActionPoints: Label;
    @component(LABEL_STRENGTH, Label)
    private readonly labelStrength: Label;
    @component(LABEL_PHYSIQUE, Label)
    private readonly labelPhysique: Label;
    @component(LABEL_AGILITY, Label)
    private readonly labelAgility: Label;
    @component(LABEL_ENDURANCE, Label)
    private readonly labelEndurance: Label;
    @component(LABEL_INTELLIGENCE, Label)
    private readonly labelIntelligence: Label;
    @component(LABEL_INITIATIVE, Label)
    private readonly labelInitiative: Label;
    @component(LABEL_LUCK, Label)
    private readonly labelLuck: Label;
    @component(UNIT_RESISTANCE, Container)
    private readonly unitResistance: Container;
    @component(ITEM_DESCRIPTION_POPUP, ObjectDescription)
    private readonly itemDescription: ObjectDescription;
    @component(CHECKBOX_SELL, Checkbox)
    private readonly checkboxSell: Checkbox;
    @component(CHECKBOX_REPAIR, Checkbox)
    private readonly checkboxRepair: Checkbox;
    @component(BUTTON_LEVEL_UP, Button)
    private readonly btnLevelUp: Button;
    @component(BUTTON_SORT, Button)
    private readonly btnSort: Button;

    private readonly unitItems: Map<number, ItemIcon> = new Map();
    private readonly shopItems: Map<number, ItemIcon> = new Map();

    constructor(
        private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService,
        private readonly renderer: GameObjectRenderer,
        // @ts-ignore
        @inject(delay(() => Lobby)) private readonly lobby: Lobby,
        // @ts-ignore
        @inject(delay(() => Jobs)) private readonly jobs: Jobs) {
        super();
    }

    public show(): void {
        this.unitItems.forEach(item => item.destroy());
        this.unitItems.clear();
        this.communicator.sendMessage(RequestType.SHOP_STATUS);
        this.communicator.sendMessage(RequestType.USER_STATUS);
        super.show();
    }

    protected initialize(): void {
        this.hide();
        this.addHorizontalScroll(this.findChild(UNIT_ITEMS_CONTAINER)!, 78);
        this.itemDescription.hide();
        this.communicator.subscribe([RequestType.USER_STATUS, RequestType.JOIN, RequestType.SHOP_STATUS], this);
        this.lobbyButton.onClick = target => this.goToLobby();
        this.jobsButton.onClick = target => this.goToJobs();
        this.btnHealth.onClick = target => this.skillUp(ActionProperty.HEALTH);
        this.btnStamina.onClick = target => this.skillUp(ActionProperty.STAMINA);
        this.btnMana.onClick = target => this.skillUp(ActionProperty.MANA);
        this.btnStrength.onClick = target => this.skillUp(ActionProperty.STRENGTH);
        this.btnPhysique.onClick = target => this.skillUp(ActionProperty.PHYSIQUE);
        this.btnAgility.onClick = target => this.skillUp(ActionProperty.AGILITY);
        this.btnEndurance.onClick = target => this.skillUp(ActionProperty.ENDURANCE);
        this.btnIntelligence.onClick = target => this.skillUp(ActionProperty.INTELLIGENCE);
        this.btnInitiative.onClick = target => this.skillUp(ActionProperty.INITIATIVE);
        this.btnLuck.onClick = target => this.skillUp(ActionProperty.LUCK);
        this.btnLevelUp.onClick = target => this.levelUp();
        this.btnSort.onClick = target => this.show();
        this.btnUnitPrevious.onClick = target => this.previousUnit();
        this.btnUnitNext.onClick = target => this.nextUnit();
        this.checkboxSell.onChange = target => this.onCheckboxChange(target);
        this.checkboxRepair.onChange = target => this.onCheckboxChange(target);

        this.labelHealth.descriptionPopup = this.itemDescription;
        this.labelStamina.descriptionPopup = this.itemDescription;
        this.labelMana.descriptionPopup = this.itemDescription;
        this.labelActionPoints.descriptionPopup = this.itemDescription;
        this.labelStrength.descriptionPopup = this.itemDescription;
        this.labelPhysique.descriptionPopup = this.itemDescription;
        this.labelAgility.descriptionPopup = this.itemDescription;
        this.labelEndurance.descriptionPopup = this.itemDescription;
        this.labelIntelligence.descriptionPopup = this.itemDescription;
        this.labelInitiative.descriptionPopup = this.itemDescription;
        this.labelLuck.descriptionPopup = this.itemDescription;

        this.labelHealth.description = { Health: 'The hit points a unit can take before dying' };
        this.labelStamina.description = { Stamina: 'A weapon may require stamina points to perform an action' };
        this.labelMana.description = { Mana: 'A weapon or spell may require mana points to perform an action' };
        this.labelActionPoints.description = { ActionPoints: 'A weapon, spell, or disposable item may require action points to perform an action' };
        this.labelStrength.description = { Strength: 'Enhances stabbing, cutting, crushing, and bleeding damage' };
        this.labelPhysique.description = { Physique: 'Affects stun chance. For every 10 points, adds 1 point to all physical resistances' };
        this.labelAgility.description = { Agility: 'Affects attack/dodge chance' };
        this.labelEndurance.description = { Endurance: 'Affects stamina recovery' };
        this.labelIntelligence.description = { Intelligence: 'Enhances fire, cold, lightning, exhaustion, manaDrain, fear, curse, and madness damage.Multiplies by 1% all the modification points' };
        this.labelInitiative.description = { Initiative: 'Affects turn order. For every 10 points, adds 1 action point' };
        this.labelLuck.description = { Luck: 'Affects critical chance' };
    }

    protected goToLobby(): void {
        this.hide();
        this.communicator.sendMessage(RequestType.ENTER_LOBBY);
        this.lobby.show();
    }

    protected goToJobs(): void {
        this.hide();
        this.jobs.show();
    }

    public handleServerResponse(response: Response): void {
        if (response.status !== ResponseStatus.OK) { return; }
        switch (response.type) {
            case RequestType.JOIN:
            case RequestType.USER_STATUS:
                this.updateUserStatus(response.data as UserStateData);
                this.state.shopStatus && this.updateShopStatus(this.state.shopStatus);
                break;
            case RequestType.SHOP_STATUS:
                this.state.shopStatus = (response.data as ShopStatusData).shop;
                this.updateShopStatus(this.state.shopStatus);
                break;
        }
    }

    public handleConnectionLost(): void {
        this.unitItems.forEach(item => item.destroy());
        this.shopItems.forEach(item => item.destroy());
        this.unitItems.clear();
        this.shopItems.clear();
        this.hide();
    }

    protected updateShopStatus(data: GameShopStatus): void {
        this.updateShopInventoryIcons(data.items);
    }

    protected updateShopInventoryIcons(inventory: UnitInventory): void {
        const inventoryItems: InventoryItem[] = [
            ...(inventory.weapon || []),
            ...(inventory.ammunition || []),
            ...(inventory.magic || []),
            ...(inventory.armor || []),
            ...(inventory.disposable || []),
            ...(inventory.provision || []),
        ];
        inventoryItems.forEach(v => this.updateShopItem(v));
        this.shopItems.forEach((icon, uid) => {
            if (!inventoryItems.find(i => i.uid === uid)) {
                icon.destroy();
                this.shopItems.delete(uid);
            }
        });
    }

    protected updateShopItem(data: InventoryItem): void {
        let iconItem = this.shopItems.get(data.uid!);
        if (!iconItem) {
            iconItem = ShopItemIcon.createShopItemIcon(data.code, this, SHOP_ITEMS_CONTAINER)!;
            iconItem.onClick = target => this.onShopItemClick(target);
            iconItem.descriptionPopup = this.itemDescription;
        }
        this.shopItems.set(data.uid!, iconItem);
        iconItem.update(data);
        this.state.checkPrice(data.price) ? iconItem.enable() : iconItem.disable();
    }

    protected updateUserStatus(data: UserStateData): void {
        this.state.userState = data;
        this.unitIcon.icon = this.state.userState.playerInfo.class;
        this.unitInfo.value = this.state.userState.playerInfo.nickname;
        this.labelClass.value = this.state.userState.playerInfo.class;
        this.updateUnitInventoryIcons(this.state.userState.unit.inventory);
        this.updateBooty();
        this.updateResistance();
        this.updateProgress();
        this.updateUnitAttributes();
        this.updateActiveItems();
    }

    protected updateBooty(): void {
        const bt: UnitBooty = this.state.userState.unit.booty;
        this.unitBooty.value = `${this.keyValue('Coins', bt.coins)}<br>
                                ${this.keyValue('Ruby', bt.ruby || 0)}<br>
                               `;

    }

    protected updateResistance(): void {
        const res: UnitResistance = this.state.userState.unit.stats.resistance;
        this.unitResistance.value = `${this.keyValue('Stabbing', res.stabbing || 0)}${this.extraResist('stabbing')}<br>
                                     ${this.keyValue('Cutting', res.cutting || 0)}${this.extraResist('cutting')}<br>
                                     ${this.keyValue('Crushing', res.crushing || 0)}${this.extraResist('crushing')}<br>
                                     ${this.keyValue('Fire', res.fire || 0)}${this.extraResist('fire')}<br>
                                     ${this.keyValue('Cold', res.cold || 0)}${this.extraResist('cold')}<br>
                                     ${this.keyValue('Lightning', res.lightning || 0)}${this.extraResist('lightning')}<br>
                                     ${this.keyValue('Poison', res.poison || 0)}${this.extraResist('poison')}<br>
                                     ${this.keyValue('Exhaustion', res.exhaustion || 0)}${this.extraResist('exhaustion')}<br>
                                     ${this.keyValue('ManaDrain', res.manaDrain || 0)}${this.extraResist('manaDrain')}<br>
                                     ${this.keyValue('Bleeding', res.bleeding || 0)}${this.extraResist('bleeding')}<br>
                                     ${this.keyValue('Fear', res.fear || 0)}${this.extraResist('fear')}<br>
                                     ${this.keyValue('Curse', res.curse || 0)}${this.extraResist('curse')}<br>
                                     ${this.keyValue('Madness', res.madness || 0)}${this.extraResist('madness')}<br>
                                     `;

    }

    protected updateProgress(): void {
        const pr: UnitProgress = this.state.userState.unit.stats.progress;
        this.unitProgress.value = `${this.keyValue('Level', pr.level)}<br>
                                   ${this.keyValue('Exp', pr.experience, pr.experienceNext)}<br>
                                   ${this.keyValue('Base Attr Points', pr.baseAttributesPoints || 0)}<br>
                                   ${this.keyValue('Attr Points', pr.attributesPoints || 0)}<br>
                                   `;
        pr.experience >= pr.experienceNext! ? this.btnLevelUp.show() : this.btnLevelUp.hide();
    }

    protected updateUnitAttributes(): void {
        const hasBaseAttributes: boolean = Boolean(this.state.userState.unit.stats.progress.baseAttributesPoints);
        const hasAttributes: boolean = Boolean(this.state.userState.unit.stats.progress.attributesPoints);
        const battr: UnitBaseAttributes = this.state.userState.unit.stats.baseAttributes;
        const attr: UnitAttributes = this.state.userState.unit.stats.attributes;

        hasBaseAttributes ? this.btnHealth.show() : this.btnHealth.hide();
        hasBaseAttributes ? this.btnStamina.show() : this.btnStamina.hide();
        hasBaseAttributes ? this.btnMana.show() : this.btnMana.hide();
        hasAttributes ? this.btnStrength.show() : this.btnStrength.hide();
        hasAttributes ? this.btnPhysique.show() : this.btnPhysique.hide();
        hasAttributes ? this.btnAgility.show() : this.btnAgility.hide();
        hasAttributes ? this.btnEndurance.show() : this.btnEndurance.hide();
        hasAttributes ? this.btnIntelligence.show() : this.btnIntelligence.hide();
        hasAttributes ? this.btnInitiative.show() : this.btnInitiative.hide();
        hasAttributes ? this.btnLuck.show() : this.btnLuck.hide();

        this.labelHealth.htmlValue = this.keyValue('Health', battr.health || 0);
        this.labelStamina.htmlValue = this.keyValue('Stamina', battr.stamina || 0);
        this.labelMana.htmlValue = this.keyValue('Mana', battr.mana || 0);
        this.labelActionPoints.htmlValue =
            this.keyValue('Action Points', battr.actionPoints) +
            this.extraValue(Math.floor(attr.initiative / 10));

        this.labelStrength.htmlValue = this.keyValue('Strength', attr.strength || 0);
        this.labelPhysique.htmlValue = this.keyValue('Physique', attr.physique || 0);
        this.labelAgility.htmlValue = this.keyValue('Agility', attr.agility || 0);
        this.labelEndurance.htmlValue = this.keyValue('Endurance', attr.endurance || 0);
        this.labelIntelligence.htmlValue = this.keyValue('Intelligence', attr.intelligence || 0);
        this.labelInitiative.htmlValue = this.keyValue('Initiative', attr.initiative || 0);
        this.labelLuck.htmlValue = this.keyValue('Luck', attr.luck || 0);
    }

    protected extraResist(key: string): string {
        const extra = ['stabbing', 'cutting', 'crushing', 'fire', 'cold', 'lightning'].includes(key) ?
            Math.floor(this.state.userState.unit.stats.attributes.physique / 10) : 0;
        const value = (this.state.userState.unit.inventory
            .armor?.reduce((acc, a) => acc + this.totalModification(a, key), 0) || 0) + extra;
        return this.extraValue(value);
    }

    protected extraValue(value): string {
        if (!value) return '';
        return value > 0 ?
            ` <span class="light-green lighten-1">+${value}</span>` :
            ` <span class="red lighten-1">${value}</span>`;
    }

    protected totalModification(equipment: Equipment, key: string): number {
        if (!equipment.equipped) return 0;
        return equipment.modification.reduce((acc, m) => acc + m.resistance?.[key] || 0, 0);
    }

    protected keyValue(key: string, value?: number, valueOf?: number): string {
        return valueOf === undefined ?
            `<span class="orange-text text-lighten-1" style="padding: 0;">${key}</span> ${value || 0}` :
            `<span class="orange-text text-lighten-1" style="padding: 0;">${key}</span> ${value || 0} / ${valueOf}`;
    }

    protected objValues(obj: Object): string {
        let result = '';
        Object.keys(obj).forEach(key => result +=
            (obj[key] instanceof Object ?
                `${key}:<br> ${this.objValues(obj[key])}` :
                `${key}: ${obj[key]}<br>`));
        return result;
    }

    protected updateUnitInventoryIcons(inventory: UnitInventory): void {
        const inventoryItems: InventoryItem[] = [
            ...(inventory.weapon || []),
            ...(inventory.ammunition || []),
            ...(inventory.magic || []),
            ...(inventory.armor || []),
            ...(inventory.disposable || []),
            ...(inventory.provision || []),
        ];
        inventoryItems.forEach(v => this.updateUnitItem(v));
        this.unitItems.forEach((icon, uid) => {
            if (!inventoryItems.find(i => i.uid === uid)) {
                icon.destroy();
                this.unitItems.delete(uid);
            }
        });
    }

    protected updateUnitItem(data: InventoryItem): void {
        let iconItem = this.unitItems.get(data.uid!);
        if (this.state.shopStatus && this.state.shopStatus.purchase[data.uid!]) {
            (data as any).purchasePrice = this.state.shopStatus.purchase[data.uid!];
        }
        if (this.state.shopStatus && this.state.shopStatus.repair[data.uid!]) {
            (data as any).repairPrice = this.state.shopStatus.repair[data.uid!];
        }
        if (!iconItem) {
            iconItem = ItemIcon.createItemIcon(data.code, this, UNIT_ITEMS_CONTAINER)!;
            iconItem.onClick = target => this.onUnitItemClick(target);
            iconItem.descriptionPopup = this.itemDescription;
        }
        this.unitItems.set(data.uid!, iconItem);
        iconItem.update(data);
    }

    protected onCheckboxChange(target: Checkbox): void {
        if (target.checked && target === this.checkboxSell) {
            this.checkboxRepair.checked = false;
        } else if (target.checked && target === this.checkboxRepair) {
            this.checkboxSell.checked = false;
        }
        this.updateActiveItems();
    }

    protected onUnitItemClick(target: ItemIcon): void {
        if (this.checkboxSell.checked) {
            this.sellItem(target);
        } else if (this.checkboxRepair.checked) {
            this.repairItem(target);
        } else {
            this.euipUneuipItem(target);
        }
    }

    protected updateActiveItems(): void {
        this.unitItems.forEach(item => {
            if (this.checkboxSell.checked) {
                item.data.canBeSold ? item.enable() : item.disable();
            } else if (this.checkboxRepair.checked) {
                (item.data as Equipment).wearout ? item.enable() : item.disable();
            } else {
                item.enable();
            }
        })
    }

    protected euipUneuipItem(target: ItemIcon): void {
        if (target.data.type === ItemType.NONE || target.data.type === ItemType.DISPOSABLE) { return; }
        this.communicator.sendMessage(RequestType.CONFIGURATION_ACTION, {
            action: !(target.data as Ammunition).equipped ? ActionType.EQUIP : ActionType.UNEQUIP,
            itemUid: target.data.uid!,
        } as ActionRequestData);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected skillUp(skill: ActionProperty): void {
        this.communicator.sendMessage(RequestType.CONFIGURATION_ACTION, {
            action: ActionType.SKILL_UP,
            property: skill,
        } as ActionRequestData);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected levelUp(): void {
        this.communicator.sendMessage(RequestType.CONFIGURATION_ACTION, {
            action: ActionType.LEVEL_UP,
        } as ActionRequestData);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected sellItem(target: ItemIcon): void {
        this.communicator.sendMessage(RequestType.SHOP_ACTION, {
            action: ActionType.SELL,
            itemUid: target.data.uid!,
        } as ActionRequestData);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected repairItem(target: ItemIcon): void {
        this.communicator.sendMessage(RequestType.SHOP_ACTION, {
            action: ActionType.REPAIR,
            itemUid: target.data.uid!,
        } as ActionRequestData);
        this.communicator.sendMessage(RequestType.SHOP_STATUS);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected onShopItemClick(target: ItemIcon): void {
        this.communicator.sendMessage(RequestType.SHOP_ACTION, {
            action: ActionType.BUY,
            itemUid: target.data.uid!,
        } as ActionRequestData);
        this.communicator.sendMessage(RequestType.SHOP_STATUS);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected previousUnit(): void {
        let n = (USER_CLASSES.indexOf(this.state.userState.playerInfo.class) + 1) % USER_CLASSES.length;
        this.communicator.sendMessage(RequestType.SWITCH_UNIT, {
            class: USER_CLASSES[n],
        } as SwitchUnitRequestData);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }

    protected nextUnit(): void {
        let n = (USER_CLASSES.indexOf(this.state.userState.playerInfo.class) + USER_CLASSES.length - 1) % USER_CLASSES.length;
        this.communicator.sendMessage(RequestType.SWITCH_UNIT, {
            class: USER_CLASSES[n],
        } as SwitchUnitRequestData);
        this.communicator.sendMessage(RequestType.USER_STATUS);
    }
}
