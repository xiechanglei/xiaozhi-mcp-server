import { WebSocket } from "ws";
import config from "./src/config.js";
import { createServer } from "./src/server.js";
import { WebSocketServerTransport } from "./src/transport.js";

const { endpoint, token } = config.xiaozhi;
const serverInfo = config.server ?? { name: "xiaozhi-mcp-server", version: "1.0.0" };
const reconnectIntervalMs = config.reconnectIntervalMs ?? 5000;

function buildUrl() {
    const url = new URL(endpoint);
    url.searchParams.set("token", token);
    return url.toString();
}

/**
 * 建立一次到小智 MCP 接入点的连接，断开后自动重连。
 */
function connect() {
    const ws = new WebSocket(buildUrl());

    ws.on("open", async () => {
        console.log("✅ 已连接到小智 MCP 接入点");
        try {
            // 每次连接都新建 server 实例，避免复用已断开的协议状态
            const server = await createServer(serverInfo);
            await server.connect(new WebSocketServerTransport(ws));
            console.log("🚀 MCP 协议握手完成，工具已就绪");
        } catch (err) {
            console.error("MCP 连接失败:", err);
            ws.close();
        }
    });

    ws.on("error", (err) => {
        console.error("WebSocket 错误:", err.message);
    });

    ws.on("close", (code, reason) => {
        console.log(`❌ 连接已断开 (code=${code}${reason ? `, reason=${reason}` : ""})，${reconnectIntervalMs / 1000} 秒后重连...`);
        setTimeout(connect, reconnectIntervalMs);
    });
}

connect();
