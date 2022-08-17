import { injectable, singleton } from 'tsyringe';

@singleton()
export default class AppConfig {
    public gameServerWsUrl: string;
}
