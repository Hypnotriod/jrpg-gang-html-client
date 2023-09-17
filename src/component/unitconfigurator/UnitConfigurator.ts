import { delay, inject, injectable, singleton } from 'tsyringe';
import { BUTTON_AGILITY, BUTTON_ENDURANCE, BUTTON_HEALTH, BUTTON_INITIATIVE, BUTTON_INTELLIGENCE, BUTTON_JOBS, BUTTON_LEVEL_UP, BUTTON_LOBBY, BUTTON_LUCK, BUTTON_MANA, BUTTON_PHYSIQUE, BUTTON_STAMINA, BUTTON_STRENGTH, CHECKBOX_REPAIR, CHECKBOX_SELL, ITEM_DESCRIPTION_POPUP, LABEL_ACTION_POINTS, LABEL_AGILITY, LABEL_ENDURANCE, LABEL_HEALTH, LABEL_INITIATIVE, LABEL_INTELLIGENCE, LABEL_LUCK, LABEL_MANA, LABEL_PHYSIQUE, LABEL_STAMINA, LABEL_STRENGTH, SHOP_ITEMS_CONTAINER, UNIT_BOOTY, UNIT_ICON, UNIT_INFO, UNIT_ITEMS_CONTAINER, UNIT_PROGRESS, UNIT_RESISTANCE } from '../../constants/Components';
import { ActionType, Ammunition, InventoryItem, ItemType, UnitAttributes, UnitBaseAttributes, UnitInventory, ActionProperty, UnitProgress, UnitResistance, UnitBooty, GameShopStatus } from '../../domain/domain';
import { ActionRequestData, RequestType } from '../../dto/requests';
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

    private readonly unitItems: Map<number, ItemIcon> = new Map();
    private readonly shopItems: Map<number, ItemIcon> = new Map();

    constructor(private readonly communicator: ServerCommunicatorService,
        private readonly state: GameStateService,
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
        this.checkboxSell.onChange = target => this.onCheckboxChange(target);
        this.checkboxRepair.onChange = target => this.onCheckboxChange(target);
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
                break;
            case RequestType.SHOP_STATUS:
                this.state.shopStatus = (response.data as ShopStatusData).shop;
                this.updateShopStatus(response.data as ShopStatusData);
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

    protected updateShopStatus(data: ShopStatusData): void {
        this.updateShopInventoryIcons(data.shop.items);
    }

    protected updateShopInventoryIcons(inventory: UnitInventory): void {
        const inventoryItems: InventoryItem[] = [
            ...(inventory.weapon || []),
            ...(inventory.ammunition || []),
            ...(inventory.magic || []),
            ...(inventory.armor || []),
            ...(inventory.disposable || []),
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
    }

    protected updateUserStatus(data: UserStateData): void {
        this.state.userState = data;
        this.unitIcon.icon = this.state.userState.playerInfo.class;
        this.unitInfo.value = this.state.userState.playerInfo.nickname;
        this.updateUnitInventoryIcons(this.state.userState.unit.inventory);
        this.updateBooty();
        this.updateResistance();
        this.updateProgress();
        this.updateUnitAttributes();
    }

    protected updateBooty(): void {
        const bt: UnitBooty = this.state.userState.unit.booty;
        this.unitBooty.value = `Coins: ${bt.coins}<br>
                                Ruby: ${bt.ruby || 0}<br>
                               `;

    }

    protected updateResistance(): void {
        const res: UnitResistance = this.state.userState.unit.stats.resistance;
        this.unitResistance.value = `Stabbing: ${res.stabbing || 0}<br>
                                     Cutting: ${res.cutting || 0}<br>
                                     Crushing: ${res.crushing || 0}<br>
                                     Fire: ${res.fire || 0}<br>
                                     Cold: ${res.cold || 0}<br>
                                     Lightning: ${res.lightning || 0}<br>
                                     Poison: ${res.poison || 0}<br>
                                     Exhaustion: ${res.exhaustion || 0}<br>
                                     ManaDrain: ${res.manaDrain || 0}<br>
                                     Bleeding: ${res.bleeding || 0}<br>
                                     Fear: ${res.fear || 0}<br>
                                     Curse: ${res.curse || 0}<br>
                                     Madness: ${res.madness || 0}<br>
                                     `;

    }

    protected updateProgress(): void {
        const pr: UnitProgress = this.state.userState.unit.stats.progress;
        this.unitProgress.value = `Level: ${pr.level}<br>
                                   Exp: ${pr.experience} / ${pr.experienceNext}<br>
                                   Base Attr Points: ${pr.baseAttributesPoints || 0}<br>
                                   Attr Points: ${pr.attributesPoints || 0}<br>
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

        this.labelHealth.value = `Health: ${battr.health || 0}`;
        this.labelStamina.value = `Stamina: ${battr.stamina || 0}`;
        this.labelMana.value = `Mana: ${battr.mana || 0}`;
        this.labelActionPoints.value = `Action Points: ${battr.actionPoints + Math.floor(attr.initiative / 10) || 0}`;
        this.labelStrength.value = `Strength: ${attr.strength || 0}`;
        this.labelPhysique.value = `Physique: ${attr.physique || 0}`;
        this.labelAgility.value = `Agility: ${attr.agility || 0}`;
        this.labelEndurance.value = `Endurance: ${attr.endurance || 0}`;
        this.labelIntelligence.value = `Intelligence: ${attr.intelligence || 0}`;
        this.labelInitiative.value = `Initiative: ${attr.initiative || 0}`;
        this.labelLuck.value = `Luck: ${attr.luck || 0}`;
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
}
