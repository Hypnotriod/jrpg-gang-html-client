import Container from '../container/Container';

export default class Image extends Container {
    public get view(): HTMLImageElement {
        return super.view as HTMLImageElement;
    }

    public set src(value: string) {
        this.view.src = value;
    }

    public get src(): string {
        return this.view.src;
    }
}
