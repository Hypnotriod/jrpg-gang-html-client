import { singleton } from 'tsyringe';
import { Equipment, GameEvent, GameShopStatus, GameUnit, InventoryItem, PlayerInfo, RoomInfo, UnitAchievements, UnitBooty, UnitQuests, UnitRequirements, Weapon } from '../domain/domain';
import { UserStateData } from '../dto/responces';

@singleton()
export default class GameStateService {
    private _userState: UserStateData;
    private _playerInfo: PlayerInfo;
    private _shopStatus: GameShopStatus;
    private _gameState: GameEvent;
    private _rooms: RoomInfo[];
    private _usersNumber: number;

    public set playerInfo(value: PlayerInfo) {
        this._playerInfo = value;
    }

    public get playerInfo(): PlayerInfo {
        return this._playerInfo;
    }

    public set rooms(value: RoomInfo[]) {
        this._rooms = value;
    }

    public get rooms(): RoomInfo[] {
        return this._rooms;
    }

    public set usersNumber(value: number) {
        this._usersNumber = value;
    }

    public get usersNumber(): number {
        return this._usersNumber;
    }

    public set gameState(value: GameEvent) {
        this._gameState = value;
    }

    public get gameState(): GameEvent {
        return this._gameState;
    }

    public set shopStatus(value: GameShopStatus) {
        this._shopStatus = value;
    }

    public get shopStatus(): GameShopStatus {
        return this._shopStatus;
    }

    public set userState(value: UserStateData) {
        this._userState = value;
    }

    public get userState(): UserStateData {
        return this._userState;
    }

    public isUserInRooms(roomInfos: RoomInfo[]): boolean {
        return !!roomInfos.find(room => this.isUserInRoom(room));
    }

    public isUserInRoom(roomInfo: RoomInfo): boolean {
        return roomInfo.host.nickname === this.userState.playerInfo.nickname ||
            !!roomInfo.joinedUsers.find(u => u.nickname === this.userState.playerInfo.nickname);
    }

    public isUserHostOfRoom(roomInfo: RoomInfo): boolean {
        return roomInfo.host.nickname === this.userState.playerInfo.nickname;
    }

    public checkRequirements(unit: GameUnit, required?: UnitRequirements) {
        if (!required) return true;
        return (!required.class || required.class === unit.class) &&
            (required.level ?? 0) <= unit.stats.progress.level &&
            this.checkAchievements(unit, required.achievements) &&
            this.checkQuests(unit, required.quests) &&
            required.strength <= Math.max(this.totalAttributeValue(unit, 'strength'), 0) &&
            required.physique <= Math.max(this.totalAttributeValue(unit, 'physique'), 0) &&
            required.agility <= Math.max(this.totalAttributeValue(unit, 'agility'), 0) &&
            required.endurance <= Math.max(this.totalAttributeValue(unit, 'endurance'), 0) &&
            required.intelligence <= Math.max(this.totalAttributeValue(unit, 'intelligence'), 0) &&
            required.initiative <= Math.max(this.totalAttributeValue(unit, 'initiative'), 0) &&
            required.luck <= Math.max(this.totalAttributeValue(unit, 'luck'), 0);
    }

    public checkUseCost(unit: GameUnit, data: InventoryItem): boolean {
        if (!unit) return true;
        return unit.stats.baseAttributes.actionPoints >= ((data as Weapon).useCost?.actionPoints ?? 0) &&
            unit.stats.baseAttributes.stamina >= ((data as Weapon).useCost?.stamina ?? 0) &&
            unit.stats.baseAttributes.mana >= ((data as Weapon).useCost?.mana ?? 0) &&
            unit.stats.baseAttributes.health >= ((data as Weapon).useCost?.health ?? 0);
    }

    public checkAchievements(unit: GameUnit, required?: UnitAchievements) {
        if (!required || !unit.achievements) return true;
        return [...Object.keys(required)].every(
            k => required[k] < 0 ? required[k] > (unit.achievements[k] ?? 0) * -1 : required[k] <= (unit.achievements[k] ?? 0));
    }

    public checkQuests(unit: GameUnit, required?: UnitQuests) {
        if (!required || !unit.quests) return true;
        return [...Object.keys(required)].every(k => required[k] === unit.quests[k]);
    }

    public checkPrice(unit: GameUnit, required?: UnitBooty): boolean {
        if (!required) return true;
        return required.coins <= unit.booty.coins &&
            (required.ruby ?? 0) <= (unit.booty.ruby ?? 0);
    }

    public totalBaseAttributeValue(unit: GameUnit, key: string): number {
        return (unit.inventory
            .armor?.reduce((acc, a) => acc + this.totalBaseAttributeModification(a, key), 0) || 0) +
            ((unit.stats.attributes as any)[key] || 0);
    }

    public totalBaseAttributeModification(equipment: Equipment, key: string): number {
        if (!equipment.equipped) return 0;
        return equipment.modification.reduce((acc, m) => acc + (m.baseAttributes as any)?.[key] || 0, 0);
    }

    public totalAttributeValue(unit: GameUnit, key: string): number {
        return (unit.inventory
            .armor?.reduce((acc, a) => acc + this.totalAttributeModification(a, key), 0) || 0) +
            ((unit.stats.attributes as any)[key] || 0);
    }

    public totalAttributeModification(equipment: Equipment, key: string): number {
        if (!equipment.equipped) return 0;
        return equipment.modification.reduce((acc, m) => acc + (m.attributes as any)?.[key] || 0, 0);
    }
}
