import { singleton } from 'tsyringe';
import { UserStateData } from '../dto/responces';

@singleton()
export default class GameStateService {
    private _userState: UserStateData;

    public set userState(value: UserStateData) {
        this._userState = value;
    }

    public get userState(): UserStateData {
        return this._userState;
    }
}
