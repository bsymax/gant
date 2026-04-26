# CSV 初值表：方案与流程

> **0.3.0** 起，可用 **四张 CSV** 填人/项目/成员/事项，一条命令转 **`initial-data.json`**，再与原有种子链衔接。适合习惯 Excel、WPS 表格的用户。

## 1. 为什么用 CSV 而不是只写 JSON

- **和表格软件一致**，复制、排序、让同事一起改都方便。  
- **表之间用「项目标题」关联**，`project_members` 与 `tasks` 不需要嵌套，避免在表格里手搓大括号。  
- 转 JSON 由脚本**固定规则**完成，减少手写 JSON 的逗号/引号错误。

## 2. 文件放在哪、叫什么

**目录**（在仓库中已带示例，你可直接改）：`web/config/initial-csv/`

| 文件 | 必填 | 作用 |
|------|------|------|
| `users.csv` | 是 | 所有登录身份（**erp** 工号、姓名、角色，1 个 LEAD + 若干 MEMBER 常见） |
| `projects.csv` | 是 | 可只有表头、无项目行（表示不建项目） |
| `project_members.csv` | 否* | 为每个项目点兵：项目标题 + **userErp(工号)**，每行一个人 |
| `tasks.csv` | 否 | 项目下事项；`assigneeErps` 为**英文逗号**分隔的 **ERP**；无则只留表头或留空文件 |

*若 `projects` 里已有项目，则**每个项目**在 `project_members` 里**至少**要有一行，否则会报错，避免误配出「无成员项目」。

## 3. 数据怎么关联（重要）

- **人**：全局唯一用 **ERP 工号 `erp`（CSV 中 users 列为 `erp`，成员表里为 `userErp`）**。  
- **项目**：在 `projects` 和 `project_members` / `tasks` 里用**完全相同的**「项目标题」`title` 字符串（含标点、全角半角要一致）。  
- **起止日期**：`YYYY-MM-DD`；`IN_RESERVE` 一般留空；`TBD_ON_TIMELINE` 两列都空；`ON_TIMELINE` 建议填 `plannedStart`（`plannedEnd` 可空，见《初始化配置说明》）。  

## 4. 你动手填写的顺序（建议）

1. 在 **`users.csv`** 填好所有人（至少 1 个 `LEAD`）。  
2. 在 **`projects.csv`** 填好所有项目行。  
3. 在 **`project_members.csv`** 为每个项目添行（**每个项目至少一人**）。  
4. 可选：在 **`tasks.csv`** 填事项；`assigneeEmails` 多人用**英文逗号**分隔，须出现在 `users` 中。  
5. 在 **`web` 目录**执行：

```bash
npm run config:from-csv
```

6. 再执行：

```bash
npm run db:seed
```

7. 产物 **`web/config/initial-data.json`** 为脚本生成/覆盖（默认 **不提交 Git**）。种子逻辑同之前：有该 JSON 时走文件，否则走**内置 7+1 示范**（见 `prisma/seed.ts`）。

## 5. 和 AI / 助手的配合方式

- 你填好 CSV 后，可以说：**「已填 initial-csv，请转成 json 并检查」** —— 在本地即运行 `npm run config:from-csv`；在 Cursor 里也可以让我**按同样规则**帮你核对列名、日期格式。  
- 若你从 Excel 粘贴进来出现**乱码**，请用 **「CSV UTF-8（逗号分隔）」** 再保存，见 `config/initial-csv/README.md`。

## 6. 脚本与维护位置

- 转换脚本：`web/scripts/csv-to-initial-data.ts`  
- 要改**列名兼容**、**多语言表头**时，只改此脚本中 `r["erp"]` / `usererp` 等映射即可。  

## 7. 与数据库关系

- 自 **0.4.0** 起，`User` 表**唯一外显键**为 `erp`（**不再**使用 `email`）。自旧版升级时，迁移会**将原 `email` 值拷入 `erp`**，可再用 CSV/JSON 重灌为正式工号。

## 8. 版本

- **0.3.0**：首版 CSV 导入。  
- **0.4.0**：用户与所有关联**统一为 ERP**。
