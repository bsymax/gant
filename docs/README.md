# 文档索引

| 文档 | 用途 |
|------|------|
| [系统功能与文件地图](./系统功能与文件地图.md) | 现在有哪些功能、**改界面/改逻辑去哪个文件** |
| [界面与配色-极光指挥台v2](./界面与配色-极光指挥台v2.md) | 新配色思路、**改颜色改哪里**（`web/app/globals.css`） |
| [初始化配置说明](./初始化配置说明.md) | 用 JSON 表填人、项目、时间后导入数据库 |
| [初始化配置表-模板](./初始化配置表-模板.md) | **Markdown 表格**对照，方便在文档里先填一版再抄到 JSON |
| [PRD-项目管理系统-分版本规划](./PRD-项目管理系统-分版本规划.md) | 产品分版本与业务定稿 |
| [DEV-PLAN](./DEV-PLAN.md) | 工程侧开发节奏（面向实现者） |

**快速改外观**：打开 `web/app/globals.css` 顶部的 `:root` 变量与 `.gant-*` 类。

**快速配人配项目**：复制 `web/config/initial-data.example.json` 为 `web/config/initial-data.json`（该文件不提交 Git），改好后在 `web` 目录执行 `npm run db:seed`（或删库后 `npx prisma migrate dev` 触发种子）。
