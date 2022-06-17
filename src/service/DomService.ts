import { singleton } from 'tsyringe';

@singleton()
export default class DomService {
    public renderDesignTemplate(elementId: string, template: string, style: string): HTMLElement | null {
        const element: HTMLElement | null = window.document.getElementById(elementId);
        if (element) {
            element.innerHTML = template;
            const sheet: HTMLStyleElement = document.createElement('style');
            sheet.innerHTML = style;
            element.appendChild(sheet);
        }
        return element;
    }
}
