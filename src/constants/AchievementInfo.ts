export interface AchievementInfo {
    icon: string;
    tag: string;
    target: number;
    popup: string;
}

export const ACHIEVEMENTS: { [key: string]: AchievementInfo } = {
    'first-blood': {
        icon: 'dungeon-01',
        tag: '',
        target: 0,
        popup: 'Congratulations! You have completed your first dungeon level!',
    },
    'scenario-easy-01-completed': {
        icon: 'dungeon-01',
        tag: '',
        target: 0,
        popup: 'Congratulations! You have completed the Forgotten Ruins!',
    },
    'scenario-medium-01-completed': {
        icon: 'dungeon-01',
        tag: '',
        target: 0,
        popup: 'Congratulations! You have completed the Cursed Swamp!',
    },
    'scenario-advanced-01-completed': {
        icon: 'dungeon-01',
        tag: '',
        target: 0,
        popup: 'Congratulations! You have completed the Dragon\'s Lair!',
    },
    'kill-10-rats': {
        icon: 'quest-kill-10-rats',
        tag: 'Kills',
        target: 10,
        popup: 'You have killed the Rat',
    },
    'kill-10-snakes': {
        icon: 'quest-kill-10-snakes',
        tag: 'Kills',
        target: 10,
        popup: 'You have killed the Snake',
    },
    'kill-20-rats': {
        icon: 'quest-kill-20-rats',
        tag: 'Kills',
        target: 20,
        popup: 'You have killed the Rat',
    },
    'kill-20-mosquitoes': {
        icon: 'quest-kill-20-mosquitoes',
        tag: 'Kills',
        target: 20,
        popup: 'You have killed the Mosquito',
    },
    'kill-20-bats': {
        icon: 'quest-kill-20-bats',
        tag: 'Kills',
        target: 20,
        popup: 'You have killed the bat',
    },
    'kill-10-skeletons': {
        icon: 'quest-kill-10-skeletons',
        tag: 'Kills',
        target: 10,
        popup: 'You have killed the Skeleton',
    },
    'kill-10-zombies': {
        icon: 'quest-kill-10-zombies',
        tag: 'Kills',
        target: 10,
        popup: 'You have killed the Zombie',
    },
    'kill-10-goblins': {
        icon: 'quest-kill-10-goblins',
        tag: 'Kills',
        target: 10,
        popup: 'You have killed the Goblin',
    },
    'kill-10-daemons': {
        icon: 'quest-kill-10-daemons',
        tag: 'Kills',
        target: 10,
        popup: 'You have killed the Daemon',
    },
    'artifact-01': {
        icon: 'quest-find-artifact-01',
        tag: 'Artifacts',
        target: 0,
        popup: 'You have found the Cursed Goblet',
    },
    'artifact-02': {
        icon: 'quest-find-artifact-02',
        tag: 'Artifacts',
        target: 0,
        popup: 'You have found the Sinister Skull',
    },
    'artifact-03': {
        icon: 'quest-find-artifact-03',
        tag: 'Artifacts',
        target: 0,
        popup: 'You have found the Seekers Book',
    },
    'artifact-04': {
        icon: 'quest-find-artifact-04',
        tag: 'Artifacts',
        target: 0,
        popup: 'You have found the Amulet of Ultimate Evil',
    },
    'artifact-05': {
        icon: 'quest-find-artifact-05',
        tag: 'Artifacts',
        target: 0,
        popup: 'You have found the Runes of Chaos',
    },
    'artifact-06': {
        icon: 'quest-find-artifact-06',
        tag: 'Artifacts',
        target: 0,
        popup: 'You have found the Scroll of Eternal Darkness',
    },
    'artifact-07': {
        icon: 'quest-find-artifact-07',
        tag: 'Artifacts',
        target: 0,
        popup: 'You have found the Orb of Dragon King',
    },
    'save-princess': {
        icon: 'quest-save-princess',
        tag: 'Artifacts',
        target: 0,
        popup: 'Congratulations! You have defeated the Dragon and saved the Princess!',
    },
};
