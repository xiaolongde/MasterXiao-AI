# MasterXiao-AI 接口文档

> 版本：v1.0  
> 基础路径：`/api`  
> 数据格式：JSON  
> 认证方式：JWT Bearer Token

---

## 目录

- [1. 认证模块 `/api/auth`](#1-认证模块-apiauth)
  - [1.1 发送短信验证码](#11-发送短信验证码)
  - [1.2 发送验证码（兼容旧接口）](#12-发送验证码兼容旧接口)
  - [1.3 用户注册](#13-用户注册)
  - [1.4 用户登录](#14-用户登录)
  - [1.5 重置密码](#15-重置密码)
  - [1.6 获取当前用户信息](#16-获取当前用户信息)
- [2. 用户模块 `/api/user`](#2-用户模块-apiuser)
  - [2.1 权限验证](#21-权限验证)
  - [2.2 更新用户资料](#22-更新用户资料)
  - [2.3 获取邀请信息](#23-获取邀请信息)
  - [2.4 使用邀请码](#24-使用邀请码)
  - [2.5 获取积分/免费次数](#25-获取积分免费次数)
- [3. 通用说明](#3-通用说明)

---

## 1. 认证模块 `/api/auth`

### 1.1 发送短信验证码

**POST** `/api/auth/send-sms`

发送短信验证码，支持注册、登录、重置密码三种场景。

**请求头：** 无需认证

**请求参数：**

| 参数   | 类型   | 必填 | 说明                                           |
| ------ | ------ | ---- | ---------------------------------------------- |
| phone  | string | ✅   | 手机号码（11位，1开头）                        |
| type   | string | ❌   | 验证码类型：`register` / `login` / `reset`，默认 `login` |

**频率限制：**

- 同一手机号 **60秒** 内只能发送 1 次
- 同一手机号每天最多发送 **5 次**

**成功响应：**

```json
{
    "success": true,
    "message": "验证码已发送",
    "code": "123456"  // 仅开发环境返回
}
```

**错误响应：**

| HTTP 状态码 | 错误码         | 说明                             |
| ----------- | -------------- | -------------------------------- |
| 400         | INVALID_PHONE  | 手机号格式不正确                 |
| 400         | INVALID_TYPE   | 无效的验证码类型                 |
| 400         | PHONE_EXISTS   | 手机号已注册（type=register 时） |
| 429         | RATE_LIMITED   | 请求过于频繁，请 N 秒后再试     |
| 429         | DAILY_LIMIT    | 今日验证码发送次数已达上限       |

---

### 1.2 发送验证码（兼容旧接口）

**POST** `/api/auth/send-code`

兼容旧版接口，功能等同于 `send-sms`（type 固定为 `login`）。

**请求参数：**

| 参数  | 类型   | 必填 | 说明             |
| ----- | ------ | ---- | ---------------- |
| phone | string | ✅   | 手机号码（11位） |

**成功响应：**

```json
{
    "success": true,
    "message": "验证码已发送",
    "code": "123456"  // 仅开发环境返回
}
```

---

### 1.3 用户注册

**POST** `/api/auth/register`

新用户注册，需先通过 `send-sms` 接口获取验证码（type=`register`）。

**请求头：** 无需认证

**请求参数：**

| 参数       | 类型   | 必填 | 说明                    |
| ---------- | ------ | ---- | ----------------------- |
| phone      | string | ✅   | 手机号码（11位）        |
| smsCode    | string | ✅   | 短信验证码（6位）       |
| password   | string | ❌   | 登录密码（可选，注册时设置） |
| inviteCode | string | ❌   | 邀请码（可选）          |
| sessionId  | string | ❌   | 会话ID（可选）          |

**注册逻辑：**

- 新用户自动赠送 **1 次免费测试**（credits = 1）
- 如果填写了有效邀请码，邀请人和被邀请人各 **+1 次免费测试**
- 自动生成 6 位邀请码（大写字母 + 数字，排除易混淆字符）
- 注册成功后自动登录，返回 JWT Token

**成功响应：**

```json
{
    "code": 200,
    "message": "注册成功",
    "success": true,
    "data": {
        "userId": "uuid-string",
        "token": "jwt-token-string",
        "expiresIn": 604800,
        "userInfo": {
            "phone": "138****8888",
            "nickname": "用户8888",
            "avatar": null
        },
        "user": {
            "id": "uuid-string",
            "phone": "13800008888",
            "nickname": "用户8888",
            "avatar": null,
            "credits": 1
        }
    }
}
```

**错误响应：**

| HTTP 状态码 | 错误码        | 说明                   |
| ----------- | ------------- | ---------------------- |
| 400         | INVALID_PHONE | 手机号格式不正确       |
| 400         | MISSING_CODE  | 缺少验证码             |
| 400         | PHONE_EXISTS  | 手机号已注册           |
| 400         | INVALID_CODE  | 验证码错误             |
| 400         | CODE_EXPIRED  | 验证码已过期           |
| 400         | CODE_USED     | 验证码已使用           |

---

### 1.4 用户登录

**POST** `/api/auth/login`

支持 **验证码登录** 和 **密码登录** 两种方式。验证码登录时，如果手机号未注册会自动创建账号。

**请求头：** 无需认证

**请求参数：**

| 参数       | 类型    | 必填 | 说明                                        |
| ---------- | ------- | ---- | ------------------------------------------- |
| phone      | string  | ✅   | 手机号码（11位）                            |
| code       | string  | ❌   | 短信验证码（与 smsCode 二选一）             |
| smsCode    | string  | ❌   | 短信验证码（与 code 二选一）                |
| password   | string  | ❌   | 登录密码（与验证码二选一）                  |
| rememberMe | boolean | ❌   | 记住登录，默认 `false`；true 时 token 有效期 30天，否则 7天 |

> **注意：** `code` 和 `smsCode` 字段效果相同，兼容两种前端写法。`验证码` 和 `密码` 至少提供一个。

**登录逻辑：**

- **验证码登录**：验证短信验证码 → 用户不存在则自动注册（赠送1次免费测试）
- **密码登录**：用户必须已注册且已设置密码

**成功响应：**

```json
{
    "success": true,
    "code": 200,
    "message": "登录成功",
    "data": {
        "token": "jwt-token-string",
        "expiresIn": 604800,
        "user": {
            "id": "uuid-string",
            "phone": "13800008888",
            "nickname": "用户8888",
            "avatar": null,
            "credits": 1
        },
        "userInfo": {
            "phone": "138****8888",
            "nickname": "用户8888"
        }
    }
}
```

**错误响应：**

| HTTP 状态码 | 错误码              | 说明                           |
| ----------- | ------------------- | ------------------------------ |
| 400         | MISSING_PHONE       | 缺少手机号                     |
| 400         | MISSING_CREDENTIALS | 缺少验证码或密码               |
| 400         | INVALID_CODE        | 验证码错误                     |
| 400         | CODE_EXPIRED        | 验证码已过期                   |
| 400         | NO_PASSWORD         | 账号未设置密码，请用验证码登录 |
| 400         | WRONG_PASSWORD      | 密码错误                       |
| 404         | USER_NOT_FOUND      | 用户不存在（密码登录时）       |

---

### 1.5 重置密码

**POST** `/api/auth/reset-password`

通过短信验证码重置密码，需先调用 `send-sms`（type=`reset`）获取验证码。

**请求头：** 无需认证

**请求参数：**

| 参数            | 类型   | 必填 | 说明                  |
| --------------- | ------ | ---- | --------------------- |
| phone           | string | ✅   | 手机号码              |
| smsCode         | string | ✅   | 短信验证码            |
| newPassword     | string | ✅   | 新密码（≥6位）        |
| confirmPassword | string | ✅   | 确认密码（需与新密码一致） |

**成功响应：**

```json
{
    "success": true,
    "code": 200,
    "message": "密码重置成功，请重新登录"
}
```

**错误响应：**

| HTTP 状态码 | 错误码             | 说明               |
| ----------- | ------------------ | ------------------ |
| 400         | MISSING_FIELDS     | 信息填写不完整     |
| 400         | PASSWORD_MISMATCH  | 两次密码不一致     |
| 400         | PASSWORD_TOO_SHORT | 密码长度少于6位    |
| 400         | INVALID_CODE       | 验证码错误         |
| 404         | USER_NOT_FOUND     | 用户不存在         |

---

### 1.6 获取当前用户信息

**GET** `/api/auth/me`

获取当前登录用户的详细信息。

**请求头：**

```
Authorization: Bearer <token>
```

**请求参数：** 无

**成功响应：**

```json
{
    "success": true,
    "data": {
        "id": "uuid-string",
        "phone": "13800008888",
        "nickname": "用户8888",
        "avatar": null,
        "credits": 1,
        "testCount": 0,
        "inviteCode": "A3B5K9"
    }
}
```

**错误响应：**

| HTTP 状态码 | 错误码         | 说明                     |
| ----------- | -------------- | ------------------------ |
| 401         | AUTH_REQUIRED  | 未提供认证 Token         |
| 401         | TOKEN_EXPIRED  | Token 已过期             |
| 404         | USER_NOT_FOUND | 用户不存在               |

---

## 2. 用户模块 `/api/user`

### 2.1 权限验证

**POST** `/api/user/check-permission`

检查用户是否有权限使用指定测试类型。支持已登录和未登录两种场景。

**请求头：**

```
Authorization: Bearer <token>  // 可选，未登录时不传
```

**请求参数：**

| 参数       | 类型   | 必填 | 说明       |
| ---------- | ------ | ---- | ---------- |
| testTypeId | string | ✅   | 测试类型ID |
| sessionId  | string | ❌   | 会话ID     |

**权限判断逻辑：**

1. **未登录** → `hasAccess: false, needsLogin: true`
2. **已登录，有免费次数（credits > 0）或有购买记录** → `hasAccess: true`
3. **已登录，无权限** → `hasAccess: false, needsPurchase: true`

**成功响应（已登录有权限）：**

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "hasAccess": true,
        "needsLogin": false,
        "needsPurchase": false,
        "testTypeId": "tarot",
        "userId": "uuid-string",
        "userInfo": {
            "phone": "138****8888",
            "nickname": "用户8888"
        }
    }
}
```

**成功响应（未登录）：**

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "hasAccess": false,
        "needsLogin": true,
        "needsPurchase": false,
        "testTypeId": "tarot",
        "userId": null,
        "userInfo": null
    }
}
```

**错误响应：**

| HTTP 状态码 | 错误码            | 说明             |
| ----------- | ----------------- | ---------------- |
| 400         | MISSING_TEST_TYPE | 缺少测试类型参数 |

---

### 2.2 更新用户资料

**PUT** `/api/user/profile`

更新当前登录用户的个人资料。

**请求头：**

```
Authorization: Bearer <token>
```

**请求参数：**

| 参数      | 类型   | 必填 | 说明                   |
| --------- | ------ | ---- | ---------------------- |
| nickname  | string | ❌   | 昵称（最长20个字符）   |
| avatar    | string | ❌   | 头像 URL               |
| gender    | string | ❌   | 性别                   |
| birthDate | string | ❌   | 出生日期               |

**成功响应：**

```json
{
    "success": true,
    "message": "资料更新成功",
    "data": {
        "id": "uuid-string",
        "nickname": "新昵称",
        "avatar": "https://example.com/avatar.png",
        "gender": "male",
        "birthDate": "1990-01-01"
    }
}
```

**错误响应：**

| HTTP 状态码 | 错误码           | 说明                 |
| ----------- | ---------------- | -------------------- |
| 400         | NICKNAME_TOO_LONG | 昵称超过20个字符    |
| 401         | AUTH_REQUIRED    | 未提供认证 Token     |
| 404         | USER_NOT_FOUND   | 用户不存在           |

---

### 2.3 获取邀请信息

**GET** `/api/user/invite`

获取当前用户的邀请码及邀请统计信息。

**请求头：**

```
Authorization: Bearer <token>
```

**请求参数：** 无

**成功响应：**

```json
{
    "success": true,
    "data": {
        "inviteCode": "A3B5K9",
        "inviteCount": 3,
        "inviteReward": 3,
        "inviteLink": "http://localhost:5173?invite=A3B5K9"
    }
}
```

| 字段         | 说明                          |
| ------------ | ----------------------------- |
| inviteCode   | 用户的邀请码                  |
| inviteCount  | 已成功邀请人数                |
| inviteReward | 通过邀请获得的免费测试次数    |
| inviteLink   | 邀请链接                      |

---

### 2.4 使用邀请码

**POST** `/api/user/invite/apply`

当前用户使用他人的邀请码，双方各获得 1 次免费测试。

**请求头：**

```
Authorization: Bearer <token>
```

**请求参数：**

| 参数       | 类型   | 必填 | 说明           |
| ---------- | ------ | ---- | -------------- |
| inviteCode | string | ✅   | 邀请码（6位）  |

**成功响应：**

```json
{
    "success": true,
    "message": "邀请码使用成功，你和邀请人各获得1次免费测试"
}
```

**错误响应：**

| HTTP 状态码 | 错误码              | 说明               |
| ----------- | ------------------- | ------------------ |
| 400         | MISSING_INVITE_CODE | 缺少邀请码         |
| 400         | ALREADY_INVITED     | 已使用过邀请码     |
| 400         | INVALID_INVITE_CODE | 邀请码无效         |
| 400         | SELF_INVITE         | 不能使用自己的邀请码 |
| 401         | AUTH_REQUIRED       | 未提供认证 Token   |
| 404         | USER_NOT_FOUND      | 用户不存在         |

---

### 2.5 获取积分/免费次数

**GET** `/api/user/credits`

获取当前用户的积分和测试次数。

**请求头：**

```
Authorization: Bearer <token>
```

**请求参数：** 无

**成功响应：**

```json
{
    "success": true,
    "data": {
        "credits": 2,
        "testCount": 5
    }
}
```

| 字段      | 说明               |
| --------- | ------------------ |
| credits   | 剩余免费测试次数   |
| testCount | 累计测试次数       |

---

## 3. 通用说明

### 3.1 认证方式

需要认证的接口需在请求头中携带 JWT Token：

```
Authorization: Bearer <token>
```

Token 有效期：
- 默认：**7 天**
- 勾选「记住我」登录时：**30 天**

### 3.2 通用错误格式

所有接口的错误响应统一格式：

```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "错误描述"
    }
}
```

### 3.3 验证码规则

| 规则         | 说明                           |
| ------------ | ------------------------------ |
| 有效期       | 5 分钟                         |
| 长度         | 6 位数字                       |
| 错误次数限制 | 同一验证码最多尝试 5 次        |
| 使用限制     | 每个验证码只能使用 1 次        |
| 发送频率     | 同一手机号 60 秒内最多发 1 次  |
| 每日上限     | 同一手机号每天最多发 5 次      |

### 3.4 手机号格式

- 必须为 11 位
- 必须以 1 开头，第二位为 3-9
- 正则：`/^1[3-9]\d{9}$/`

### 3.5 开发环境说明

- 开发环境（`NODE_ENV !== 'production'`）下，`send-sms` 和 `send-code` 接口会在响应中返回验证码 `code` 字段，便于测试
- 生产环境下不会返回该字段，需接入真实短信服务商
