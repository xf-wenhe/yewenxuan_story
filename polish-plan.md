# 前三卷深度润色执行计划

基于新安装的 4 个技能（story-deslop / story-review / story-import / Humanizer-zh）+ 仓库既有 de-AI 规则，对 V1-V3（400 章，约 158 万 CJK 字）执行分层润色。

## 现状基线（2026-08-14 已完成）

- 机械问题已批量修复：韩冰/何冰 人名统一（V3 全量 1987 处）、`。，`→`。`（52 章）、7 处结尾标记错号、13 章补结尾标记、9 处标题错乱（ch198-207）、2 章补标题（ch193/197）、ch229 补标题与标记、ch69 清除作者工作笔记、ch61 删重复行。
- 剩余待处理（详见下方优先级）：风格层问题、字数不足章节、退化复读段落。

## 工具链与用法

| 工具 | 用途 | 调用方式 |
|------|------|----------|
| story-deslop | 去AI味主流程（三遍法：检测→改写→回归） | `/story-deslop` 或「去AI味」+ 文件 |
| story-deslop/scripts/check-degeneration.js | 扫描复读打转、元信息泄漏 | `node .claude/skills/story-deslop/scripts/check-degeneration.js <章.md>` |
| story-deslop/scripts/check-ai-patterns.js | 扫描 AI 惯用句式/禁用词 | 同上（check-ai-patterns.js） |
| story-deslop/scripts/normalize-punctuation.js | 标点规范化 | 同上 |
| story-review | 多视角对抗式审查（full/lean） | `/story-review` |
| Humanizer-zh | 29 种 AI 痕迹检测与改写（防检测加固） | `/Humanizer-zh` |
| story-import | 将 400 章反向导入标准工作流（为 V4+ 写作铺路） | `/story-import` |

另：仓库自带 `tools/polish_pipeline.py`（禁用词替换 + 段落密度 + 标点），跑完需人工复核句意。

## 执行阶段

### Phase 1 — 机器扫描定级（无人工，可批量）
对 400 章跑 check-degeneration.js + check-ai-patterns.js + normalize-punctuation.js，输出每章 blocking/advisory 计数与严重章节清单（已运行，结果在 `.claude/style-scan-result.json`）。
**验收：** 得到按严重度排序的重灾清单（预计 V3 最重）。

### Phase 2 — 风格层修复（每批 20-30 章，人工+AI 逐章）
按重灾优先，每章走 story-deslop 三遍法：
1. **Pass A 复读修复**：verbatim-repeat / 打转段落（同句 3 次+）删至一处，改写为推进剧情的新内容；优先级最高——这是最典型的"AI 味"暴露。
2. **Pass B 禁用词与句式**：仓库 L1_WORDS + DEADLY_PATTERNS + story-deslop banned-words.md + anti-ai-writing.md 交叉执行；V1 的 `**粗体**`/代码块系统界面统一为 repo 排版规范。
3. **Pass C 文风节奏**：V3 的短句堆叠式复读（"线在自行运转。线在自行循环。"）与 V1 的长句文学化风格对齐；句式长短交错，消除模板感。
4. **Pass D 检测加固**：Humanizer-zh 对每批抽查 20%，确认 29 类痕迹清零。

**验收：** 抽查章节二次扫描 blocking=0；与原文 diff 记录在案。

### Phase 3 — 字数与完整性
- ch229（1695 字）、ch324/325/327/328/329（1900-2600 字）补足至 ≥3000 CJK；ch229 同时是退化重灾章，需重写扩写。
- 全库重跑字数校验，低于 3000 的章节清零。

### Phase 4 — 内容一致性（与修复并行推进）
- 碎片编号：0428/0429/0415 归属与使用频率全库核对（ch251 曾出现"何冰的0429碎片"表述，人名修复后需复查归属是否与设定一致）。
- 伏笔表：`plot-threads.md` 与已写 400 章交叉核对（ch69 的 VXXX 已确认登记过 43 段螺旋锚点设定）。
- 标题复核：ch193「漩涡中心」/ ch197「暗红之光」/ ch229「灰色空间」为生成标题，润色时与内容核对修订。

### Phase 5 — 抽检与回归
- `/story-review` 对每卷抽 5-10 章多视角审查（连贯性/人物一致性/节奏）。
- 全库重跑全部脚本，出最终报告。
- 提交节奏：每阶段一个 commit（参考现有提交习惯）。

## 建议执行顺序

1. Phase 1 扫描（今日已启动）
2. Phase 2 按 V3 → V2 → V1 顺序（V3 重灾最多，先出效果）
3. Phase 3 与 Phase 2 穿插（短章并入所在批处理）
4. Phase 4 作为后台核对任务并行
5. Phase 5 收尾回归

## 已搁置/需用户决策项

- `（第X章完）` 标记被 check-degeneration.js 标为 meta-leak（advisory）：本项目沿用网文平台惯例，建议保留，在脚本结果中忽略此类。
- V1 的系统界面粗体/代码块排版：统一保留或改纯文本，需用户定调。
- 是否引入 story-import 的标准目录结构（可能改变 chapters/ 布局），需用户定夺。
