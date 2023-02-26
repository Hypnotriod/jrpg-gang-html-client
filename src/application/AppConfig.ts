import { injectable, singleton } from 'tsyringe';

@singleton()
export default class AppConfig {
    public gameServerWsUrl: string;
    public authUrl: string;
    public version: string;
}
