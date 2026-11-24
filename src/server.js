import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsDir = path.resolve(__dirname, "..", "tools");

/**
 * 自动扫描根目录 tools/ 并注册所有工具模块。
 * 新增能力时只需在 tools/ 下新建一个 .js 文件，
 * 默认导出 { name, definition, handler } 即可，无需修改其他文件。
 */
async function loadTools(server) {
    const files = readdirSync(toolsDir).filter((f) => f.endsWith(".js") && f !== "index.js");

    for (const file of files) {
        const mod = await import(pathToFileURL(path.join(toolsDir, file)).href);
        const tool = mod.default;

        if (!tool?.name || !tool?.definition || !tool?.handler) {
            console.warn(`⚠️  跳过 ${file}：需默认导出 { name, definition, handler }`);
            continue;
        }

        server.registerTool(tool.name, tool.definition, tool.handler);
        console.log(`🔧 已注册工具: ${tool.name}（${tool.definition.title}）`);
    }
}

/**
 * 创建一个新的 MCP Server 实例（每次连接小智时新建，避免复用已断开的协议状态）。
 */
export async function createServer({ name, version }) {
    const server = new McpServer({ name, version });
    await loadTools(server);
    return server;
}
