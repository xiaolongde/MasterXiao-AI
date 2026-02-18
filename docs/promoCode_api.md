# 核销码系统 API 接口文档

> 基础地址：`http://localhost:3000/api`

---

## 一、兑换码管理接口

### 1.1 验证兑换码

校验兑换码是否有效（未过期、未用完、未禁用）。

| 项目 | 说明 |
|------|------|
| 路径 | `POST /api/redeem/verify` |
| Content-Type | `application/json` |

**请求参数**

```json
{
  "code": "XHS12345678"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 兑换码 |

**响应示例**

```json
// 成功
{
  "success": true,
  "message": "兑换码有效",
  "data": {
    "id": 1,
    "code": "XHS12345678",
    "type": "single",
    "remaining": 1
  }
}

// 失败
{
  "success": false,
  "message": "兑换码已使用",
  "data": null
}
```

**可能的失败消息**

| message | 说明 |
|---------|------|
| 兑换码不存在 | code 在数据库中未找到 |
| 兑换码已禁用 | 管理员手动禁用 |
| 兑换码已过期 | 超过 expires_at 时间 |
| 兑换码已使用 | 单次码已用过 |
| 兑换码已达到最大使用次数 | 多次码超出 max_uses |

---

### 1.2 使用兑换码

消耗一次兑换码使用次数。内部会先调用验证，通过后才计数。

| 项目 | 说明 |
|------|------|
| 路径 | `POST /api/redeem/use` |
| Content-Type | `application/json` |

**请求参数**

```json
{
  "code": "XHS12345678"
}
```

**响应示例**

```json
// 成功
{ "success": true, "message": "兑换码使用成功" }

// 失败（码无效）
{ "success": false, "message": "兑换码已使用" }
```

---

### 1.3 获取兑换码列表（管理员）

| 项目 | 说明 |
|------|------|
| 路径 | `GET /api/redeem/list` |

**Query 参数**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| status | string | 否 | - | 按状态过滤：active / used / expired / disabled |
| source | string | 否 | - | 按来源过滤：admin / xhs |
| limit | number | 否 | 100 | 每页数量 |
| offset | number | 否 | 0 | 偏移量 |

**响应示例**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "XHS12345678",
      "type": "single",
      "max_uses": 1,
      "used_count": 0,
      "expires_at": null,
      "status": "active",
      "source": "xhs",
      "remark": "",
      "created_at": "2026-02-07 10:00:00",
      "updated_at": "2026-02-07 10:00:00"
    }
  ]
}
```

---

### 1.4 创建单个兑换码（管理员）

| 项目 | 说明 |
|------|------|
| 路径 | `POST /api/redeem/create` |
| Content-Type | `application/json` |

**请求参数**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| code | string | 否 | 自动生成 | 兑换码，不传则自动生成 `XHS` + 8位随机字符 |
| type | string | 否 | `single` | 类型：`single` 单次 / `multi` 多次 |
| max_uses | number | 否 | 1 | 最大使用次数 |
| expires_at | string | 否 | null | 过期时间，ISO 日期格式 |
| source | string | 否 | `admin` | 来源：`admin` / `xhs` |
| remark | string | 否 | - | 备注 |

**响应示例**

```json
{
  "success": true,
  "message": "创建成功",
  "data": {
    "id": 1,
    "code": "XHS12345678",
    "type": "single",
    "max_uses": 1,
    "status": "active",
    "source": "xhs"
  }
}
```

---

### 1.5 批量创建兑换码（管理员）

| 项目 | 说明 |
|------|------|
| 路径 | `POST /api/redeem/batch-create` |
| Content-Type | `application/json` |

**请求参数**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| count | number | 否 | 10 | 创建数量，最大 1000 |
| type | string | 否 | `single` | 类型 |
| max_uses | number | 否 | 1 | 最大使用次数 |
| expires_at | string | 否 | null | 过期时间 |
| source | string | 否 | `xhs` | 来源 |
| prefix | string | 否 | `XHS` | 码前缀 |

**响应示例**

```json
{
  "success": true,
  "message": "成功创建 10 个兑换码",
  "data": [ ... ]
}
```

---

### 1.6 删除兑换码（管理员）

| 项目 | 说明 |
|------|------|
| 路径 | `DELETE /api/redeem/:id` |

**路径参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 兑换码 ID |

**响应示例**

```json
{ "success": true, "message": "删除成功" }
```

---

### 1.7 更新兑换码状态（管理员）

| 项目 | 说明 |
|------|------|
| 路径 | `PUT /api/redeem/:id/status` |
| Content-Type | `application/json` |

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 目标状态：`active` / `disabled` / `expired` / `used` |

**响应示例**

```json
{ "success": true, "message": "状态更新成功" }
```

---

## 二、匹配记录接口

核销码兑换后的匹配流程追踪，记录从创建到完成的全生命周期。

### 状态码定义

| 状态值 | 含义 | 说明 |
|--------|------|------|
| 0 | 请求中 | 记录刚创建，匹配尚未完成 |
| 1 | 成功 | 匹配/分析已完成 |
| 2 | 失败 | 匹配/分析出错 |

### 2.1 创建匹配记录

用户提交表单后调用，记录初始状态为 `0`（请求中）。

| 项目 | 说明 |
|------|------|
| 路径 | `POST /api/match/record/create` |
| Content-Type | `application/json` |

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | 是 | 会话 ID，UUID v4 格式，至少 16 个字符 |
| reqData | object | 是 | 用户提交的表单数据（JSON 存储） |
| userId | string | 否 | 用户 ID，默认 null |

**请求示例**

```json
{
  "sessionId": "a6ac2240-1998-4af2-883f-ecdfc8298295",
  "reqData": {
    "type": "love",
    "method": "birthday",
    "personA": { "name": "张三", "gender": "男", "birthDate": "1995-06-15" },
    "personB": { "name": "李四", "gender": "女", "birthDate": "1996-03-20" },
    "timestamp": 1770448282719
  },
  "userId": null
}
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "recordId": 1,
    "sessionId": "a6ac2240-1998-4af2-883f-ecdfc8298295"
  }
}
```

**错误响应**

| HTTP 状态码 | code | 场景 |
|-------------|------|------|
| 400 | 40001 | sessionId 缺失或格式错误 |
| 400 | 400 | reqData 缺失 |
| 409 | 40901 | sessionId 已存在（冲突） |
| 500 | 500 | 服务器内部错误 |

---

### 2.2 更新匹配记录状态

匹配/分析完成或失败后调用，将状态从 `0` 更新为 `1`（成功）或 `2`（失败）。

| 项目 | 说明 |
|------|------|
| 路径 | `PUT /api/match/record/update-status` |
| Content-Type | `application/json` |

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | 是 | 会话 ID |
| status | number | 是 | 目标状态：`1`（成功）或 `2`（失败） |
| resultData | object | 否 | 匹配结果数据（JSON 存储） |

**请求示例（成功）**

```json
{
  "sessionId": "a6ac2240-1998-4af2-883f-ecdfc8298295",
  "status": 1,
  "resultData": {
    "content": "完整的匹配分析结果文本...",
    "score": 92,
    "conclusion": "非常契合"
  }
}
```

**请求示例（失败）**

```json
{
  "sessionId": "a6ac2240-1998-4af2-883f-ecdfc8298295",
  "status": 2,
  "resultData": {
    "error": "AI分析服务超时",
    "errorCode": "TIMEOUT",
    "retryable": true
  }
}
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "sessionId": "a6ac2240-1998-4af2-883f-ecdfc8298295",
    "status": 1
  }
}
```

**错误响应**

| HTTP 状态码 | code | 场景 |
|-------------|------|------|
| 400 | 400 | sessionId 缺失、status 缺失或无效（不是 1 或 2） |
| 404 | 404 | sessionId 对应的记录不存在 |
| 500 | 500 | 服务器内部错误 |

---

### 2.3 查询匹配记录状态

轮询接口，前端定时查询当前匹配是否完成。

| 项目 | 说明 |
|------|------|
| 路径 | `GET /api/match/record/status` |

**Query 参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | 是 | 会话 ID |

**请求示例**

```
GET /api/match/record/status?sessionId=a6ac2240-1998-4af2-883f-ecdfc8298295
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "sessionId": "a6ac2240-1998-4af2-883f-ecdfc8298295",
    "status": 1,
    "updateDate": "2026-02-07 15:12:24"
  }
}
```

**错误响应**

| HTTP 状态码 | code | 场景 |
|-------------|------|------|
| 400 | 400 | sessionId 缺失 |
| 404 | 404 | 记录不存在 |

---

### 2.4 查询匹配记录详情

获取匹配记录的完整信息，包含请求数据和结果数据。

| 项目 | 说明 |
|------|------|
| 路径 | `GET /api/match/record/detail` |

**Query 参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | 是 | 会话 ID |

**请求示例**

```
GET /api/match/record/detail?sessionId=a6ac2240-1998-4af2-883f-ecdfc8298295
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "sessionId": "a6ac2240-1998-4af2-883f-ecdfc8298295",
    "userId": null,
    "status": 1,
    "reqData": {
      "type": "love",
      "method": "birthday",
      "personA": { "name": "张三", "gender": "男", "birthDate": "1995-06-15" },
      "personB": { "name": "李四", "gender": "女", "birthDate": "1996-03-20" }
    },
    "resultData": {
      "content": "完整的匹配分析结果文本...",
      "score": 92,
      "conclusion": "非常契合"
    },
    "createDate": "2026-02-07 15:11:23",
    "updateDate": "2026-02-07 15:12:24"
  }
}
```

**错误响应**

| HTTP 状态码 | code | 场景 |
|-------------|------|------|
| 400 | 400 | sessionId 缺失 |
| 404 | 404 | 记录不存在 |

---

## 三、数据表结构

### 3.1 兑换码表 `redeem_codes`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO_INCREMENT | 主键 |
| code | TEXT | UNIQUE, NOT NULL | 兑换码 |
| type | TEXT | DEFAULT 'single' | 类型：`single` 单次 / `multi` 多次 |
| max_uses | INTEGER | DEFAULT 1 | 最大使用次数 |
| used_count | INTEGER | DEFAULT 0 | 已使用次数 |
| expires_at | DATETIME | NULL | 过期时间 |
| status | TEXT | DEFAULT 'active' | 状态：`active` / `busy` / `used` / `expired` / `disabled` |
| source | TEXT | DEFAULT 'admin' | 来源：`admin` / `xhs` |
| remark | TEXT | NULL | 备注 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 3.2 会话匹配记录表 `session_match_records`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO_INCREMENT | 主键 |
| session_id | TEXT | UNIQUE, NOT NULL | 会话 ID（UUID v4） |
| user_id | TEXT | DEFAULT NULL | 用户 ID |
| status | INTEGER | NOT NULL, DEFAULT 0 | 状态：`0` 请求中 / `1` 成功 / `2` 失败 |
| req_data | TEXT | NULL | 请求数据（JSON 字符串） |
| result_data | TEXT | NULL | 结果数据（JSON 字符串） |
| create_date | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| update_date | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**索引**

- `idx_smr_session_id` — session_id 唯一索引
- `idx_smr_status` — status 索引
- `idx_smr_create_date` — create_date 索引

---

## 四、业务流程

```
用户访问 /xhs?s=CODE
        │
        ▼
  ┌─────────────┐
  │ 前端生成      │  localStorage 存储 sessionId (UUID v4)
  │ sessionId    │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐    POST /api/redeem/verify
  │ 验证兑换码    │──→ 校验有效性
  └──────┬──────┘
         │ 有效
         ▼
  ┌─────────────┐    POST /api/redeem/use
  │ 使用兑换码    │──→ 计数 +1
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ 用户填写表单  │   输入双方信息
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐    POST /api/match/record/create
  │ 创建匹配记录  │──→ status=0 (请求中)
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐    POST /api/analysis/birthMatch (SSE 流式)
  │ 执行 AI 分析  │──→ Deepseek API 流式响应
  └──────┬──────┘
         │
    ┌────┴────┐
    ▼         ▼
 ┌─────┐  ┌─────┐
 │ 成功 │  │ 失败 │
 └──┬──┘  └──┬──┘
    │        │     PUT /api/match/record/update-status
    │        │──→  status=2, resultData={error:...}
    │
    │──→ status=1, resultData={content:..., score:...}
    │
    ▼
 ┌──────────────┐
 │ 结果展示页面   │   前端渲染分析报告
 └──────────────┘
```

---

## 五、错误码汇总

| 错误码 | HTTP 状态码 | 含义 | 处理建议 |
|--------|-------------|------|----------|
| 40001 | 400 | SessionId 格式错误或缺失 | 前端重新生成 UUID v4 |
| 40901 | 409 | SessionId 冲突（已存在） | 前端重新生成并重试 |
| 400 | 400 | 通用参数错误 | 检查请求参数 |
| 404 | 404 | 记录不存在 | 检查 sessionId 是否正确 |
| 500 | 500 | 服务器内部错误 | 稍后重试或联系管理员 |

---

## 六、前端 SessionId 管理

```javascript
// 应用启动时自动初始化
if (!localStorage.getItem('sessionId')) {
    const sessionId = crypto.randomUUID();  // UUID v4
    localStorage.setItem('sessionId', sessionId);
}

// 获取当前 sessionId
function getSessionId() {
    return localStorage.getItem('sessionId');
}

// 冲突时重新生成
function regenerateSessionId() {
    const newId = crypto.randomUUID();
    localStorage.setItem('sessionId', newId);
    return newId;
}
```

---

## 七、接口清单速查

| 接口名称 | 方法 | 路径 | 说明 |
|---------|------|------|------|
| 验证兑换码 | POST | `/api/redeem/verify` | 校验兑换码有效性 |
| 使用兑换码 | POST | `/api/redeem/use` | 消耗兑换码使用次数 |
| 兑换码列表 | GET | `/api/redeem/list` | 管理员查看所有兑换码 |
| 创建兑换码 | POST | `/api/redeem/create` | 管理员创建单个兑换码 |
| 批量创建兑换码 | POST | `/api/redeem/batch-create` | 管理员批量创建 |
| 删除兑换码 | DELETE | `/api/redeem/:id` | 管理员删除 |
| 更新兑换码状态 | PUT | `/api/redeem/:id/status` | 管理员更新状态 |
| 创建匹配记录 | POST | `/api/match/record/create` | 创建记录，初始状态 0 |
| 更新匹配状态 | PUT | `/api/match/record/update-status` | 更新为 1(成功) 或 2(失败) |
| 查询记录状态 | GET | `/api/match/record/status` | 轮询查询当前状态 |
| 查询记录详情 | GET | `/api/match/record/detail` | 获取完整记录信息 |
