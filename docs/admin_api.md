# 后台管理系统 API 文档

## 概述

本文档描述了匹配游戏后台管理系统的API接口。所有API都遵循RESTful设计原则，返回JSON格式的响应。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: JWT Token (在请求头中传递 `Authorization: Bearer <token>`)
- **响应格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

- `code`: 状态码，200表示成功
- `message`: 响应消息
- `data`: 响应数据

## API 接口列表

### 1. 健康检查

**接口**: `GET /health`

**描述**: 检查服务器健康状态

**请求参数**: 无

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T10:31:47.623Z",
  "version": "1.0.0"
}
```

### 2. 管理员登录

**接口**: `POST /admin/login`

**描述**: 管理员登录获取访问令牌

**请求参数**:
```json
{
  "username": "admin",
  "password": "123456"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "test-token",
    "admin": {
      "id": 1,
      "username": "admin",
      "is_super_admin": 1
    }
  }
}
```

### 3. 获取管理员信息

**接口**: `GET /admin/profile`

**描述**: 获取当前登录管理员的详细信息

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "phone": "13800138000",
    "is_super_admin": 1,
    "roles": [
      {
        "id": 1,
        "code": "super_admin",
        "name": "超级管理员"
      }
    ],
    "permissions": [
      {
        "id": 1,
        "code": "system:all",
        "name": "所有权限",
        "type": "menu"
      }
    ]
  }
}
```

### 4. 获取菜单数据

**接口**: `GET /admin/menu`

**描述**: 获取管理员的菜单权限数据

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "code": "dashboard",
      "name": "仪表盘",
      "type": "menu",
      "route_path": "/dashboard",
      "component_path": "dashboard.html",
      "icon": "📊",
      "children": []
    },
    {
      "id": 2,
      "code": "system",
      "name": "系统管理",
      "type": "menu",
      "route_path": "/system",
      "component_path": "system.html",
      "icon": "⚙️",
      "children": [
        {
          "id": 3,
          "code": "system:admin",
          "name": "管理员管理",
          "type": "menu",
          "route_path": "/system/admin-users",
          "component_path": "admin-users.html",
          "icon": "👥",
          "children": []
        },
        {
          "id": 4,
          "code": "system:role",
          "name": "角色管理",
          "type": "menu",
          "route_path": "/system/roles",
          "component_path": "roles.html",
          "icon": "🏷️",
          "children": []
        },
        {
          "id": 5,
          "code": "system:permission",
          "name": "权限管理",
          "type": "menu",
          "route_path": "/system/permissions",
          "component_path": "permissions.html",
          "icon": "🔐",
          "children": []
        }
      ]
    },
    {
      "id": 6,
      "code": "system:log",
      "name": "操作日志",
      "type": "menu",
      "route_path": "/logs",
      "component_path": "logs.html",
      "icon": "📝",
      "children": []
    }
  ]
}
```

### 5. 获取管理员列表

**接口**: `GET /admin/admins`

**描述**: 获取管理员列表（分页）

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `status`: 状态筛选

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "phone": "13800138000",
        "status": 1,
        "is_super_admin": 1,
        "created_at": "2024-01-01 00:00:00",
        "roles": [
          {
            "id": 1,
            "name": "超级管理员"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
}
```

### 6. 获取角色列表

**接口**: `GET /admin/roles`

**描述**: 获取系统角色列表

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "code": "super_admin",
      "name": "超级管理员",
      "description": "拥有所有权限",
      "data_scope": "all",
      "created_at": "2024-01-01 00:00:00",
      "permissions": [
        {
          "id": 1,
          "name": "所有权限"
        }
      ]
    }
  ]
}
```

### 7. 获取权限列表

**接口**: `GET /admin/permissions`

**描述**: 获取系统权限列表

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "code": "system:all",
        "name": "所有权限",
        "type": "menu",
        "parent_id": null,
        "route_path": "/",
        "component_path": "index.html",
        "icon": "⚙️",
        "is_visible": 1,
        "sort_order": 1
      }
    ],
    "tree": [
      {
        "id": 1,
        "code": "system",
        "name": "系统管理",
        "type": "menu",
        "children": [
          {
            "id": 2,
            "code": "system:admin",
            "name": "管理员管理",
            "type": "menu"
          }
        ]
      }
    ]
  }
}
```

## 错误响应

当API调用失败时，返回的响应格式如下：

```json
{
  "code": 400,
  "message": "错误信息描述"
}
```

常见错误码：
- `400`: 请求参数错误
- `401`: 未授权访问
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 注意事项

1. 所有需要认证的接口都必须在请求头中包含有效的JWT token
2. 密码在传输过程中应该使用HTTPS加密
3. API响应中的时间戳格式为ISO 8601标准
4. 分页接口支持 `page` 和 `limit` 参数进行分页查询