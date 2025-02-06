# Zotero Metadata Scraper

一个用于自动从多个学术来源获取和更新文献元数据的 Zotero 插件。

## 功能特性

- 从多个来源获取元数据：
  - [DBLP](https://dblp.org/)
  - [Semantic Scholar](https://www.semanticscholar.org/)
  - ...
- 自动更新出版物元数据
- 多语言支持（英文、中文）

## 安装

1. 从[发布页面](https://github.com/creling/zotero-metadata-scraper/releases)下载最新版本（.xpi 文件）
2. 在 Zotero 中：
   - 打开工具 → 附加组件
   - 点击齿轮图标并选择"从文件安装附加组件..."
   - 选择下载的 .xpi 文件

## 使用方法

1. 在 Zotero 库中选择一个条目
2. 右键点击并从上下文菜单中选择"获取元数据"
3. 插件将搜索匹配的出版物
4. 如果找到多个匹配项，从搜索结果对话框中选择正确的条目
5. 条目的元数据将自动更新

## 配置

### Semantic Scholar API 密钥（可选）

要增加 Semantic Scholar 的 API 访问限制：

1. 打开工具 → 元数据抓取器设置
2. 输入您的 Semantic Scholar API 密钥
3. 点击确定保存

## 开发

### 前置要求

- Node.js
- npm

### 设置

1. 克隆仓库：

```bash
git clone https://github.com/creling/zotero-metadata-scraper.git
cd zotero-metadata-scraper
```

2. 安装依赖：

```bash
npm install
```

### 构建

- 开发构建（支持热重载）：

```bash
npm run start
```

- 生产构建：

```bash
npm run build
```

### 代码格式化

```bash
npm run lint:check  # 检查代码风格
npm run lint:fix    # 修复代码风格
```

## 许可证

[AGPL-3.0](LICENSE) © creling

## 支持

- 在 [GitHub](https://github.com/creling/zotero-metadata-scraper/issues) 上报告问题
<!-- - 查看[文档](doc/)了解更多详情 -->
