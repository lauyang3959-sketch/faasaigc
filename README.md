## 钉钉AI表格字段模板开发demo仓库

生图 API 地址：[https://ai.ueaigc.com](https://ai.ueaigc.com)

### 本地调试

- 启动：`npm run start`（首次 `npm i` 会自动 patch SDK，改完后需**重启** start）
- 授权：配置面板应出现 **ueaigc** 与「+ 关联账号」；若仍没有，在根目录 `config.json` 写入 `{"authorizations":"你的API Key"}` 也可本地跑通
- 多维表「字段模板调试地址」填：`http://127.0.0.1:8088`（不要带 `/open_field`）
- 浏览器自检：打开 `http://127.0.0.1:8088/open_field` 应能看到 `authorizations` 与 `formItems`
- 若钉钉网页版/手机调试：须改成本机局域网 IP，如 `http://192.168.x.x:8088`
### 使用
- 启动
```bash
npm run start
```
- 构建
```bash
npm run build
```

### AI快速实现字段模板
目前做了claude code的context工程，可以在项目下直接使用claude code的/create来新建字段模板
