export interface AchievementInfo {
    icon: string;
    tag: string;
    popup: string;
}

export const ACHIEVEMENTS: { [key: string]: AchievementInfo } = {
    'first-blood': {
        icon: 'dungeon-01',
        tag: '',
        popup: 'Congratulations! You have completed your first dungeon level!',
    },
    'scenario-easy-01-completed': {
        icon: 'dungeon-01',
        tag: '',
        popup: 'Congratulations! You have completed the Forgotten Ruins!',
    },
    'scenario-medium-01-completed': {
        icon: 'dungeon-01',
        tag: '',
        popup: 'Congratulations! You have completed the Cursed Swamp!',
    },
    'scenario-advanced-01-completed': {
        icon: 'dungeon-01',
        tag: '',
        popup: 'Congratulations! You have completed the Dragon\'s Lair!',
    },
    'kill-10-rats': {
        icon: 'quest-kill-10-rats',
        tag: 'Kills',
        popup: 'You killed the Rat',
    },
    'kill-10-snakes': {
        icon: 'quest-kill-10-snakes',
        tag: 'Kills',
        popup: 'You killed the Snake',
    },
    'kill-20-rats': {
        icon: 'quest-kill-20-rats',
        tag: 'Kills',
        popup: 'You killed the Rat',
    },
    'kill-30-mosquitoes': {
        icon: 'quest-kill-30-mosquitoes',
        tag: 'Kills',
        popup: 'You killed the Mosquito',
    },
    'artifact-01': {
        icon: 'quest-find-artifact-01',
        tag: 'Artifacts',
        popup: 'You found the Cursed Goblet',
    },
    'artifact-02': {
        icon: 'quest-find-artifact-02',
        tag: 'Artifacts',
        popup: 'You found the Sinister Skull',
    },
    'artifact-03': {
        icon: 'quest-find-artifact-03',
        tag: 'Artifacts',
        popup: 'You found the Seekers Book',
    },
};
