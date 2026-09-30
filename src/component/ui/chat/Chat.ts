import { injectable } from 'tsyringe';
import Component from '../../Component';
import { component } from '../../decorator/decorator';
import TextField from '../textfield/TextField';
import TextInput from '../input/TextInput';
import { ChatMessage, ChatParticipant, ChatState } from '../../../domain/domain';
import GameStateService from '../../../service/GameStateService';
import { convert } from 'html-to-text';
import { SoundName, SoundService } from '../../../service/SoundService';

(window as any).muteChatUser = (nickname: string) => {
    Chat.muteUser(nickname);
    SoundService.play(SoundName.CLICK);
}

@injectable()
export class Chat extends Component {
    private static mutedUsers: string[] = [];
    private static userMuteCallbacks: ((nickname: string) => void)[] = [];

    private _chatState?: ChatState;
    private _sendMessage?: (message: string) => void;

    @component('chat_messages', TextField)
    private readonly chatMessages: TextField;
    @component('chat_input', TextInput)
    private readonly messageInput: TextInput;

    public static muteUser(nickname: string): void {
        if (Chat.mutedUsers.includes(nickname)) {
            Chat.mutedUsers = Chat.mutedUsers.filter(n => n !== nickname);
        } else {
            Chat.mutedUsers.push(nickname);
        }
        this.userMuteCallbacks.forEach(cb => cb(nickname));
    }

    public get chatState(): ChatState | undefined {
        return this._chatState;
    }

    constructor(private readonly state: GameStateService) {
        super();
    }

    protected initialize(): void {
        this.chatMessages.autoScroll = true;
        this.messageInput.onEnter = input => {
            this._sendMessage?.(input.value);
            input.value = '';
        };
        this.messageInput.maxLength = 128;
        Chat.userMuteCallbacks.push(_ => {
            if (!this._chatState) return;
            this.chatMessages.autoScroll = false;
            this.handleChatState(this._chatState);
            this.chatMessages.autoScroll = true;
        });
    }

    public onSendMessage(sendMessage: (message: string) => void): void {
        this._sendMessage = sendMessage;
    }

    public handleChatparticipant(playerId: string, participant: ChatParticipant): void {
        if (!this._chatState) return;
        this._chatState.participants[playerId] = participant;
    }

    public handleChatState(chatState: ChatState): void {
        this.chatMessages.value = '';
        this._chatState = chatState;
        this._chatState.messages.forEach(message => this.addChatMessage(message));
    }

    public addChatMessage(message: ChatMessage): void {
        if (!this._chatState) return;
        if (!this._chatState.messages.some(m => m.timestamp === message.timestamp)) {
            this._chatState.messages.push(message);
        }
        const nickname = this._chatState.participants[message.from].nickname;
        const date = new Date(message.timestamp);
        const currentuser = message.from == this.state.userState.playerInfo.playerId;
        const colorClass = currentuser ? 'light-green lighten-1' : 'light-blue lighten-1';
        this.chatMessages.value +=
            `<span class="${colorClass} black-text" style="font-size: 13px;">${nickname}</span>
            <span class="grey-text" style="font-size: 11px;">${date.toLocaleTimeString()}</span>` +
            (currentuser ? '' : `<img src="./assets/icons/sound.png" style="height: 11px; vertical-align: middle; cursor: pointer;" onclick="window.muteChatUser('${nickname}')" alt="mute"/>`) +
            `<br>` +
            (Chat.mutedUsers.length && Chat.mutedUsers.includes(nickname) ?
                `<span class="grey-text" style="font-size: 13px;">muted</span><br>` :
                `<span style="font-size: 13px;">${convert(message.message)}</span><br>`);
    }
}