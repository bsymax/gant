# GANT — 创新团队项目指挥台

| 你关心… | 看这里 |
|--------|--------|
| **想改页面/找文件** | [`docs/系统功能与文件地图.md`](./docs/系统功能与文件地图.md) |
| **想调颜色、变亮/变清** | [`docs/界面与配色-极光指挥台v2.md`](./docs/界面与配色-极光指挥台v2.md) + `web/app/globals.css` |
| **想表格里先配人、再导入** | [`docs/初始化配置说明.md`](./docs/初始化配置说明.md) 与表模板；JSON 用 `web/config/initial-data.example.json` 复制为 `initial-data.json` |
| 产品大方向 | `docs/PRD-项目管理系统-分版本规划.md` |
| 开发节奏 | `docs/DEV-PLAN.md` |
| 文档总索引 | [`docs/README.md`](./docs/README.md) |

## 快速开始（本地）

```bash
cd web
cp .env.example .env
npm install
npx prisma migrate dev
# 若需重跑种子：删除 web/prisma/dev.db 后执行 npx prisma migrate dev && npm run db:seed
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)，使用**选用户登录**（`AUTH_DEV=1`）。

默认种子：**1 组长 + 7 成员**，以及若干示例项目（储备 / 时间轴 / TBD）。

## 技术栈

- **Next.js**（App Router）+ **TypeScript** + **Tailwind CSS 4**
- **Prisma 5** + **SQLite**（`DATABASE_URL=file:./dev.db` 相对 `web/prisma/`，不提交到 Git）
- 会话：**JWS** 签名的 HttpOnly Cookie

## 版本与工程

- 应用版本号在 `web/package.json`；变更记录见 `CHANGELOG.md`。
- 业务**变更审计**在数据库表 `AuditLog`（非 Git 语义上的「版本」）。

## 环境变量

复制 `web/.env.example` 为 `web/.env`，至少配置：

- `DATABASE_URL` — SQLite 路径
- `SESSION_SECRET` — 随机长串
- `AUTH_DEV=1` — 开发期无密码选用户登录
