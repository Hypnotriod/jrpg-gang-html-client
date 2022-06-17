import { singleton } from 'tsyringe';

export const RESOURCE_DESIGN: string = 'design';
export const RESOURCE_STYLE: string = 'style';

export type ResourceLoaderServiceType =
    typeof RESOURCE_DESIGN |
    typeof RESOURCE_STYLE;

@singleton()
export default class ResourceLoaderService {
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
            case RESOURCE_DESIGN:
                this.resourcesMap[path] = await response.text();
                break;
        }
        return this.resourcesMap[path];
    }

    public get<T>(path: string): T {
        return this.resourcesMap[path];
    }
}
