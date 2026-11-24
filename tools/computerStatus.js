/**
 * 工具：获取电脑状态
 *
 * 每个工具文件默认导出一个描述对象即可被自动注册：
 *   name       - 工具名（小智侧调用时使用，建议 snake_case）
 *   definition - MCP registerTool 的定义（title / description / inputSchema）
 *   handler    - 工具执行函数，返回 { content: [...] }
 *
 * inputSchema 使用 zod 原始形状（RawShape），无参数工具写 {} 即可；
 * 需要参数时：inputSchema: { city: z.string().describe("城市名") }
 */
import os from "node:os";

function formatBytes(bytes) {
    return (bytes / 1024 / 1024 / 1024).toFixed(1) + "GB";
}

export default {
    name: "get_computer_status",
    definition: {
        title: "获取电脑状态",
        description: "获取当前电脑的运行状态，包括CPU、内存、磁盘等信息",
        inputSchema: {},
    },
    handler: async () => {
        const cpus = os.cpus();
        const model = cpus[0]?.model?.trim() || "未知";
        // 以每 100ms 采样的方式估算整机 CPU 占用
        const totalIdle = cpus.reduce((s, c) => s + c.times.idle, 0);
        const totalTick = cpus.reduce((s, c) => s + Object.values(c.times).reduce((a, b) => a + b, 0), 0);
        const cpuUsage = (100 - (totalIdle / totalTick) * 100).toFixed(0);

        const memTotal = os.totalmem();
        const memFree = os.freemem();

        const status = {
            cpu: `${cpuUsage}% (${model}, ${cpus.length} 核)`,
            memory: `${formatBytes(memTotal - memFree)} / ${formatBytes(memTotal)}`,
            uptime: `${Math.floor(os.uptime() / 86400)}天${Math.floor((os.uptime() % 86400) / 3600)}小时`,
            os: `${os.type()} ${os.release()} (${os.arch()})`,
            hostname: os.hostname(),
        };

        return {
            content: [
                {
                    type: "text",
                    text: [
                        "电脑状态：",
                        `CPU：${status.cpu}`,
                        `内存使用：${status.memory}`,
                        `运行时间：${status.uptime}`,
                        `系统：${status.os}`,
                        `主机名：${status.hostname}`,
                    ].join("\n"),
                },
            ],
        };
    },
};
