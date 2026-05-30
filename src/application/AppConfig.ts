import { injectable, singleton } from 'tsyringe';

@singleton()
export default class AppConfig {
    public gameServerWsUrl: string;
    public configurationUrl: string;
    public authUrl: string;
    public authGuestUrl: string;
    public version: string;
}
