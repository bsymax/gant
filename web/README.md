# Web 应用（Next.js）

详细说明、改界面入口、**初始化 JSON 配人配项目** 均见**仓库根目录**：

- `../README.md`
- `../docs/README.md`
- `../docs/系统功能与文件地图.md`
- `../docs/初始化配置说明.md`

## 本目录常用命令

```bash
cp config/initial-data.example.json config/initial-data.json
# 编辑 initial-data.json 后：
npm run db:seed
npm run dev
```

`config/initial-data.json` 为本地私域文件，**勿提交**（已在根 `.gitignore` 忽略）。
