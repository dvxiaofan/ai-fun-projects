# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI 创意小工具/小游戏合集。每个子目录是一个独立的纯前端项目，浏览器打开 `index.html` 即可运行。

## 项目结构约定

```
<project-name>/
├── index.html        # 入口页面
├── css/
│   └── style.css     # 样式
└── js/
    └── game.js       # 逻辑（或 main.js / app.js）
```

较复杂的项目可用 Vite + TypeScript，结构为：
```
<project-name>/
├── index.html
├── package.json
├── src/
│   ├── main.ts
│   └── ...
└── vite.config.ts
```

## 技术栈

- 默认：原生 HTML + CSS + JavaScript（零依赖）
- Canvas 类项目：Canvas 2D API
- 音频类项目：Web Audio API
- 复杂项目：Vite + TypeScript

## 开发原则

- 每个项目 30 分钟内能跑起来
- 打开 HTML 即可玩，不依赖外部服务
- 代码结构清晰，方便魔改
- 每个项目自包含，不共享代码

## 常用命令

```bash
# 浏览器打开（macOS）
open <project>/index.html

# 本地开发服务（需要时）
cd <project> && python3 -m http.server 8080

# Vite 项目
cd <project> && npm install && npm run dev
```

## 新建项目步骤

1. 创建子目录，按上述结构放好文件
2. 确保 `index.html` 可直接打开运行
3. 更新根目录 `README.md` 的项目列表
