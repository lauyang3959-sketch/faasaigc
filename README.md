## 钉钉 AI 表格字段模板：AI 生图多模型

基于 FaaS 的字段模板，调用 [ueaigc 生图 API](https://ai.ueaigc.com)（`https://ai.ueaigc.com/v1/images/generations`），支持提示词、参考图、分辨率、比例、模型与**生成张数**（可引用字段）。

---

### 字段模板配置项

| 配置项 | 表单 key | 说明 |
|--------|----------|------|
| 提示词 | `prompt` | 必填，支持引用字段 |
| 参考图 | `sourceImage` | 可选，引用「附件」列，图生图时写入请求体 `image` |
| 分辨率 | `resolution` | 1k / 2k / 4k，映射为 `quality`：low / medium / high |
| 比例 | `ratio` | 如 1:1、16:9、9:16，映射为 `size` |
| AI 模型 | `model` | 如 `gpt-image-2`、`gpt-image-1.5` |
| 生成张数 | `imageCount` | 1–10，映射为 API 参数 **`n`**，支持引用数字/文本字段；不填默认为 1 |

返回类型为**附件**，`execute` 会将响应 `data` 数组中的每张图写入单元格（多张附件）。

---

### 生图 API

- **地址**：`POST https://ai.ueaigc.com/v1/images/generations`
- **鉴权**：`Authorization: Bearer <API Key>`（本地调试用 `config.json`，线上用「关联 ueaigc 账号」）
- **域名白名单**：`ai.ueaigc.com`

#### 请求体说明

| 参数 | 类型 | 说明 |
|------|------|------|
| `model` | string | 模型，如 `gpt-image-1.5`、`gpt-image-2` |
| `prompt` | string | 提示词 |
| `size` | string | 出图尺寸，如 `1024x1024`、`1536x1024`、`1024x1536` |
| **`n`** | number | **生成张数**（本模板「生成张数」配置项对应此字段） |
| `quality` | string | `low` / `medium` / `high` |
| `response_format` | string | 固定 `url` |
| `output_compression` | number | 如 `100` |
| `image` | string[] | 可选，参考图公网 URL 列表（图生图） |

#### 请求示例

```json
{
  "model": "gpt-image-1.5",
  "size": "1024x1024",
  "n": 2,
  "prompt": "火起来",
  "quality": "medium",
  "output_compression": 100,
  "response_format": "url",
  "image": [
    "https://s3.ffire.cc/files/jimeng.jpg"
  ]
}
```

#### 响应说明

成功时 **`data` 为数组**，长度与 `n` 一致（或异步任务完成后在 `data` 中返回多张），每项含图片 URL，例如：

```json
{
  "data": [
    { "url": "https://example.com/1.png" },
    { "url": "https://example.com/2.png" }
  ]
}
```

本模板会解析 `data[].url`（及 `image_url` 等兼容字段），全部写入附件列。若接口返回 `task_id`，会轮询 `GET /v1/tasks/{task_id}` 直至任务完成后再取完整 `data` 数组。

---

### 本地调试

1. 安装依赖（会自动 patch SDK）：

```bash
npm i
```

2. 在根目录 `config.json` 配置 API Key（仅本地 mock，勿提交 Git）：

```json
{
  "authorizations": "sk-你的密钥"
}
```

3. 启动：

```bash
npm run start
```

4. 多维表「字段模板调试地址」填：**`http://127.0.0.1:8088`**（不要带 `/open_field`）。

5. 浏览器自检：打开 [http://127.0.0.1:8088/open_field](http://127.0.0.1:8088/open_field)，应能看到 `authorizations` 与 `formItems`（含 `imageCount`）。

6. 钉钉网页版/手机调试时，须改成本机局域网 IP，例如 `http://192.168.x.x:8088`。

7. 修改 `src/index.ts` 或 `node_modules` patch 后需**重启** `npm run start`；修改字段配置后建议在表里**删除旧模板再重新添加**。

---

### 打包上线（本企业自用）

```bash
npm run build
```

生成 `output/output.zip`，在钉钉开放平台企业内部应用中上传字段模板包。

---

### 其他

- 授权平台 `platform` 暂用 `aimaxhug` 以兼容钉钉「关联账号」展示，展示名为 **ueaigc**。
- 使用 Cursor 时可在项目下通过 `/create` 快速新建其他字段模板（见 `knowledges/` 官方指南）。
