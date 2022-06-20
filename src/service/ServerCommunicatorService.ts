import { singleton } from 'tsyringe';
import { Request, RequestType, RequestData } from '../dto/requests';
import { Response } from '../dto/responces';

export interface ServerCommunicatorHandler {
    handleServerResponse(response: Response): void;
}

@singleton()
export default class ServerCommunicatorService {
    private readonly subscribers: Map<RequestType, ServerCommunicatorHandler[]> = new Map();
    private readonly requestsQueue: Request[] = [];
    private pendingRequestId: string | undefined;
    private ws: WebSocket | null;

    public subscribe(requestTypes: RequestType[], handler: ServerCommunicatorHandler): void {
        this.unsubscribe(handler);
        requestTypes.forEach(requestType => {
            if (!this.subscribers.get(requestType)) {
                this.subscribers.set(requestType, new Array<ServerCommunicatorHandler>());
            }
            this.subscribers.get(requestType)!.push(handler);
        });
    }

    public unsubscribe(handler: ServerCommunicatorHandler): void {
        this.subscribers.forEach(handlers => {
            const index: number = handlers.indexOf(handler);
            index !== -1 && handlers.splice(index, 1);
        });
    }

    public sendMessage(type: RequestType, data?: RequestData): string {
        if (!this.ws) { this.prepareWs(); }
        const id: string = this.generateRequestId();
        const request: Request = { id, type, data };
        this.requestsQueue.push(request);
        this.nextRequest();
        return id;
    }

    public isOpen(): boolean {
        return !!this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    private prepareWs(): void {
        this.ws = new WebSocket('ws://localhost:3000/ws');
        this.ws.onopen = (event: Event) => this.onOpen(event);
        this.ws.onclose = (event: Event) => this.onClose(event);
        this.ws.onmessage = (event: MessageEvent<string>) => this.onMessage(event);
        this.ws.onerror = (event: ErrorEvent) => this.onError(event);
    }

    private onMessage(event: MessageEvent<string>): void {
        console.log('Message:', event.data);
        const response: Response = JSON.parse(event.data) as Response;
        Object.freeze(response);
        this.notify(response);
        if (response.id && response.id === this.pendingRequestId) {
            this.pendingRequestId = undefined;
            this.nextRequest();
        }
    }

    private nextRequest(): void {
        if (!this.ws || !this.requestsQueue.length || this.pendingRequestId || this.ws.readyState !== this.ws.OPEN) {
            return;
        }
        const request: Request = this.requestsQueue.shift()!;
        this.pendingRequestId = request.id;
        this.ws.send(JSON.stringify(request));
    }

    private notify(response: Response): void {
        const handlers: ServerCommunicatorHandler[] | undefined = this.subscribers.get(response.type);
        if (!handlers) { return; }
        handlers.forEach(handler => handler.handleServerResponse(response));
    }

    private onError(event: ErrorEvent): void {
        console.log('Error:', event.error);
    }

    private onOpen(event: Event): void {
        console.log('Joined:', event);
        this.nextRequest();
    }

    private onClose(event: Event): void {
        console.log('Disconnected:', event);
        this.ws = null;
    }

    private generateRequestId(): string {
        return (~~(Math.random() * (Number.MAX_SAFE_INTEGER - 1))).toString(16);
    }
}
