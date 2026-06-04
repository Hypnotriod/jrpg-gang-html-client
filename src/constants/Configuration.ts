import { GameUnit, Unit } from '../domain/domain';

export const USER_CLASSES: string[] = [
    'warrior',
    'barbarian',
    'mage',
    'ranger',
];

export const BASE_UNIT_DESCRIPTIONS: { [key: string]: any } = {
    warrior: {
        name: "Warrior",
        code: "warrior",
        description: "A disciplined fighter from the noble elite, a master of sword and shield. They bears the bitter memory of sieges and broken banners, standing immovable while empires rot around his feet.",
        baseAttributes: {
            health: 75,
            stamina: 75,
            mana: 0,
            actionPoints: 9
        },
        attributes: {
            strength: 8,
            physique: 8,
            agility: 3,
            endurance: 7,
            intelligence: 2,
            initiative: 2,
            luck: 5
        },
        resistance: {
            stabbing: 5,
            cutting: 5,
            crushing: 5,
            fire: 0,
            cold: 0,
            lightning: 0,
            poison: 0,
            exhaustion: 3,
            manaDrain: 0,
            bleeding: 3,
            fear: 5,
            curse: 2,
            madness: 2
        },
    },
    barbarian: {
        name: "Barbarian",
        code: "barbarian",
        description: "A hulking brute from the frozen wastes, wielding axe and fury in equal measure. Scarred and relentless, they walks like a storm, each swing a funeral bell for fallen keeps; his laughter tastes of iron and frost.",
        baseAttributes: {
            health: 80,
            stamina: 80,
            mana: 0,
            actionPoints: 9
        },
        attributes: {
            strength: 10,
            physique: 8,
            agility: 2,
            endurance: 10,
            intelligence: 0,
            initiative: 0,
            luck: 5
        },
        resistance: {
            stabbing: 5,
            cutting: 5,
            crushing: 5,
            fire: 0,
            cold: 8,
            lightning: 0,
            poison: 0,
            exhaustion: 5,
            manaDrain: 0,
            bleeding: 2,
            fear: 5,
            curse: 0,
            madness: 0
        },
    },
    ranger: {
        name: "Ranger",
        code: "ranger",
        description: "A swift archer of the wilds, deadly with bow and blade. Haunted by hollowed woods and moonlit tracks, they slip like smoke between ruined trees, each arrow a clean, whispered verdict against the dark.",
        baseAttributes: {
            health: 50,
            stamina: 50,
            mana: 0,
            actionPoints: 9
        },
        attributes: {
            strength: 5,
            physique: 5,
            agility: 8,
            endurance: 5,
            intelligence: 2,
            initiative: 7,
            luck: 5
        },
        resistance: {
            stabbing: 5,
            cutting: 5,
            crushing: 5,
            fire: 0,
            cold: 0,
            lightning: 0,
            poison: 5,
            exhaustion: 0,
            manaDrain: 0,
            bleeding: 5,
            fear: 0,
            curse: 0,
            madness: 0
        },
    },
    mage: {
        name: "Mage",
        code: "mage",
        description: "A scholarly sorcerer wielding arcane forces, bending magic to their will. Keeper of ash-black tomes and forbidden runes, they trade warmth for insight and call cold stars down into mortal flesh to learn what nightmares whisper.",
        baseAttributes: {
            health: 50,
            stamina: 50,
            mana: 75,
            actionPoints: 9
        },
        attributes: {
            strength: 2,
            physique: 2,
            agility: 5,
            endurance: 3,
            intelligence: 8,
            initiative: 8,
            luck: 8
        },
        resistance: {
            stabbing: 0,
            cutting: 0,
            crushing: 0,
            fire: 5,
            cold: 5,
            lightning: 5,
            poison: 0,
            exhaustion: 0,
            manaDrain: 5,
            bleeding: 0,
            fear: 0,
            curse: 5,
            madness: 5
        }
    },
};

export const SCENARIO_IDS = {
    EASY: 'easy-01',
    MEDIUM: 'medium-01',
    ADVANCED: 'advanced-01',
}
