# GameServer API 文档

### 新增分数记录
- **URL**: `/rankings`
- **Method**: POST
- **描述**: 新增玩家分数记录。
- **请求体**:
```json
{
  "player_name": "张三",
  "score": 1000
}
```
- **响应示例**:
```json
{
  "id": 1,
  "player_name": "张三",
  "score": 1000,
  "create_time": "2025-08-24 12:00:00",
  "ip": "127.0.0.1",
  "browser": "Mozilla/5.0 ..."
}
```

### 新增访问记录
- **URL**: `/game_start_logs`
- **Method**: POST
- **描述**: 新增一条游戏开始访问记录。
- **请求体**:
```json
{}
```
- **响应示例**:
```json
{
  "id": 1,
  "ip": "127.0.0.1",
  "browser": "Mozilla/5.0 ...",
  "start_time": "2025-08-24 12:00:00"
}
```

### 修改访问记录
- **URL**: `/game_start_logs/<log_id>`
- **Method**: PUT
- **描述**: 修改指定访问记录。
- **请求体**:
```json
{
  "ip": "127.0.0.1",
  "browser": "Chrome/120.0"
}
```
- **响应示例**:
```json
{
  "id": 1,
  "ip": "127.0.0.1",
  "browser": "Chrome/120.0",
  "start_time": "2025-08-24 12:00:00"
}
```

### 删除访问记录
- **URL**: `/game_start_logs/<log_id>`
- **Method**: DELETE
- **描述**: 删除指定访问记录。
- **响应示例**:
```json
{
  "result": "success"
}
```
  "player_name": "张三",
  "ip": "127.0.0.1",
  "browser": "Mozilla/5.0 ...",
  "start_time": "2025-08-24 12:00:00"
}
```

### 修改访问记录
- **URL**: `/game_start_logs/<log_id>`
- **Method**: PUT
- **描述**: 修改指定访问记录。
- **请求体**:
```json
{
  "player_name": "李四",
  "ip": "127.0.0.1",
  "browser": "Chrome/120.0"
}
```
- **响应示例**:
```json
{
  "id": 1,
  "player_name": "李四",
  "ip": "192.168.1.1",
  "browser": "Chrome/120.0",
  "start_time": "2025-08-24 12:00:00"
}
```

### 删除访问记录
- **URL**: `/game_start_logs/<log_id>`
- **Method**: DELETE
- **描述**: 删除指定访问记录。
- **响应示例**:
```json
{
  "result": "success"
}
```
