export enum GameTipKey {
    MAIN_HUB = 'tip_main_hub',
    CLOSE_COMBAT_WARRIOR = 'tip_close_combat_warrior',
    CLOSE_COMBAT_BARBARIAN = 'tip_close_combat_barbarian',
    CLOSE_COMBAT_MAGE = 'tip_close_combat_mage',
    CLOSE_COMBAT_RANGER = 'tip_close_combat_ranger',
    RANGE_COMBAT_WARRIOR = 'tip_range_combat_warrior',
    RANGE_COMBAT_BARBARIAN = 'tip_range_combat_barbarian',
    RANGE_COMBAT_MAGE = 'tip_range_combat_mage',
    RANGE_COMBAT_RANGER = 'tip_range_combat_ranger',
    LOW_HEALTH = 'tip_low_health',
    LOW_STAMINA = 'tip_low_stamina',
    LOW_MANA = 'tip_low_mana',
    NO_STAMINA = 'tip_no_stamina',
    STUNNED = 'tip_stunned',
    BLEADING = 'tip_bleading',
    POISONED = 'tip_poisoned',
    STRESSED = 'tip_stressed',
    MERCENARY = 'tip_mercenary',
    CONSUME_PROVISION_HEALTH = 'tip_consume_provision_health',
    CONSUME_PROVISION_MANA = 'tip_consume_provision_mana',
}

export function closeCombatTip(clazz: string): GameTipKey {
    return ('tip_close_combat_' + clazz) as GameTipKey;
}

export function rangeCombatTip(clazz: string): GameTipKey {
    return ('tip_range_combat_' + clazz) as GameTipKey;
}

export const GAME_TIPS: { [key in GameTipKey]?: string } = {
    [GameTipKey.MAIN_HUB]: `
        This is your main hub. Your character sheet is on the left.<br>
        <img src="./assets/icons/sword-02.png" style="vertical-align: middle; padding-bottom: 4px; width: 22px; margin-top: 6px;" /> •
        You can buy items in the shop on the right.<br>
        <img src="./assets/icons/backpack.png" style="vertical-align: middle; padding-bottom: 4px;" /> •
        You can manage your gear in the inventory below.<br>
        <img src="./assets/icons/warning.png" style="vertical-align: middle; padding-bottom: 4px;" /> •
        Go to the quests menu at the top and take you active assignment.<div>
        If something is unclear - read the game rules.`,
    [GameTipKey.CLOSE_COMBAT_WARRIOR]: `
        <img src="./assets/icons/sword-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;"> •
        Use your close combat weapon to attack targets in the adjacent column.<br>
        <img src="./assets/icons/close-range.png" style="vertical-align: middle; height: 32px; margin-top: 2px;"> •
        You can reach any green square from any purple square.`,
    [GameTipKey.CLOSE_COMBAT_BARBARIAN]: `
        <img src="./assets/icons/axe-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;"> •
        Use your close combat weapon to attack targets in the adjacent column.<br>
        <img src="./assets/icons/close-range.png" style="vertical-align: middle; height: 32px; margin-top: 2px;"> •
        You can reach any green square from any purple square.`,
    [GameTipKey.CLOSE_COMBAT_MAGE]: `
        <img src="./assets/icons/plasma-touch-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;"> •
        Use your close combat magic to attack targets in the adjacent column.<br>
        <img src="./assets/icons/close-range.png" style="vertical-align: middle; height: 32px; margin-top: 2px;"> •
        You can reach any green square from any purple square.`,
    [GameTipKey.CLOSE_COMBAT_RANGER]: `
        <img src="./assets/icons/dagger-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;"> •
        Use your close combat weapon to attack targets in the adjacent column.<br>
        <img src="./assets/icons/close-range.png" style="vertical-align: middle; height: 32px; margin-top: 2px;"> •
        You can reach any green square from any purple square.`,
    [GameTipKey.RANGE_COMBAT_MAGE]: `
        <img src="./assets/icons/sorcerer-staff-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;"> •
        Use your long range weapon to attack targets behind the adjacent column.<br>
        <img src="./assets/icons/fire-charge-01.png" style="vertical-align: middle; height: 32px; margin-top: 2px; margin-left: 8px;"> •
        The weapon ammunition must be equipped in the ammo <img src="./assets/icons/slot-ammo.png"
                        style="vertical-align: middle; padding-bottom: 4px; width: 16px;"> slot<br>
        <img src="./assets/icons/long-range.png" style="vertical-align: middle; height: 32px; margin-top: 2px;"> •
        You can reach any green square from any purple square.`,
    [GameTipKey.RANGE_COMBAT_RANGER]: `
        <img src="./assets/icons/bow-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;"> •
        Use your long range weapon to attack targets behind the adjacent column.<br>
        <img src="./assets/icons/arrow-01.png" style="vertical-align: middle; height: 32px; margin-top: 2px; margin-left: 8px;"> •
        The weapon ammunition must be equipped in the ammo <img src="./assets/icons/slot-ammo.png"
                        style="vertical-align: middle; padding-bottom: 4px; width: 16px;"> slot<br>
        <img src="./assets/icons/long-range.png" style="vertical-align: middle; height: 32px; margin-top: 2px;"> •
        You can reach any green square from any purple square.`,
    [GameTipKey.RANGE_COMBAT_WARRIOR]: `
        Since you don't have a ranged weapon, you'll need to move your character closer to a distant target.`,
    [GameTipKey.RANGE_COMBAT_BARBARIAN]: `
        Since you don't have a ranged weapon, you'll need to move your character closer to a distant target.`,
    [GameTipKey.LOW_HEALTH]: `
        Your health is low.<br>
        <img src="./assets/icons/health-potion-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;"> •
        Use health potions to regenerate health during combat.`,
    [GameTipKey.LOW_STAMINA]: `
        Your stamina is low and you may not be able to use your weapon.<br>
        <img src="./assets/icons/stamina-potion-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;"> •
        Use stamina potions to regenerate stamina during combat.`,
    [GameTipKey.LOW_MANA]: `
        Your mana is low and you may not be able to use your magic and magic weapons.<br>
        <img src="./assets/icons/mana-potion-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;"> •
        Use mana potions to regenerate mana during combat.`,
    [GameTipKey.NO_STAMINA]: `
        <img src="./assets/icons/tired.png" style="vertical-align: middle; padding-bottom: 4px; width: 24px; margin: 4px;"> •
        Your stamina is completely drained. Any damage you take will be critical.`,
    [GameTipKey.STUNNED]: `
        <img src="./assets/icons/dizzy.png" style="vertical-align: middle; padding-bottom: 4px; width: 24px; margin: 4px;"> •
        Your character is stunned. Any damage you take will be critical.`,
    [GameTipKey.STRESSED]: `
        <img src="./assets/icons/stressed.png" style="vertical-align: middle; padding-bottom: 4px; width: 16px; margin: 4px; margin-left: 8px;"> •
        Your character is stressed. Bad things could happen.<br>
       <img src="./assets/icons/stress-potion-01.png" style="vertical-align: middle; padding-bottom: 4px; width: 32px; margin: 4px;"> •
        You could use a calming brew to reduce your stress.`,
    [GameTipKey.BLEADING]: `
        <img src="./assets/icons/blood-drop.png" style="vertical-align: middle; padding-bottom: 4px; width: 16px; margin: 4px; margin-left: 8px;"> •
        Your character is bleeding.<br>
       <img src="./assets/icons/bandage-01.png" style="vertical-align: middle; padding-bottom: 4px; width: 32px; margin: 4px;"> •
        You could use a bandage to stop it during combat.`,
    [GameTipKey.POISONED]: `
        <img src="./assets/icons/poison-drop.png" style="vertical-align: middle; padding-bottom: 4px; width: 16px; margin: 4px; margin-left: 8px;"> •
        Your character is poisoned.<br>
       <img src="./assets/icons/antidote-potion-01.png" style="vertical-align: middle; padding-bottom: 4px; width: 32px; margin: 4px;"> •
        You could use an antidote to heal yourself during combat.`,
    [GameTipKey.CONSUME_PROVISION_HEALTH]: `
        <img src="./assets/icons/provision-ham-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;"> •
        Consume your provision to restore health during the resting phase.`,
    [GameTipKey.CONSUME_PROVISION_MANA]: `
        <img src="./assets/icons/provision-wine-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;"> •
        Consume your provision to restore mana during the resting phase.`,
    [GameTipKey.MERCENARY]: `
        <img src="./assets/icons/villager-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;"> •
        You could always hire a mercenary to help you on your journey.`,
};
