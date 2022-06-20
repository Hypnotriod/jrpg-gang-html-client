import { container } from 'tsyringe';
import { ROOM_DESIGN } from '../../constants/Resources';
import { RoomInfo } from '../../domain/domain';
import ResourceLoaderService from '../../service/ResourceLoaderService';
import Component from '../Component';

export default class Room extends Component {
    public static createRoom(parent: Component, containerId: string): Room | null {
        const resourceLoader: ResourceLoaderService = container.resolve(ResourceLoaderService);
        const component: Room | null = parent.create(containerId, resourceLoader.get(ROOM_DESIGN), Room);
        return component;
    }

    public update(data: RoomInfo): void {

    }

    protected initialize(): void {
    }
}
