# AI Logo生成器

这是一个基于OpenAI API的智能Logo生成器，可以根据用户输入的插件名称和描述自动生成相应的Logo图片。

## 项目功能

- 用户可以输入插件名称和描述
- 系统自动调用OpenAI的图像生成API
- 实时展示生成的Logo图片
- 支持响应式设计，适配各种设备
- 支持手动上传Logo图片
- 提供图片预览和下载功能

## 本地开发

### 环境要求
- Node.js 14.0.0 或更高版本
- npm 或 yarn包管理器

### 安装步骤

1. 克隆项目到本地
```bash
git clone [项目地址]
cd icon
```

2. 安装依赖
```bash
npm install
# 或
yarn install
```

3. 配置环境变量
在项目根目录创建`.env`文件，添加以下配置：
```
# OpenAI API配置
OPENAI_API_KEY=你的OpenAI API密钥    # OpenAI API密钥，用于调用AI图像生成服务
OPENAI_API_BASE=https://api.openai.com/v1  # OpenAI API基础URL，可选，默认为官方API地址

# 服务器配置
PORT=3000    # 服务器端口号，可选，默认为3000
HOST=0.0.0.0 # 服务器主机地址，可选，默认为0.0.0.0

# 安全配置
CORS_ORIGIN=* # CORS配置，可选，默认允许所有来源
```

环境变量说明：
- `OPENAI_API_KEY`：必填，用于访问OpenAI的API服务
  - 获取方式：在OpenAI官网注册账号并创建API密钥
  - 注意：请妥善保管密钥，不要泄露或提交到代码仓库

- `OPENAI_API_BASE`：可选，用于配置自定义的API代理地址
  - 默认值：https://api.openai.com/v1
  - 使用场景：在某些地区可能需要通过代理访问OpenAI API

- `PORT`：可选，指定服务器监听的端口号
  - 默认值：3000
  - 注意：确保指定的端口未被其他服务占用

- `HOST`：可选，指定服务器监听的地址
  - 默认值：0.0.0.0（允许所有网络接口访问）
  - 建议：本地开发时可设置为localhost

- `CORS_ORIGIN`：可选，配置跨域资源共享
  - 默认值：*（允许所有域名访问）
  - 生产环境建议设置为具体的域名列表

注意事项：
1. 本地开发时，将以上配置保存在项目根目录的`.env`文件中
2. 确保`.env`文件已添加到`.gitignore`中，避免敏感信息泄露
3. Vercel部署时，在项目设置的Environment Variables中配置相应的环境变量
4. 修改环境变量后需要重启服务器才能生效

4. 启动开发服务器
```bash
npm start
# 或
yarn start
```

5. 访问本地服务
打开浏览器访问 `http://localhost:3000`

## Vercel部署

1. Fork本项目到你的GitHub账号

2. 在Vercel中导入项目
   - 登录Vercel账号
   - 点击「New Project」
   - 选择已fork的项目仓库
   - 点击「Import」

3. 配置项目设置
   - 在「Build and Development Settings」中：
     - Framework Preset：选择「Other」
     - Build Command：设置为 `npm run build`
     - Output Directory：设置为 `dist`
     - Install Command：设置为 `npm install`

4. 配置环境变量
   - 在项目设置中找到「Environment Variables」
   - 添加以下环境变量：
     - `OPENAI_API_KEY`：你的OpenAI API密钥
     - `NODE_VERSION`：设置为 `14.x` 或更高版本

5. 部署项目
   - 点击「Deploy」开始部署
   - 等待部署完成后，Vercel会提供一个可访问的URL

6. 部署注意事项
   - 确保package.json中包含正确的构建和启动脚本
   - 检查vercel.json配置是否正确
   - 部署失败时查看构建日志排查问题
   - 定期检查环境变量是否过期

## 项目结构

```
├── index.html          # 前端页面
├── styles.css          # 样式文件
├── server.js           # Node.js后端服务
└── package.json        # 项目依赖配置
```

## 页面布局

### 主页面 (index.html)
- 顶部标题区域
- 中间输入表单区域
  - 插件名称输入框
  - 插件描述输入框
  - 生成按钮
- Logo展示区域
  - 加载动画
  - 生成的Logo图片
- 底部信息区域

## 技术实现

### 前端
- 使用HTML5语义化标签构建页面结构
- 使用CSS Flexbox实现响应式布局
- 添加适当的动画效果提升用户体验

### 后端
- 使用Node.js创建简单的HTTP服务器
- 处理跨域请求(CORS)
- 转发API请求到OpenAI服务
- 设置60秒超时处理

## 开发规范
- 代码添加详细的中文注释
- 遵循W3C标准
- 确保跨浏览器兼容性
- 优化资源加载性能

## 注意事项

1. 请确保你的OpenAI API密钥有足够的额度
2. 本地开发时请勿将`.env`文件提交到代码仓库
3. 部署时请确保环境变量配置正确