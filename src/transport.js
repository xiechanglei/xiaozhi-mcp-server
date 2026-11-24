import { WebSocket } from "ws";

/**
 * 基于 WebSocket 的 MCP Transport 实现。
 * 小智云端作为 MCP 客户端通过 WebSocket 连入，本进程作为 MCP 服务端，
 * 双方按 JSON-RPC 2.0 交换消息，协议细节全部交给 MCP SDK 处理。
 */
export class WebSocketServerTransport {
    constructor(ws) {
        this._ws = ws;
        this.onclose = undefined;
        this.onerror = undefined;
        this.onmessage = undefined;
    }

    async start() {
        this._ws.on("message", (raw) => {
            try {
                const msg = JSON.parse(raw.toString());
                this.onmessage?.(msg);
            } catch (err) {
                this.onerror?.(err);
            }
        });
        this._ws.on("close", () => this.onclose?.());
        this._ws.on("error", (err) => this.onerror?.(err));
    }

    async send(message) {
        if (this._ws.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not open");
        }
        this._ws.send(JSON.stringify(message));
    }

    async close() {
        this._ws.close();
    }
}
