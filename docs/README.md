# 文档索引

| 文档 | 用途 |
|------|------|
| [系统功能与文件地图](./系统功能与文件地图.md) | 现在有哪些功能、**改界面/改逻辑去哪个文件** |
| [界面与配色-极光指挥台v2](./界面与配色-极光指挥台v2.md) | 新配色思路、**改颜色改哪里**（`web/app/globals.css`） |
| [初始化配置说明](./初始化配置说明.md) | 用 JSON 或 **CSV** 填人、项目、时间后导入 |
| [CSV初始配置-方案与流程](./CSV初始配置-方案与流程.md) | **四张 CSV** 怎么填、怎么转 JSON、与谁关联 |
| [初始化配置表-模板](./初始化配置表-模板.md) | Markdown 表对照；亦可直接改 `web/config/initial-csv/*.csv` |
| [PRD-项目管理系统-分版本规划](./PRD-项目管理系统-分版本规划.md) | 产品分版本与业务定稿 |
| [DEV-PLAN](./DEV-PLAN.md) | 工程侧开发节奏（面向实现者） |

**快速改外观**：打开 `web/app/globals.css` 顶部的 `:root` 变量与 `.gant-*` 类。

**快速配人配项目**：  
- **CSV**：改 `web/config/initial-csv/*.csv` → `npm run config:from-csv` → `npm run db:seed`  
- 或直接编辑 `config/initial-data.json`（两者择一，CSV 会覆盖 json）
