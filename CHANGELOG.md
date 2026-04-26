# 变更记录

## [0.3.0] - 2026-04-26

### 新增

- **CSV 初值表**：`web/config/initial-csv/` 下 `users`、`projects`、`project_members`、`tasks` 四表；`npm run config:from-csv` 生成 `config/initial-data.json`。
- 转换脚本 `web/scripts/csv-to-initial-data.ts`（自实现轻量 CSV 解析，支持引号与英文逗号分隔协作人列表）。
- 文档 [docs/CSV初始配置-方案与流程.md](./docs/CSV初始配置-方案与流程.md)，并回链至「初始化配置说明 / 系统功能与文件地图 / docs 索引」。

### 工程

- `web/package.json` 版本 **0.3.0**，新增脚本 `config:from-csv`。

---

## [0.2.0] - 2026-04-26

### 新增

- **「极光指挥台 · Aurora v2」** 配色：整体调亮、提高正文与线框对比，保留科技/HUD/轻度游戏感；以 `web/app/globals.css` 的 `:root` 与 `.gant-*` 为唯一主入口。
- 文档包：**系统功能与文件地图**、**界面与配色说明**、**初始化配置说明**、**配置表（Markdown 模板）**、**docs 索引**。
- 支持 **`web/config/initial-data.json`**（不提交 Git）：按 JSON 配用户/项目/时间/事项后 `npm run db:seed` 导入；无此文件时仍用内置示范种子。示例见 `web/config/initial-data.example.json`。

### 工程

- 根目录 `.gitignore` 增加忽略 `web/config/initial-data.json`。
- 应用 `web/package.json` 版本与本文对齐为 **0.2.0**。

---

## [0.1.0] - 2026-04-26

### 新增

- 仓库根目录 Git 与 `.gitignore`；`web/` 下 Next.js 应用可本地运行。
- Prisma + SQLite 数据模型：用户、项目、事项、项目成员、事项协作、审计日志。
- **指挥台** `/command`：储备/意向池、**上战场**（有日期 / 上轴待定 TBD）、**降回探索**、8 周时间轴甘特条（占位与可见窗裁剪）。
- **项目详情** `/command/projects/[id]`：编辑标题/说明、成员、事项、项目级审计时间线（最近 30 条）。
- 开发期**选用户登录** `AUTH_DEV=1`；会话Cookie（Jose HS256，7 天）。
- 策略向暗色 **HUD/网格** 视觉初版。

### 工程说明

- Prisma 固定 **5.22**（ SQLite 在 Prisma 6/7 的 enum/配置有差异，为稳定先锁 5.x）。
- 角色、状态在 SQLite 中存**字符串**（`lib/constants.ts` 对齐）。

### 未纳入

- 飞书/企微、云端部署、能力树/雷达、多组对标接口实装等（见 PRD 后续版本）。
