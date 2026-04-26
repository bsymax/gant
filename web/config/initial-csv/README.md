# CSV 初值表（可在此填写）

## 四张表的分工

| 文件 | 作用 |
|------|------|
| `users.csv` | 人员：**ERP 工号**、姓名、角色 `LEAD` 或 `MEMBER`（系统内**用 ERP 唯一关联人**） |
| `projects.csv` | 项目：标题、说明、**排期模式**、状态、**计划起止**（`YYYY-MM-DD`，可空） |
| `project_members.csv` | 谁参与哪个项目：用**与 projects 中完全一致的项目标题** + **userErp**（每行一个人） |
| `tasks.csv` | 某项目下的事项（可选）：`assigneeErps` 为多人时**英文逗号**分隔，值为 **ERP** |

**注意**：列名**不要改**；表头**必须**保留第一行。用 Excel 另存为 **UTF-8 CSV**（见 Excel「CSV UTF-8(逗号分隔)」）。

## 生成 JSON 并灌库

在 **`web` 目录**下：

```bash
npm run config:from-csv
npm run db:seed
```

会生成/覆盖 `config/initial-data.json`（该文件默认不提交，勿把真实工号当模板推远端）。

## 与文档

仓库 `docs/初始化配置说明.md`、`docs/CSV初始配置-方案与流程.md`。
