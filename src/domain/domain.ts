export interface PlayerInfo {
    playerId: string;
    nickname: string;
    class: string;
    level: number;
    unitUid?: number;
    isOffline?: boolean;
    isReady?: boolean;
}

export interface RoomInfo {
    uid: number;
    capacity: number;
    scenarioId: string;
    joinedUsers: PlayerInfo[];
    host: PlayerInfo;
    inactive?: boolean;
}

export interface UnitBooty {
    coins: number;
    ruby?: number;
}

export interface UnitState {
    health: number;
    stamina: number;
    mana: number;
    stress: number;
    isStunned?: boolean;
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
    madness?: number;
    isCritical?: boolean;
    isCriticalMiss?: boolean;
    withStun?: boolean;
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

export interface UnitRequirements extends UnitAttributes {
    class?: string;
}

export interface UnitResistance extends Damage {
}

export interface UnitRecovery extends UnitState, Damage {
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
    canBeThrownAway: boolean;
    canBeSold: boolean;
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
    requirements: UnitRequirements;
    modification: UnitModification[];
}

export interface ActionRange {
    minimumX?: number;
    maximumX?: number;
    minimumY?: number;
    maximumY?: number;
    radius?: number;
}

export interface Weapon extends Equipment {
    ammunitionKind?: string;
    range: ActionRange;
    useCost: UnitBaseAttributes;
    damage: DamageImpact[];
}

export interface Magic extends Item {
    requirements: UnitRequirements;
    range: ActionRange;
    useCost: UnitBaseAttributes;
    damage?: DamageImpact[];
    modification?: UnitModificationImpact[];
}

export interface Armor extends Equipment {
}

export interface Disposable extends Item {
    quantity?: number;
    range: ActionRange;
    damage?: DamageImpact[];
    modification?: UnitModificationImpact[];
}

export interface Ammunition extends Item {
    equipped?: boolean;
    kind: string;
    quantity?: number;
    damage?: DamageImpact[];
}

export type InventoryItem = Weapon | Disposable | Ammunition | Magic | Armor;

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
    experienceNext?: number;
    attributesPoints?: number;
    baseAttributesPoints?: number;
}

export interface UnitStats {
    progress: UnitProgress;
    baseAttributes: UnitBaseAttributes;
    attributes: UnitAttributes;
    resistance: UnitResistance;
}

export interface Unit {
    uid?: number;
    code?: string;
    class?: string;
    name: string;
    booty: UnitBooty;
    state: UnitState;
    stats: UnitStats;
    damage?: DamageImpact[];
    modification?: UnitModificationImpact[];
    inventory: UnitInventory;
    slots: Map<EquipmentSlot, number>;
    position: Position;
}

export enum GameUnitFaction {
    PARTY = 0,
    ENEMY = 1,
}

export interface GameUnit extends Unit {
    faction: GameUnitFaction;
    playerInfo?: PlayerInfo;
    isDead?: boolean;
}

export interface GameShopStatus {
    items: UnitInventory;
    purchase: Map<string, UnitBooty>;
    repair: Map<string, UnitBooty>;
}

export enum GamePhase {
    PREPARE_UNIT = 'prepareUnit',
    READY_FOR_START_ROUND = 'readyForStartRound',
    MAKE_MOVE_OR_ACTION_AI = 'makeMoveOrActionAI',
    MAKE_ACTION_AI = 'makeActionAI',
    MAKE_MOVE_OR_ACTION = 'makeMoveOrAction',
    MAKE_ACTION = 'makeAction',
    RETREAT_ACTION = 'retreatAction',
    ACTION_COMPLETE = 'actionComplete',
    SPOT_COMPLETE = 'spotComplete',
    SCENARIO_COMPLETE = 'scenarioComplete',
}

export interface GameState {
    booty: UnitBooty;
    activeUnitsQueue: number[];
    inactiveUnits: number[];
}

export enum CellType {
    SPACE = 0,
    OBSTACLE = 1,
}

export interface Cell {
    code: string;
    factions: GameUnitFaction[];
    type?: CellType;
}

export interface Battlefield {
    matrix: Cell[][];
    units: GameUnit[];
    corpses: GameUnit[];
}

export interface Spot {
    name: string;
    code: string;
    battlefield: Battlefield;
}

export enum ActionType {
    USE = 'use',
    EQUIP = 'equip',
    UNEQUIP = 'unequip',
    PLACE = 'place',
    MOVE = 'move',
    BUY = 'buy',
    SELL = 'sell',
    REPAIR = 'repair',
    THROW_AWAY = 'throwAway',
    SKIP = 'skip',
    LEVEL_UP = 'levelUp',
    SKILL_UP = 'skillUp',
}

export enum ActionProperty {
    STRENGTH = 'strength',
    PHYSIQUE = 'physique',
    AGILITY = 'agility',
    ENDURANCE = 'endurance',
    INTELLIGENCE = 'intelligence',
    INITIATIVE = 'initiative',
    LUCK = 'luck',
    HEALTH = 'health',
    STAMINA = 'stamina',
    MANA = 'mana',
}

export interface Position {
    x: number;
    y: number;
}

export interface Action {
    action: ActionType;
    uid?: number;
    targetUid?: number;
    itemUid?: number;
    quantity?: number;
    property?: ActionProperty;
    position?: Position;
}

export enum ActionResultType {
    ACCOMPLISHED = 'accomplished',
    NOT_ACCOMPLISHED = 'notAccomplished',
    NOT_ALLOWED = 'notAllowed',
    NOT_FOUND = 'notFound',
    NOT_EMPTY = 'notEmpty',
    NOT_EUIPPED = 'notEquipped',
    NOT_REACHABLE = 'notReachable',
    CANT_USE = 'cantUse',
    OUT_OF_BOUNDS = 'outOfBounds',
    NO_AMMUNITION = 'noAmmunition',
    NOT_COMPATIBLE = 'notCompatible',
    ZERO_QUANTITY = 'zeroQuantity',
    NOT_ENOUGH_SLOTS = 'notEnoughSlots',
    NOT_ENOUGH_RESOURCES = 'notEnoughResources',
    IS_BROKEN = 'isBroken',
}

export interface ActionResult {
    instantDamage?: Damage[];
    temporalDamage?: DamageImpact[];
    instantRecovery?: UnitRecovery[];
    temporalModification?: UnitModificationImpact[];
    experience?: { [key: number]: number };
    booty?: UnitBooty;
    result: ActionResultType;
}

export interface GameUnitActionResult {
    action: Action;
    result: ActionResult;
}

export interface EndRoundResult {
    damage?: { [key: number]: Damage };
    recovery?: { [key: number]: UnitRecovery };
    experience?: { [key: number]: number };
    booty?: UnitBooty;
}

export interface GameEvent {
    phase: GamePhase;
    nextPhase: GamePhase;
    phaseTimeout?: number;
    state: GameState;
    spot: Spot;
    players: PlayerInfo[];
    unitActionResult?: GameUnitActionResult;
    endRoundResult?: EndRoundResult;
}

export interface PlayerJob {
    name: string;
    code: string;
    reward: string;
    duration: number;
    countdown: number;
    requirements?: UnitRequirements;
    description?: string;
}

export interface EmploymentStatus {
    currentJob?: PlayerJob;
    isInProgress?: boolean;
    isComplete?: boolean;
    timeLeft?: number;
    availableJobs: PlayerJob[];
}
