# Web 应用（Next.js）

详细说明、改界面入口、**初始化 JSON 配人配项目** 均见**仓库根目录**：

- `../README.md`
- `../docs/README.md`
- `../docs/系统功能与文件地图.md`
- `../docs/初始化配置说明.md`

## 本目录常用命令

**方式 A：CSV 填表（推荐非开发）**

```bash
# 编辑 config/initial-csv/*.csv 后：
npm run config:from-csv
npm run db:seed
npm run dev
```

**方式 B：直接改 JSON**

```bash
cp config/initial-data.example.json config/initial-data.json
# 编辑后：
npm run db:seed
```

`config/initial-data.json` 为本地生成/私域，**勿提交**（已在根 `.gitignore` 忽略）。`config/initial-csv/*.csv` 为模板可入 Git，你本地改动的名单也可不提交，自行备份即可。
