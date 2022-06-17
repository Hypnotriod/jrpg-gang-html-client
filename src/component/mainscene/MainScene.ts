import { injectable } from 'tsyringe';
import ResourceLoaderService from '../../service/ResourceLoaderService';
import Component from '../Component';

@injectable()
export default class MainScene extends Component {
    constructor(private readonly resourceLoader: ResourceLoaderService) {
        super();
    }

    protected init(view: HTMLElement): Component {
        this.initializeComponents();
        return this;
    }

    protected async initializeComponents(): Promise<void> {

    }
}
