export enum GameTipKey {
    MAIN_HUB = 'tip_main_hub',
    COMBAT_PHASE = 'tip_combat_phase',
    START_TRAINING_QUEST = 'tip_start_training_quest',
    RESOLVE_TRAINING_QUEST = 'tip_resolve_training_quest',
    REPLENISH_SUPPLIES = 'tip_replenish_supplies',
    MANAGE_INVENTORY = 'tip_manage_inventory',
    BROKEN_GEAR = 'tip_broken_gear',
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
    LOBBY = 'tip_lobby',
    MERCENARY = 'tip_mercenary',
    LEVEL_UP = 'tip_level_up',
    CONSUME_PROVISION_HEALTH = 'tip_consume_provision_health',
    CONSUME_PROVISION_MANA = 'tip_consume_provision_mana',
    CONSUME_PROVISION_STRESS = 'tip_consume_provision_stress',
}

export function closeCombatTip(clazz: string): GameTipKey {
    return ('tip_close_combat_' + clazz) as GameTipKey;
}

export function rangeCombatTip(clazz: string): GameTipKey {
    return ('tip_range_combat_' + clazz) as GameTipKey;
}

export const GAME_TIPS: { [key in GameTipKey]?: string } = {
    [GameTipKey.MAIN_HUB]: `
        <span style="margin-left: 8px;">Your character sheet is on the left. Hover over for more information.</span><br>
        <img src="./assets/icons/sword-02.png" style="vertical-align: middle; padding-bottom: 4px; width: 22px; margin-top: 6px;" />
        You can buy items in the Shop on the right.<br>
        <img src="./assets/icons/backpack.png" style="vertical-align: middle; padding-bottom: 4px;" />
        You can manage your gear in the Inventory below.<br>
        <img src="./assets/icons/warning.png" style="vertical-align: middle; padding-bottom: 4px;" />
        Open the Quests menu from the top and take you active assignment.<div>
        <span style="margin-left: 8px;">Read the game rules by clicking the Game Rules button at the top of the screen.</span>`,
    [GameTipKey.COMBAT_PHASE]: `
        Welcome, adventurer! This is your learning mission.<br>
        Follow the instructions in the combat phase notes above.`,
    [GameTipKey.START_TRAINING_QUEST]: `
        Now you can proceed to your training.<br>
        Click the Training button in the upper right corner.`,
    [GameTipKey.RESOLVE_TRAINING_QUEST]: `
        <img src="./assets/icons/warning.png" style="vertical-align: middle; padding-bottom: 4px;" />
        Open the Quests menu from the top to complete your training quest.`,
    [GameTipKey.REPLENISH_SUPPLIES]: `
        <img src="./assets/icons/health-potion-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/stamina-potion-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/mana-potion-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/antidote-potion-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/bandage-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/fire-charge-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/arrow-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/provision-ham-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/provision-wine-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/provision-beer-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/helmet-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/basic-armor-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/boots-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <img src="./assets/icons/gloves-01.png" style="vertical-align: middle; height: 32px; padding-bottom: 4px;" />
        <br>
        Don't forget to restock your potions, ammunition and provision.<br>
        You might need better gear before heading down into the Dungeons.`,
    [GameTipKey.MANAGE_INVENTORY]: `
        <img src="./assets/icons/backpack.png" style="vertical-align: middle; padding-bottom: 4px;" />
        Don't forget to equip your weapon and armor into the corresponding slots.<br>
        When such icon 
        <img src="./assets/icons/slot-weapon.png"
                style="vertical-align: middle; padding-bottom: 4px; width: 16px;">
            <img src="./assets/icons/slot-head.png"
                style="vertical-align: middle; padding-bottom: 4px; width: 16px;">
            <img src="./assets/icons/slot-body.png"
                style="vertical-align: middle; padding-bottom: 4px; width: 16px;">
            <img src="./assets/icons/slot-hand.png"
                style="vertical-align: middle; padding-bottom: 4px; width: 16px;">
            <img src="./assets/icons/slot-leg.png"
                style="vertical-align: middle; padding-bottom: 4px; width: 16px;">
            <img src="./assets/icons/slot-neck.png"
                style="vertical-align: middle; padding-bottom: 4px; width: 16px;">
        is displayed, it means the item is equipped.`,
    [GameTipKey.CLOSE_COMBAT_WARRIOR]: `
        <img src="./assets/icons/sword-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;">
        Use your close combat weapon to attack targets in the adjacent column.<br>
        <img src="./assets/icons/close-range.png" style="vertical-align: middle; height: 32px; margin-top: 2px;">
        You can reach any green square from any purple square.`,
    [GameTipKey.CLOSE_COMBAT_BARBARIAN]: `
        <img src="./assets/icons/axe-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;">
        Use your close combat weapon to attack targets in the adjacent column.<br>
        <img src="./assets/icons/close-range.png" style="vertical-align: middle; height: 32px; margin-top: 2px;">
        You can reach any green square from any purple square.`,
    [GameTipKey.CLOSE_COMBAT_MAGE]: `
        <img src="./assets/icons/plasma-touch-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;">
        Use your close combat magic to attack targets in the adjacent column.<br>
        <img src="./assets/icons/close-range.png" style="vertical-align: middle; height: 32px; margin-top: 2px;">
        You can reach any green square from any purple square.`,
    [GameTipKey.CLOSE_COMBAT_RANGER]: `
        <img src="./assets/icons/dagger-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;">
        Use your close combat weapon to attack targets in the adjacent column.<br>
        <img src="./assets/icons/close-range.png" style="vertical-align: middle; height: 32px; margin-top: 2px;">
        You can reach any green square from any purple square.`,
    [GameTipKey.RANGE_COMBAT_MAGE]: `
        <img src="./assets/icons/sorcerer-staff-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;">
        Use your long range weapon to attack targets behind the adjacent column.<br>
        <img src="./assets/icons/fire-charge-01.png" style="vertical-align: middle; height: 32px; margin-top: 2px; margin-left: 8px;">
        The weapon ammunition must be equipped in the ammo <img src="./assets/icons/slot-ammo.png"
                        style="vertical-align: middle; padding-bottom: 4px; width: 16px;"> slot<br>
        <img src="./assets/icons/long-range.png" style="vertical-align: middle; height: 32px; margin-top: 2px;">
        You can reach any green square from any purple square.`,
    [GameTipKey.RANGE_COMBAT_RANGER]: `
        <img src="./assets/icons/bow-01.png" style="vertical-align: middle; height: 32px; margin-left: 8px;">
        Use your long range weapon to attack targets behind the adjacent column.<br>
        <img src="./assets/icons/arrow-01.png" style="vertical-align: middle; height: 32px; margin-top: 2px; margin-left: 8px;">
        The weapon ammunition must be equipped in the ammo <img src="./assets/icons/slot-ammo.png"
                        style="vertical-align: middle; padding-bottom: 4px; width: 16px;"> slot<br>
        <img src="./assets/icons/long-range.png" style="vertical-align: middle; height: 32px; margin-top: 2px;">
        You can reach any green square from any purple square.`,
    [GameTipKey.RANGE_COMBAT_WARRIOR]: `
        Since you don't have a ranged weapon, you'll need to move your character closer to the distant targets.`,
    [GameTipKey.RANGE_COMBAT_BARBARIAN]: `
        Since you don't have a ranged weapon, you'll need to move your character closer to the distant targets.`,
    [GameTipKey.LOW_HEALTH]: `
        <span style="margin-left: 8px;">Your health is low.</span><br>
        <img src="./assets/icons/health-potion-01.png" style="vertical-align: middle; height: 32px;">
        Use health potions to regenerate health during combat.`,
    [GameTipKey.LOW_STAMINA]: `
        <span style="margin-left: 8px;">Your stamina is low and you may not be able to use your weapon.</span><br>
        <img src="./assets/icons/stamina-potion-01.png" style="vertical-align: middle; height: 32px;">
        Use stamina potions to regenerate stamina during combat.`,
    [GameTipKey.LOW_MANA]: `
        <span style="margin-left: 8px;">Your mana is low and you may not be able to use your magic and magic weapons.</span><br>
        <img src="./assets/icons/mana-potion-01.png" style="vertical-align: middle; height: 32px;">
        Use mana potions to regenerate mana during combat.`,
    [GameTipKey.NO_STAMINA]: `
        <img src="./assets/icons/tired.png" style="vertical-align: middle; padding-bottom: 4px; width: 24px; margin: 4px;">
        Your stamina is completely drained. Any damage you take will be critical.`,
    [GameTipKey.STUNNED]: `
        <img src="./assets/icons/dizzy.png" style="vertical-align: middle; padding-bottom: 4px; width: 24px; margin: 4px;">
        Your character is stunned. Any damage you take will be critical.`,
    [GameTipKey.BROKEN_GEAR]: `
        <img src="./assets/icons/broken.png" style="vertical-align: middle; padding-bottom: 4px; width: 24px; margin: 4px;">
        Your gear is broken and cannot be used.<br>
        You can repair it when you return from the dungeon.`,
    [GameTipKey.STRESSED]: `
        <img src="./assets/icons/stressed.png" style="vertical-align: middle; padding-bottom: 4px; width: 16px; margin: 4px; margin-left: 8px;">
        Your character is stressed. Bad things can happen.<br>
       <img src="./assets/icons/stress-potion-01.png" style="vertical-align: middle; padding-bottom: 4px; width: 32px; margin: 4px;">
        You can use a calming brew to reduce your stress.`,
    [GameTipKey.BLEADING]: `
        <img src="./assets/icons/blood-drop.png" style="vertical-align: middle; padding-bottom: 4px; width: 16px; margin: 4px; margin-left: 8px;">
        Your character is bleeding.<br>
       <img src="./assets/icons/bandage-01.png" style="vertical-align: middle; padding-bottom: 4px; width: 32px; margin: 4px;">
        You can use a bandage to stop bleeding during combat.`,
    [GameTipKey.POISONED]: `
        <img src="./assets/icons/poison-drop.png" style="vertical-align: middle; padding-bottom: 4px; width: 16px; margin: 4px; margin-left: 8px;">
        Your character is poisoned.<br>
       <img src="./assets/icons/antidote-potion-01.png" style="vertical-align: middle; padding-bottom: 4px; width: 32px; margin: 4px;">
        You can use an antidote to heal yourself during combat.`,
    [GameTipKey.CONSUME_PROVISION_HEALTH]: `
        <img src="./assets/icons/provision-ham-01.png" style="vertical-align: middle; height: 32px;">
        You can consume a slab of ham to restore your health during the resting phase.`,
    [GameTipKey.CONSUME_PROVISION_MANA]: `
        <img src="./assets/icons/provision-wine-01.png" style="vertical-align: middle; height: 32px;">
        You can consume a bottle of wine to restore your mana during the resting phase.`,
    [GameTipKey.CONSUME_PROVISION_STRESS]: `
        <img src="./assets/icons/provision-beer-01.png" style="vertical-align: middle; height: 32px;">
        You can consume a glass of beer to reduce your stress during the resting phase.`,
    [GameTipKey.MERCENARY]: `
        <img src="./assets/icons/villager-01.png" style="vertical-align: middle; height: 32px;">
        You can hire a mercenary to help you on your journey.`,
    [GameTipKey.LOBBY]: `
        From here you can enter dungeons as a party leader.<br>
        You can join other players' parties in the Parties tab.`,
    [GameTipKey.LEVEL_UP]: `
        Your character is ready to gain a new level.<br>Press level up button and assign you attribute points.`,
};
