# NocoDB 集成指南

## 简介

本项目已集成NocoDB数据库功能，用于记录Logo生成的历史信息。每次生成或上传Logo时，系统会自动将相关信息记录到NocoDB中，方便后续查看和分析。

## 配置步骤

### 1. 创建NocoDB表

在NocoDB中创建一个名为`logo_generations`的表，包含以下字段：

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | Auto Number | 自动生成的ID |
| plugin_name | Single Line Text | 插件名称 |
| plugin_desc | Long Text | 插件描述 |
| prompt | Long Text | 生成提示词 |
| original_url | Long Text | 原始图片URL |
| created_at | DateTime | 创建时间 |
| status | Single Select | 状态(success/error/upload) |
| error_message | Long Text | 错误信息(如有) |

### 2. 配置环境变量

在项目的`.env`文件中添加以下配置：

```
# NocoDB配置
NOCODB_URL=your_nocodb_url_here
NOCODB_TOKEN=your_nocodb_token_here
NOCODB_TABLE_ID=your_table_id_here
NOCODB_VIEW_ID=your_view_id_here
```

- `NOCODB_URL`: NocoDB实例的URL，例如`https://your-nocodb-instance.com`
- `NOCODB_TOKEN`: NocoDB的API令牌，可在NocoDB管理界面中生成（使用xc-token认证）
- `NOCODB_TABLE_ID`: 表ID，可在NocoDB表URL中找到，例如`m0y2omxxc3z5qfe`
- `NOCODB_VIEW_ID`: 视图ID，可在NocoDB视图URL中找到，例如`vwxfh1l65dx8g6g5`（可选）

### 3. 部署到Vercel

如果您使用Vercel部署，请在Vercel项目设置中添加上述环境变量。

## 功能说明

系统会在以下情况下记录信息到NocoDB：

1. 成功生成Logo时
2. 用户上传Logo时
3. 生成Logo失败时

## 注意事项

- NocoDB配置是可选的，如果未配置，系统将跳过记录功能，不影响主要功能的使用
- 记录失败不会影响主流程，系统会继续处理Logo生成/上传请求
