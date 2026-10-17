import { injectable, singleton } from 'tsyringe';
import Container from '../container/Container';
import { component } from '../../decorator/decorator';
import Checkbox from '../checkbox/Checkbox';
import { SoundName, SoundService } from '../../../service/SoundService';
import { TipsPopup } from './TipsPopup';
import ObjectDescription from './ObjectDescription';
import Button from '../button/Button';
import HSlider from '../slider/HSlider';

@injectable()
@singleton()
export class SettingsPopup extends Container {
    @component('checkbox_sound', Checkbox)
    private readonly checkboxSound: Checkbox;
    @component('checkbox_info', Checkbox)
    private readonly checkboxInfo: Checkbox;
    @component('checkbox_tips', Checkbox)
    private readonly checkboxTips: Checkbox;
    @component('button_ok', Button)
    protected readonly buttonOk: Button;
    @component('slider_sound_volume', HSlider)
    protected readonly soundVolumeSlider: HSlider;
    @component('slider_music_volume', HSlider)
    protected readonly musicVolumeSlider: HSlider;
    protected _shadow?: Container;

    public set shadow(value: Container) {
        this._shadow = value;
    }

    constructor(private readonly tipsPopup: TipsPopup) {
        super();
    }

    public override show(): void {
        super.show();
        this._shadow?.show();
    }

    public override hide(): void {
        super.hide();
        this._shadow?.hide();
    }

    protected initialize(): void {
        this.hide();
        const soundVolume = localStorage.getItem('sound_volume');
        const musicVolume = localStorage.getItem('music_volume');
        this.soundVolumeSlider.value = soundVolume !== null ? Number(soundVolume) : 100;
        this.musicVolumeSlider.value = musicVolume !== null ? Number(musicVolume) : 100;
        SoundService.soundVolume = this.soundVolumeSlider.value / 100;
        SoundService.musicVolume = this.musicVolumeSlider.value / 100;

        this.soundVolumeSlider.onChange = () => this.updateSoundVolume();
        this.musicVolumeSlider.onChange = () => this.updateMusicVolume();

        this.checkboxSound.checked = localStorage.getItem('sound') !== 'false';
        this.checkboxInfo.checked = localStorage.getItem('info') !== 'false';
        this.checkboxTips.checked = localStorage.getItem('tips') !== 'false';
        this.tipsPopup.active = this.checkboxTips.checked;
        SoundService.muted = !this.checkboxSound.checked;
        ObjectDescription.active = this.checkboxInfo.checked;

        this.checkboxSound.onChange = target => this.toggleSoundMute();
        this.checkboxInfo.onChange = target => this.toggleInfoPopup();
        this.checkboxTips.onChange = target => this.toggleTipsPopup();

        this.buttonOk.onClick = () => this.hide();
    }

    protected updateSoundVolume() {
        SoundService.soundVolume = this.soundVolumeSlider.value / 100;
        SoundService.play(SoundName.CLICK, { rate: 0.05 });
        localStorage.setItem('sound_volume', String(this.soundVolumeSlider.value));
    }

    protected updateMusicVolume() {
        SoundService.musicVolume = this.musicVolumeSlider.value / 100;
        localStorage.setItem('music_volume', String(this.musicVolumeSlider.value));
    }

    protected toggleSoundMute(): void {
        SoundService.play(SoundName.CLICK);
        SoundService.muted = !SoundService.muted;
        localStorage.setItem('sound', String(!SoundService.muted));
    }

    protected toggleInfoPopup(): void {
        SoundService.play(SoundName.CLICK);
        ObjectDescription.active = !ObjectDescription.active;
        localStorage.setItem('info', String(ObjectDescription.active));
    }

    protected toggleTipsPopup(): void {
        SoundService.play(SoundName.CLICK);
        this.tipsPopup.active = !this.tipsPopup.active;
        localStorage.setItem('tips', String(this.tipsPopup.active));
    }
}