# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 项目性质

这不是软件项目，而是一部中文超长篇网络小说的创作仓库（无限流 × 时间闭环题材，暂名《闭环之外》/《无限回廊》）。没有构建、测试、Lint 流程；仓库里唯一的代码是 `tools/polish_pipeline.py`（文本清理脚本）。所有"开发工作"= 写章节、改大纲、维护伏笔表。

**规模：** 目标 1000 章 / 约 300 万字（CJK 计数）。当前进度（2026-08-18 核实）：V1(1-100)、V2(101-250)、V3(251-400)、V4(401-550)、V5(551-750) 均已完成；V6(回廊) 正文 168 章已存在并**编号对齐为连续 751-918**（详见 memory `v6-progress.md`）。V7(闭环,901-1000) 正文未写。全库 0 章低于 3000 CJK。

# 文档层级（写作时的"架构"）

写任何章节前按此顺序查档，越靠前优先级越高：

1. **`chapters/volume-N/outline-volume-N*.md`** — 逐章详细大纲（每章的核心事件、关键场景、人物弧线、结尾钩子、衔接上一卷）。这是当前正在写的卷的直接依据。
2. **`plot-threads.md`** — 伏笔追踪表（约 227 条，编号 V001+）。每条含：埋设章节、应回收章节、当前状态、回收内容。**写作时逐条检查**：该章的伏笔是否植入、该回收的是否已安排回收；新增伏笔必须登记入表。
3. **`characters/`** — 人物档案。`protagonist.md`（叶文轩）、`sidekick.md`（赵大嘴）、`npc-roster.md`、`npc-deep-dive.md`、`sidekick-deep-dive.md`。档案含"隐藏设定"栏（读者不可知的真相，如林渊的真实身份、赵大嘴的拖油瓶伪装）。
4. **`worldbuilding/`** — 世界观规则。`system-rules.md`（区域 A/B/C 结构、副本池、碎片系统）、`dungeon-rules.md`（核心副本的机制设计）、`lore/closed-loop.md`（时间闭环设定 + 逐步揭示计划）。
5. **`outline-master.md`** — 七卷总纲：各卷段落划分、关键情节点（精确到章号）、卷末钩子、三结局方案。章节数量大改或跨越卷际的情节必须与之对齐。

# 剧透纪律（最重要）

设定文档里写着全书真相，但读者在章节中只能看到角色当时能感知的部分。`system-rules.md` 开头有明确警告：**只描写玩家能感知到的表层体验，不要提前暴露系统内部运作**。伏笔的揭示节奏由 `plot-threads.md` 的"应回收章节"和 `lore/closed-loop.md` 的"逐步揭示计划"决定，不可提前。人物档案里的"隐藏设定"（如赵大嘴并非真蠢、林渊是未来叶文轩的防火墙人格）绝不能直接写进早期章节。

# 章节写作规范

- **文件名：** `chapters/volume-N/chapter-NNN-polished.md`（三位补零）。
- **标题格式：** 首行 `# 第X章：标题`（汉字数字）。
- **字数：** 单章 ≥3000 CJK 字符（历史平均约 3700–4100）；以 CJK 计数为准，不是 Markdown 总字数。
- **结尾标记：** `（第X章完）`；卷末加 `——第X卷·卷名·完——`。
- **POV：** 全程第三人称有限视角，跟随叶文轩。
- **文风硬约束（de-AI 规则）：** 禁用词包括 仿佛/犹如/宛若/如同、深吸一口气/缓缓/不禁/微微/轻轻/淡淡、眼中闪过/嘴角勾起/眉头微皱/心中暗道、不容置疑/显而易见/毫无疑问、坚定/深邃/凛冽/冰冷、不由自主/情不自禁；致命句式包括"不是A而是B"、"他知道……"、"眼中闪过一丝……"、"心中涌起一股……"、"脑中闪过……"。完整清单见 `tools/polish_pipeline.py` 顶部的 `L1_WORDS` 与 `DEADLY_PATTERNS`。
- **标点：** 全角中文标点；对话用直引号 `"…"`；正文避免机械排版（如孤立的 `**强调**` 短行、段落密度过低——连续 3 个不足 30 字的单句段需合并）。

# 工具

**已安装的项目级技能（`.claude/skills/`，2026-08-14 自 GitHub 安装）：**

| 技能 | 用途 | 来源 |
|------|------|------|
| `story-deslop` | 网文去AI味主流程（三遍法），附 `scripts/check-degeneration.js`（复读/打转扫描）、`scripts/check-ai-patterns.js`（AI句式扫描）、`scripts/normalize-punctuation.js` | [worldwonderer/oh-story-claudecode](https://github.com/worldwonderer/oh-story-claudecode) |
| `story-review` | 多视角对抗式审查（full/lean），含番茄/起点/知乎质量 rubric | 同上 |
| `story-import` | 将已有小说反向导入标准写作工作流 | 同上 |
| `Humanizer-zh` | 29 种 AI 写作痕迹检测与改写（维基 Signs of AI writing v2.5.1） | [Show-Chan97/Humanizer-zh](https://github.com/Show-Chan97/Humanizer-zh) |

用法：`/story-deslop`、`/story-review`、`/story-import`、`/Humanizer-zh` 触发；检测脚本可单独运行。完整润色流程见 `polish-plan.md`。

**`tools/polish_pipeline.py`** — 单章自动清理流水线（de-AI 去禁用词/致命句式 → 机械排版清理 → 段落密度合并 → 对话格式 → 标点清理 → 字数校验）：

```bash
python tools/polish_pipeline.py chapters/volume-3/chapter-300-polished.md   # 处理单章
python tools/polish_pipeline.py --all                                        # ⚠️ 见下方警告
```

> ⚠️ 脚本顶部的 `CHAPTERS_DIR` 硬编码为 Mac 路径 `/Volumes/新/work/story/story-project/chapters/volume-1`，在本仓库（Windows）上 `--all` 无法工作；该目录名也与实际仓库名不符。使用前需先修改此常量。脚本以 `encoding='utf-8'` 读写，与全库一致。

注意：脚本的机械替换是粗粒度文本处理（如 `pass_validate` 在字数不足时向（本章完）后插入固定句式），跑完仍需人工复核句意。

# 一致性要求

- **命名以档案为准：** 人物/副本/系统术语（碎片编号 0428/0429/0415、洞察者、区域 A/B/C 等）一律以 `characters/` 与 `worldbuilding/` 文档为准。发现正文与档案不一致（如人名写法差异）应修正正文或至少提出核对，不要自行发明新名称。
- **编码：** 全库文件为 UTF-8 无 BOM。修改任何文件必须保持原编码与 BOM 状态不变。

# 提交习惯

按里程碑批量提交（一卷完成 / 一批批量清理），提交信息用英文概括动作与范围，例如：

```
Volume 3 complete: Ch.251-400 (~112,000 CJK). V1-V3 all done.
Batch de-AI fix: 60 chapters, 151+/215-
V4 outline deep polish: Ch.401-550, fixed V3 continuity + info-dump pacing
```
