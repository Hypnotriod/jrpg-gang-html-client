export interface PlayerInfo {
    nickname: string;
    class: string;
    level: number;
    isOffline?: boolean;
}

export interface RoomInfo {
    uid: number;
    capacity: number;
    scenarioId: string;
    joinedUsers: PlayerInfo[];
    host: PlayerInfo;
}

export interface UnitBooty {
    coins: number;
    ruby?: number;
}

export interface UnitState {
    health: number;
    stamina: number;
    mana: number;
    fear: number;
    curse: number;
}

export interface Damage {
    stabbing?: number;
    cutting?: number;
    crushing?: number;
    fire?: number;
    cold?: number;
    lighting?: number;
    poison?: number;
    exhaustion?: number;
    manaDrain?: number;
    bleeding?: number;
    fear?: number;
    curse?: number;
    isCritical?: number;
}

export interface UnitBaseAttributes {
    health: number;
    stamina: number;
    mana: number;
}

export interface UnitAttributes {
    strength: number;
    physique: number;
    agility: number;
    endurance: number;
    intelligence: number;
    initiative: number;
    luck: number;
}

export interface UnitResistance extends Damage {
}

export interface UnitRecovery extends UnitState {
}

export interface UnitModification {
    baseAttributes?: UnitBaseAttributes;
    attributes?: UnitAttributes;
    resistance?: UnitResistance;
    damage?: Damage;
    recovery?: UnitRecovery;
}

export interface DamageImpact extends Damage {
    duration?: number;
    chance?: number;
}

export interface UnitModificationImpact extends UnitModification {
    duration?: number;
    chance?: number;
}

export enum ItemType {
    ARMOR = 'armor',
    WEAPON = 'weapon',
    MAGIC = 'magic',
    DISPOSABLE = 'disposable',
    AMMUNITION = 'ammunition',
    NONE = 'none',
}

export interface Item {
    uid?: number;
    code: string;
    name: string;
    type: ItemType;
    price: UnitBooty;
    description?: string;
}

export enum EquipmentSlot {
    HEAD = 'head',
    NECK = 'neck',
    BODY = 'body',
    HAND = 'hand',
    LEG = 'leg',
    WEAPON = 'weapon',
}

export interface Equipment extends Item {
    wearout: number;
    durability: number;
    slot: EquipmentSlot;
    slotsNumber: number;
    equipped: boolean;
    requirements: UnitAttributes;
    modification: UnitModification[];
}

export interface ActionRange {
    minimumX?: number;
    maximumX?: number;
    minimumY?: number;
    maximumY?: number;
    radiusX?: number;
    radiusY?: number;
}

export interface Weapon extends Equipment {
    ammunitionKind?: string;
    range: ActionRange;
    useCost: UnitBaseAttributes;
    damage: DamageImpact[];
}

export interface Magic extends Item {
    requirements: UnitAttributes;
    range: ActionRange;
    useCost: UnitBaseAttributes;
    damage?: DamageImpact[];
    modification?: UnitModificationImpact[];
}

export interface Armor extends Equipment {
}

export interface Disposable extends Item {
    quantity?: number;
    damage?: DamageImpact[];
    modification?: UnitModificationImpact[];
}

export interface Ammunition extends Item {
    equipped?: boolean;
    kind: string;
    quantity?: number;
    damage?: DamageImpact[];
}

export interface UnitInventory {
    weapon?: Weapon[];
    magic?: Magic[];
    armor?: Armor[];
    disposable?: Disposable[];
    ammunition?: Ammunition[];
}

export interface Position {
    x: number;
    y: number;
}

export interface UnitProgress {
    level: number;
    experience: number;
}

export interface UnitStats {
    progress: UnitProgress;
    baseAttributes: UnitBaseAttributes;
    attributes: UnitAttributes;
    resistance: UnitResistance;
}

export interface Unit {
    uid?: number;
    name: string;
    booty: UnitBooty;
    state: UnitState;
    stats: UnitStats;
    damage: DamageImpact[];
    modification: UnitModificationImpact[];
    inventory: UnitInventory;
    slots: Map<EquipmentSlot, number>;
    position: Position;
}

export interface GameUnit extends Unit {
    faction: null;
    playerInfo?: PlayerInfo;
}

export interface GameShop {
    items: UnitInventory;
}
