# 小智 AI MCP 服务（Node.js）

一个轻量的自建 MCP（Model Context Protocol）服务示例，通过 WebSocket 将你自己电脑 / 服务器上的能力接入 [小智 AI](https://xiaozhi.dev)（ESP32 语音机器人）。

对小智设备说一句"帮我看看电脑状态"，云端就会调用本服务注册的工具并语音播报结果。

## 特性

- ✅ **零门槛扩展**：一个工具一个文件，放进 `tools/` 目录即自动注册，无需改任何框架代码
- ✅ **配置与代码分离**：接入点、token 全部放在 `config.properties`，天然适合开源分享
- ✅ **断线自动重连**：网络波动后自动恢复，长期驻留运行
- ✅ **标准 MCP 协议**：基于官方 [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)，协议握手、工具发现、参数校验全部交给 SDK

## 环境要求

- Node.js >= 18（本项目在 v24 下开发验证）
- 一个已激活的小智 AI 设备 / 智能体
- 小智后台生成的 MCP 接入点 URL 与 token

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置接入点

复制配置模板并填入你自己的信息：

```bash
cp config.example.properties config.properties
```

编辑 `config.properties`：

```properties
# 必填：小智 MCP 接入点（从小智控制台/接入地址中获取）
xiaozhi.endpoint=wss://api.xiaozhi.me/mcp/
xiaozhi.token=你的接入点token

# 可选：MCP 服务标识
server.name=xiaozhi-mcp-server
server.version=1.0.0

# 可选：断线重连间隔（毫秒），默认 5000
reconnect.interval.ms=5000
```

> ⚠️ `config.properties` 包含你的 token，已在 `.gitignore` 中排除，**请勿提交到公开仓库**。

### 3. 启动服务

```bash
npm start
```

看到以下输出即代表接入成功：

```
✅ 已连接到小智 MCP 接入点
🔧 已注册工具: get_computer_status（获取电脑状态）
🚀 MCP 协议握手完成，工具已就绪
```

对小智设备说：**"帮我看一下电脑状态"**，即可触发工具调用。

## 目录结构

```
xiaozhi-mcp-server/
├── index.js                  # 入口：建立连接、断线重连
├── src/
│   ├── config.js             # 读取并校验 config.properties
│   ├── server.js             # 创建 MCP Server，自动扫描注册工具
│   └── transport.js          # WebSocket ↔ MCP SDK 的 Transport 桥接
├── tools/                    # 能力目录：一个文件 = 一个工具
│   └── computerStatus.js     # 示例：获取电脑运行状态
├── config.example.properties # 配置模板（可提交）
├── config.properties         # 本地真实配置（不提交）
└── package.json
```

## 如何新增能力

在 `tools/` 目录下新建一个 `.js` 文件，默认导出 `{ name, definition, handler }` 三件套即可，重启后自动注册。

以查询天气为例，新建 `tools/weather.js`：

```js
import { z } from "zod";

export default {
    name: "get_weather", // 工具名，小智侧调用时使用（建议 snake_case）
    definition: {
        title: "查询天气",
        description: "查询指定城市的天气情况", // 写清楚，大模型靠它决定何时调用
        inputSchema: {
            city: z.string().describe("城市名，如：杭州"),
        },
    },
    handler: async ({ city }) => {
        // 这里替换为真实逻辑（调 API、读传感器等）
        return {
            content: [{ type: "text", text: `${city} 晴，25℃` }],
        };
    },
};
```

要点：

- `name`：工具唯一标识，避免重复（重复注册会报错）
- `description`：直接影响大模型能否正确选中你的工具，尽量写清适用场景
- `inputSchema`：使用 [zod](https://zod.dev) 原始形状定义参数，无参数写 `{}`
- `handler`：返回 `{ content: [{ type: "text", text: "..." }] }`，抛异常会被 SDK 转成工具调用错误

## 工作原理

```
ESP32 设备 ⇄ 小智云端（LLM 决定调用工具） ⇄ WebSocket ⇄ 本服务（MCP Server）
```

本进程作为 MCP 服务端主动连出到小智 MCP 接入点；小智云端作为 MCP 客户端，通过这条 WebSocket 连接按 JSON-RPC 2.0 与本机交换消息（`initialize` 握手 → `tools/list` 发现工具 → `tools/call` 执行工具）。`src/transport.js` 负责把原始 WebSocket 桥接给 MCP SDK 的协议层。

## 常见问题

**Q：启动后一直"连接已断开，x 秒后重连"？**
检查 `config.properties` 中 token 是否有效、是否过期，以及机器能否访问 `api.xiaozhi.me`。

**Q：工具注册了但小智不调用？**
确认该接入点已绑定到设备所属的同一个智能体；优化 `description` 描述，让大模型更容易匹配意图。

**Q：想部署到服务器 7x24 运行？**
推荐用 systemd 或 pm2 守护进程：`pm2 start index.js --name xiaozhi-mcp`。

## License

MIT
