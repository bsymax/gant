# CSV 初值表（可在此填写）

## 四张表的分工

| 文件 | 作用 |
|------|------|
| `users.csv` | 人员：邮箱、姓名、角色 `LEAD` 或 `MEMBER` |
| `projects.csv` | 项目：标题、说明、**排期模式**、状态、**计划起止**（`YYYY-MM-DD`，可空） |
| `project_members.csv` | 谁参与哪个项目：用**与 projects 中完全一致的项目标题** + 用户邮箱（每行一个人） |
| `tasks.csv` | 某项目下的事项（可选；无则只留表头或删光数据行） |

**注意**：列名**不要改**；表头**必须**保留第一行。用 Excel/Numbers 编辑后，请**另存为 UTF-8**（Excel：「CSV UTF-8(逗号分隔)」），避免乱码。

## 生成 JSON 并灌库

在 **`web` 目录**下：

```bash
npm run config:from-csv
npm run db:seed
```

会生成/覆盖 `config/initial-data.json`（此文件在 Git 中忽略，勿当模板提交你的真实表）。

## 与 JSON 的对应

详见仓库 `docs/初始化配置说明.md` 与 `docs/CSV初始配置-方案与流程.md`。
