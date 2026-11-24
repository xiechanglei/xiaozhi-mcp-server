import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, "..", "config.properties");

if (!existsSync(configPath)) {
    console.error("❌ 缺少配置文件: config.properties");
    console.error("   请复制 config.example.properties 为 config.properties，并填入你的小智接入点信息。");
    process.exit(1);
}

/**
 * 极简 properties 解析器：
 *   - key=value 形式，按第一个 = 或 : 分割
 *   - # 或 ! 开头为注释行，空行忽略
 *   - 值两端空白会被去除
 */
function parseProperties(text) {
    const props = {};
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || line.startsWith("!")) continue;

        const sep = line.search(/[=:]/);
        if (sep === -1) continue;

        const key = line.slice(0, sep).trim();
        const value = line.slice(sep + 1).trim();
        props[key] = value;
    }
    return props;
}

const props = parseProperties(readFileSync(configPath, "utf-8"));

const config = {
    xiaozhi: {
        endpoint: props["xiaozhi.endpoint"],
        token: props["xiaozhi.token"],
    },
    server: {
        name: props["server.name"] || "xiaozhi-mcp-server",
        version: props["server.version"] || "1.0.0",
    },
    reconnectIntervalMs: Number(props["reconnect.interval.ms"]) || 5000,
};

if (!config.xiaozhi.endpoint || !config.xiaozhi.token) {
    console.error("❌ config.properties 缺少必填项: xiaozhi.endpoint / xiaozhi.token");
    process.exit(1);
}

export default config;
