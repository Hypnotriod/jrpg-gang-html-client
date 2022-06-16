import { injectable, singleton } from 'tsyringe';

export const RESOURCE_COMPONENT: string = 'component';
export const RESOURCE_STYLE: string = 'style';

export type ResourceLoaderServiceType = 'component' | 'style';

@injectable()
@singleton()
class ResourceLoaderService {
    private readonly resourcesMap: Map<ResourceLoaderServiceType, any> = new Map();

    public async load<T>(path: string, type: ResourceLoaderServiceType): Promise<T> {
        try {
            const response = await fetch(path);
            return await this.parseResponse(response, path, type);
        } catch (error) {
            console.error(`Error occured while loading ${path}`);
            throw error;
        }
    }

    private async parseResponse<T>(response: Response, path: string, type: ResourceLoaderServiceType): Promise<T> {
        switch (type) {
            case RESOURCE_STYLE:
            case RESOURCE_COMPONENT:
                this.resourcesMap[path] = await response.text();
                break;
        }
        return this.resourcesMap[path];
    }

    public get<T>(path: string): T {
        return this.resourcesMap[path];
    }
}
