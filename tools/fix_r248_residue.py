# -*- coding: utf-8 -*-
"""R248 — 族 C 余量：词池模板焊出的碎片（`。的眼睛` / `朵朵朵朵` / 叠字 / 焊接）

背景
    V1-V5 的几轮「voice cleanup / de-AI」不是逐词换，而是把**模板**填进原文，
    模板自己带 bug，于是正文留下读者可见的碎片。本轮收口四类：

    ① `。<名词>` 焊在人物名后面（池模板 = `看向X` -> `[池动词]X。的眼睛。`）
       父提交（ch739，2d1194e5^）: 0429。叶文轩看向赵大嘴的胸口，传输之后…
       池输出（2d1194e5）        : 0429。叶文轩转头望向赵大嘴。的眼睛。的胸口，传输之后…
       —— 模板把 `。的眼睛。` 插在名字后面，原文的 `的胸口，` 留在原地，证明这
       5 个字是纯插入物。修法 = **删掉它**；句尾保留一个句号，只有 ch92/ch739 的
       插入物后面直接跟 `的X`（原文继续），才把 5 个字全删。

    ② 同一模板的动词变体：`将视线移向X` 被后面的轮次按「单字换多字」改写成
       `将眼光转去向X`（= 移 -> 转去，后面原本那个 `向` 还留着）、`将眼望过去向X`、
       `将眼光转向向X`、`将眼投去向X`、`将目光转走向X`、`将视线未移向X`。
       修法 = 删掉多出来的那 1-2 个字，动词回到合法形（转去向->转向、望过去向->望向、
       转向向->转向、投去向->投向、转走向->转向、未移向->移向、未动向->移向）。

    ③ 句间标点被吃掉的复字（`朵朵朵朵`、ch441/ch457 的 `他他`）：本应是 `X，X`。

    ④ 池句子串自己带 typo（`他他吞了吞口水`、`他眼瞳`、`他清了清喉咙`），以及
       R214/R246 与本族的残渣同处一地（ch561 `稍抖动抖`、ch495 `他的他眼底面`、
       ch251/ch577 的 `清了清喉咙了一下` / `清了清喉滚了一下`）。

    取证（--audit 逐个复核，本书 .claude/tmp/r248_g1.py / r248_g6.py / r248_hard.py）
        `。的眼` 45 处：最短不变量 `。的眼` 的最老 toucher 全库都是 2d1194e5
        （R26-R28 voice cleanup，6,849 处替换）；表里的 src 记的是**当前这句被写坏的
        那一轮**（动词被后续轮次改过的记后续轮，如 ch71 记 9cd5e651、ch580 记 e379bcf2）。
        `朵朵朵朵`/`他他`：BEFORE/AFTER 对（ch617 `他看着朵朵，朵朵扎着两个小辫子`
        -> `他看着朵朵朵朵扎着两个小辫子`；ch441 `余温告诉他，他能听到` ->
        `余温告诉他他能听到`）证明被吃的是标点。
        ch28 的 `他他` 已在根提交 500f669b 里（pre-git 阶段损坏），按语法修。

修法边界
    不回填父提交的旧句：这些轮次**有意**换掉了原词（`看向`->`转头望向`、`移向`->`转去向`、
    `咽了口唾沫`->`他吞了吞口水`、`喉咙动了一下`->`他清了清喉咙`），回填等于撤销它们。
    只做「删掉多出来的字 / 补回被吃的标点」，池子的用词（含 `清了清喉间`、`清了清喉`
    这类它自己的写法）一律不动。

用法
    python tools/fix_r248_residue.py            # 干跑
    python tools/fix_r248_residue.py --audit    # 只验证据链
    python tools/fix_r248_residue.py --apply    # 落盘（可重跑）
    python tools/fix_r248_residue.py --verify   # 从 git show HEAD 的字节重放比对
    可选第二参数是章号子串，只看/只改匹配的章。
    一个文件的多处编辑在同一份文本上依次落下（R247 教训①），重跑时已修站点跳过。

编码
    UTF-8 无 BOM；行尾按每个文件自身的终止符切分与还原，MIXED-EOL 直接拒绝。工作区 CRLF、
    blob LF（.gitattributes `* text=auto eol=lf`）属既有状态，--verify 比行内容与结尾换行，
    不比行尾字节（R246 教训②）。
"""
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

BOM = b'\xef\xbb\xbf'

# (path, 写坏当前这句的那一轮, anchor, 修完的 anchor)
SITES = [
    ('chapters/volume-1/chapter-01-polished.md', 'c63eff22',
     '是是',
     '是'),
    ('chapters/volume-1/chapter-01-polished.md', 'f89585d3',
     '他他吞了吞口水。',
     '他吞了吞口水。'),
    ('chapters/volume-1/chapter-60-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-1/chapter-71-polished.md', '9cd5e651',
     '将眼光转去向赵大嘴。的眼睛。',
     '将眼光转向赵大嘴。'),
    ('chapters/volume-1/chapter-77-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-1/chapter-79-polished.md', '9cd5e651',
     '将眼光转向向赵大嘴。的眼睛。',
     '将眼光转向赵大嘴。'),
    ('chapters/volume-1/chapter-82-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-1/chapter-84-polished.md', '9cd5e651',
     '将眼投去向赵大嘴。的眼睛。',
     '将眼投向赵大嘴。'),
    ('chapters/volume-1/chapter-86-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-1/chapter-88-polished.md', '9cd5e651',
     '将视线转去向赵大嘴。的眼睛。',
     '将视线转向赵大嘴。'),
    ('chapters/volume-1/chapter-90-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-1/chapter-91-polished.md', '9cd5e651',
     '将眼光移去向赵大嘴。的眼睛。',
     '将眼光移向赵大嘴。'),
    ('chapters/volume-1/chapter-91-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-1/chapter-92-polished.md', '2700db59',
     '将视线固定向赵大嘴。的眼睛。的手臂。',
     '将视线固定在赵大嘴的手臂上。'),
    ('chapters/volume-1/chapter-92-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-1/chapter-93-polished.md', '9cd5e651',
     '将眼望过去向赵大嘴。的眼睛。',
     '将眼望向赵大嘴。'),
    ('chapters/volume-1/chapter-94-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-1/chapter-94-polished.md', '9cd5e651',
     '将视线转去向赵大嘴。的眼睛。',
     '将视线转向赵大嘴。'),
    ('chapters/volume-2/chapter-184-polished.md', '9cd5e651',
     '细得像像蝉鸣',
     '细得像蝉鸣'),
    ('chapters/volume-2/chapter-184-polished.md', '9cd5e651',
     '细得像像一丝线',
     '细得像一丝线'),
    ('chapters/volume-2/chapter-191-polished.md', '9cd5e651',
     '细得像像一缕风',
     '细得像一缕风'),
    ('chapters/volume-2/chapter-194-polished.md', '9cd5e651',
     '细得像像游丝',
     '细得像游丝'),
    ('chapters/volume-2/chapter-200-polished.md', '9cd5e651',
     '细得像像一缕风',
     '细得像一缕风'),
    ('chapters/volume-2/chapter-215-polished.md', '9cd5e651',
     '细得像像一缕风',
     '细得像一缕风'),
    ('chapters/volume-2/chapter-231-polished.md', '500f669b',
     '是是',
     '是'),
    ('chapters/volume-3/chapter-278-polished.md', '9cd5e651',
     '细得像像发丝',
     '细得像发丝'),
    ('chapters/volume-3/chapter-281-polished.md', '9cd5e651',
     '细得像像蝉鸣',
     '细得像蝉鸣'),
    ('chapters/volume-3/chapter-287-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-3/chapter-330-polished.md', '9cd5e651',
     '细得像像蝉鸣',
     '细得像蝉鸣'),
    ('chapters/volume-4/chapter-414-polished.md', '9cd5e651',
     '细得像像蝉鸣',
     '细得像蝉鸣'),
    ('chapters/volume-4/chapter-429-polished.md', '9cd5e651',
     '细得像像蝉鸣',
     '细得像蝉鸣'),
    ('chapters/volume-4/chapter-475-polished.md', '9cd5e651',
     '细得像像蛛丝',
     '细得像蛛丝'),
    ('chapters/volume-4/chapter-484-polished.md', 'c63eff22',
     '是是',
     '是'),
    ('chapters/volume-4/chapter-502-polished.md', '2700db59',
     '将视线未移向赵大嘴。的眼睛。',
     '将视线移向赵大嘴。'),
    ('chapters/volume-4/chapter-502-polished.md', 'f7622c68',
     '朵朵朵朵',
     '朵朵，朵朵'),
    ('chapters/volume-4/chapter-518-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-4/chapter-521-polished.md', '9cd5e651',
     '细得像像蝉鸣',
     '细得像蝉鸣'),
    ('chapters/volume-4/chapter-522-polished.md', '9cd5e651',
     '将眼光转向向赵大嘴。的眼睛。',
     '将眼光转向赵大嘴。'),
    ('chapters/volume-4/chapter-523-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-4/chapter-524-polished.md', '9cd5e651',
     '将眼望过去向赵大嘴。的眼睛。',
     '将眼望向赵大嘴。'),
    ('chapters/volume-4/chapter-528-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-4/chapter-532-polished.md', '9cd5e651',
     '将视线转去向赵大嘴。的眼睛。',
     '将视线转向赵大嘴。'),
    ('chapters/volume-4/chapter-539-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-5/chapter-569-polished.md', '9cd5e651',
     '将视线转去向赵大嘴。的眼睛。',
     '将视线转向赵大嘴。'),
    ('chapters/volume-5/chapter-577-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-5/chapter-577-polished.md', '598444cb',
     '他清了清喉滚了一下0429碎片',
     '他清了清喉。0429碎片'),
    ('chapters/volume-5/chapter-580-polished.md', 'e379bcf2',
     '将目光转走向赵大嘴。的眼睛。',
     '将目光转向赵大嘴。'),
    ('chapters/volume-5/chapter-582-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-5/chapter-585-polished.md', '2700db59',
     '将视线未动向赵大嘴。的眼睛。',
     '将视线移向赵大嘴。'),
    ('chapters/volume-5/chapter-587-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-5/chapter-589-polished.md', '9cd5e651',
     '将眼投向向赵大嘴。的眼睛。',
     '将眼投向赵大嘴。'),
    ('chapters/volume-5/chapter-591-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-5/chapter-602-polished.md', '9cd5e651',
     '将视线转去向赵大嘴。的眼睛。',
     '将视线转向赵大嘴。'),
    ('chapters/volume-5/chapter-616-polished.md', '9252b142',
     '朵朵朵朵抬',
     '朵朵，朵朵抬'),
    ('chapters/volume-5/chapter-616-polished.md', '9252b142',
     '朵朵朵朵的',
     '朵朵，朵朵的'),
    ('chapters/volume-5/chapter-617-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-5/chapter-617-polished.md', '9252b142',
     '朵朵朵朵',
     '朵朵，朵朵'),
    ('chapters/volume-5/chapter-618-polished.md', '9252b142',
     '朵朵朵朵',
     '朵朵，朵朵'),
    ('chapters/volume-5/chapter-631-polished.md', '9252b142',
     '朵朵朵朵',
     '朵朵，朵朵'),
    ('chapters/volume-5/chapter-632-polished.md', '9252b142',
     '朵朵朵朵在跑',
     '朵朵，朵朵在跑'),
    ('chapters/volume-5/chapter-632-polished.md', '9252b142',
     '朵朵朵朵从',
     '朵朵，朵朵从'),
    ('chapters/volume-5/chapter-632-polished.md', '9252b142',
     '朵朵朵朵在花丛中跑，朵朵跑',
     '朵朵，朵朵在花丛中跑，朵朵跑'),
    ('chapters/volume-5/chapter-632-polished.md', '9cd5e651',
     '朵朵朵朵在花丛中跑，朵朵的笑',
     '朵朵，朵朵在花丛中跑，朵朵的笑'),
    ('chapters/volume-5/chapter-632-polished.md', '9252b142',
     '朵朵朵朵的眼',
     '朵朵，朵朵的眼'),
    ('chapters/volume-5/chapter-632-polished.md', '9252b142',
     '朵朵朵朵在花丛中跑，朵朵的声',
     '朵朵，朵朵在花丛中跑，朵朵的声'),
    ('chapters/volume-5/chapter-632-polished.md', '9252b142',
     '朵朵朵朵的手',
     '朵朵，朵朵的手'),
    ('chapters/volume-5/chapter-633-polished.md', '9252b142',
     '朵朵朵朵在',
     '朵朵，朵朵在'),
    ('chapters/volume-5/chapter-633-polished.md', '9252b142',
     '朵朵朵朵的',
     '朵朵，朵朵的'),
    ('chapters/volume-5/chapter-633-polished.md', '9252b142',
     '朵朵朵朵继',
     '朵朵，朵朵继'),
    ('chapters/volume-5/chapter-633-polished.md', '9252b142',
     '朵朵朵朵抬',
     '朵朵，朵朵抬'),
    ('chapters/volume-5/chapter-633-polished.md', '9252b142',
     '朵朵朵朵画',
     '朵朵，朵朵画'),
    ('chapters/volume-5/chapter-634-polished.md', '9252b142',
     '朵朵朵朵在画',
     '朵朵，朵朵在画'),
    ('chapters/volume-5/chapter-634-polished.md', '9252b142',
     '朵朵朵朵抬',
     '朵朵，朵朵抬'),
    ('chapters/volume-5/chapter-634-polished.md', '9252b142',
     '朵朵朵朵的',
     '朵朵，朵朵的'),
    ('chapters/volume-5/chapter-634-polished.md', '9252b142',
     '朵朵朵朵在吃',
     '朵朵，朵朵在吃'),
    ('chapters/volume-5/chapter-635-polished.md', '9252b142',
     '朵朵朵朵',
     '朵朵，朵朵'),
    ('chapters/volume-5/chapter-636-polished.md', '9252b142',
     '朵朵朵朵',
     '朵朵，朵朵'),
    ('chapters/volume-5/chapter-645-polished.md', '9cd5e651',
     '细得像像游丝',
     '细得像游丝'),
    ('chapters/volume-5/chapter-672-polished.md', '9252b142',
     '朵朵朵朵',
     '朵朵，朵朵'),
    ('chapters/volume-5/chapter-729-polished.md', '9cd5e651',
     '将眼投向向赵大嘴。的眼睛。',
     '将眼投向赵大嘴。'),
    ('chapters/volume-5/chapter-739-polished.md', '2d1194e5',
     '叶文轩转头望向赵大嘴。的眼睛。的胸口',
     '叶文轩转头望向赵大嘴的胸口'),
    ('chapters/volume-5/chapter-739-polished.md', '9252b142',
     '朵朵朵朵',
     '朵朵，朵朵'),
    ('chapters/volume-5/chapter-742-polished.md', '9cd5e651',
     '将视线转去向赵大嘴。的眼睛。',
     '将视线转向赵大嘴。'),
    ('chapters/volume-5/chapter-742-polished.md', 'eee81640',
     '是是',
     '是'),
    ('chapters/volume-5/chapter-746-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-6/chapter-769-polished.md', 'c63eff22',
     '是是',
     '是'),
    ('chapters/volume-6/chapter-829-polished.md', '9cd5e651',
     '将眼望过去向赵大嘴。的眼睛。',
     '将眼望向赵大嘴。'),
    ('chapters/volume-6/chapter-846-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-6/chapter-851-polished.md', '9cd5e651',
     '将眼光转去向赵大嘴。的眼睛。',
     '将眼光转向赵大嘴。'),
    ('chapters/volume-6/chapter-869-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-6/chapter-875-polished.md', '9cd5e651',
     '细得像像蚊子叫',
     '细得像蚊子叫'),
    ('chapters/volume-6/chapter-881-polished.md', '9cd5e651',
     '将眼投向向赵大嘴。的眼睛。',
     '将眼投向赵大嘴。'),
    ('chapters/volume-6/chapter-897-polished.md', '2d1194e5',
     '望向赵大嘴。的眼睛。',
     '望向赵大嘴。'),
    ('chapters/volume-1/chapter-28-polished.md', '500f669b',
     '告诉他他是概率扭曲者',
     '告诉他是概率扭曲者'),
    ('chapters/volume-1/chapter-30-polished.md', '6b1967be',
     '在他他眼瞳里',
     '在他眼瞳里'),
    ('chapters/volume-1/chapter-66-polished.md', 'f89585d3',
     '叶文轩的他他清了清喉间。',
     '叶文轩清了清喉间。'),
    ('chapters/volume-1/chapter-67-polished.md', 'f89585d3',
     '他他清了清喉咙了一下。',
     '他清了清喉咙。'),
    ('chapters/volume-2/chapter-158-polished.md', 'f89585d3',
     '叶文轩的他他喝了口水。',
     '叶文轩喝了口水。'),
    ('chapters/volume-4/chapter-441-polished.md', 'f7622c68',
     '余温告诉他他能听到建造者',
     '余温告诉他，他能听到建造者'),
    ('chapters/volume-4/chapter-449-polished.md', 'f89585d3',
     '叶文轩的他他清了清喉咙，',
     '叶文轩清了清喉咙，'),
    ('chapters/volume-4/chapter-457-polished.md', 'f7622c68',
     '女儿在等他他要看到',
     '女儿在等他，他要看到'),
    ('chapters/volume-4/chapter-491-polished.md', 'f89585d3',
     '他他吞了吞口水，',
     '他吞了吞口水，'),
    ('chapters/volume-7/chapter-957-polished.md', 'f89585d3',
     '赵大嘴他他清了清喉咙了一下，没说话。',
     '赵大嘴清了清喉咙，没说话。'),
    ('chapters/volume-4/chapter-495-polished.md', '2c12ba8a',
     '在他的眼底面映出',
     '在他的眼底映出'),
    ('chapters/volume-3/chapter-251-polished.md', 'dee6d291',
     '他清了清喉咙一下，想说什么',
     '他清了清喉咙，想说什么'),
    ('chapters/volume-5/chapter-561-polished.md', 'faa1fa54',
     '声音稍抖动抖，',
     '声音抖动，'),
    ('chapters/volume-4/chapter-425-polished.md', '9cd5e651',
     '视线移向向',
     '视线移向'),
    ('chapters/volume-7/chapter-931-polished.md', '9cd5e651',
     '视线投向向',
     '视线投向'),
]


def parse_raw(raw, allow_bom=False):
    """-> (lines, term, trail, problem)。lines 不含终止符。"""
    if raw.startswith(BOM):
        if not allow_bom:
            return None, None, None, 'BOM present'
        raw = raw[len(BOM):]
    try:
        body = raw.decode('utf-8')
    except UnicodeDecodeError:
        return None, None, None, 'not utf-8'
    if '\r\n' in body and body.replace('\r\n', '').count('\n'):
        return None, None, None, 'MIXED-EOL'
    term = '\r\n' if '\r\n' in body else '\n'
    text = body.replace('\r\n', '\n')
    trail = text.endswith('\n')
    lines = text.split('\n')
    if trail:
        lines = lines[:-1]
    return lines, term, trail, None


def encode(lines, term, trail):
    return (term.join(lines) + (term if trail else '')).encode('utf-8')


def read_state(path):
    with open(path, 'rb') as fh:
        raw = fh.read()
    lines, term, trail, problem = parse_raw(raw)
    return raw, lines, term, trail, problem


def blob(rev, path):
    r = subprocess.run(['git', 'show', '%s:%s' % (rev, path)], capture_output=True)
    return None if r.returncode else r.stdout


def touchers(path, tok):
    """pickaxe：计数变过该串的提交，从新到旧。"""
    r = subprocess.run(['git', 'log', '-S', tok, '--format=%h', '--', path],
                       capture_output=True, check=True)
    return [x for x in r.stdout.decode('utf-8').split('\n') if x.strip()]


def snippet(s, anchor):
    i = s.find(anchor)
    return s[max(0, i - 12):i + len(anchor) + 12]


def audit_site(path, src, old, new, lines):
    text = '\n'.join(lines)
    commits = touchers(path, old)
    if not commits:
        return 'no commit ever changed this string'
    if src not in commits:
        return 'recorded %s not among %s' % (src, ','.join(c[:7] for c in commits))
    # 本轮的修法含删字，未修状态下 new 可能是 old 的子串（count(new)>=1 恒成立），
    # 只能拿 old 的在场与否分状态（R247 教训②）；修后状态的字节级证据交给 --verify。
    n_old, n_new = text.count(old), text.count(new)
    if n_old == 1:
        return None
    if n_old == 0 and n_new:
        return None
    return 'anchor: un-repaired x%d, repaired x%d' % (n_old, n_new)


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else '--dry-run'
    only = sys.argv[2] if len(sys.argv) > 2 else None
    if mode not in ('--dry-run', '--apply', '--verify', '--audit'):
        print('unknown mode %r' % mode)
        return 2

    sites = [s for s in SITES if only is None or only in s[0]]
    print('R248  族 C 余量：池模板碎片')
    print('%d site(s) selected\n' % len(sites))

    if mode == '--audit':
        bad = 0
        for path, src, old, new in sites:
            raw, lines, term, trail, problem = read_state(path)
            if problem:
                print('  AUDIT %-30s !! %s' % (path.split('/')[-1], problem))
                bad += 1
                continue
            err = audit_site(path, src, old, new, lines)
            print('  AUDIT %-30s %s' % (path.split('/')[-1],
                                        'OK  %s' % src if err is None else '!! ' + err))
            if err:
                bad += 1
        print('\naudit: %d/%d ok' % (len(sites) - bad, len(sites)))
        return 1 if bad else 0

    if mode == '--verify':
        order = []
        for path, src, old, new in sites:
            if path not in order:
                order.append(path)
        bad = 0
        for path in order:
            mine = [s for s in sites if s[0] == path]
            raw = blob('HEAD', path)
            if raw is None:
                print('  VERIFY %-30s !! HEAD blob missing' % path.split('/')[-1])
                bad += 1
                continue
            hlines, hterm, htrail, problem = parse_raw(raw, allow_bom=True)
            if problem:
                print('  VERIFY %-30s !! HEAD: %s' % (path.split('/')[-1], problem))
                bad += 1
                continue
            htext = '\n'.join(hlines)
            broke = None
            for _, _, old, new in mine:
                if htext.count(old) != 1:
                    broke = 'HEAD: anchor x%d  %s' % (htext.count(old), snippet(htext, old[:6]))
                    break
                htext = htext.replace(old, new, 1)
            if broke:
                print('  VERIFY %-30s !! %s' % (path.split('/')[-1], broke))
                bad += 1
                continue
            hlines = htext.split('\n')
            cur = open(path, 'rb').read()
            clines, cterm, ctrail, problem = parse_raw(cur)
            if problem:
                print('  VERIFY %-30s !! worktree: %s' % (path.split('/')[-1], problem))
                bad += 1
                continue
            if hlines == clines and htrail == ctrail:
                note = 'bytes' if hterm == cterm else 'EOL %s->%s via eol=lf' % (
                    repr(hterm), repr(cterm))
                print('  VERIFY %-30s OK  x%d (%s)' % (path.split('/')[-1], len(mine), note))
            else:
                print('  VERIFY %-30s !! replay differs from the worktree' % path.split('/')[-1])
                bad += 1
        print('\nverify: %d/%d file(s) ok' % (len(order) - bad, len(order)))
        return 1 if bad else 0

    problems = []
    plans = []
    index = {}
    done = 0
    for path, src, old, new in sites:
        raw, lines, term, trail, problem = read_state(path)
        if problem:
            problems.append((path, old, problem))
            print('  %-30s !! %s' % (path.split('/')[-1], problem))
            continue
        text = '\n'.join(lines)
        n = text.count(old)
        if not n and text.count(new):
            done += 1
            print('  %-30s -- already repaired' % path.split('/')[-1])
            continue
        if n != 1:
            problems.append((path, old, 'anchor x%d' % n))
            print('  %-30s !! anchor x%d  %s' % (path.split('/')[-1], n, snippet(text, old[:6])))
            continue
        grp = index.get(path)
        if grp is None:
            grp = index[path] = [path, lines, term, trail, []]
            plans.append(grp)
        grp[4].append((old, new))
        print('  %-30s %s' % (path.split('/')[-1], snippet(text, old)))
        print('  %-30s -> %s' % ('', snippet(text, old).replace(old, new)))

    print()
    if problems:
        print('ABORT: %d problem(s), nothing written' % len(problems))
        return 2

    if mode == '--dry-run':
        print('dry run: %d edit(s) in %d file(s), %d already done'
              % (sum(len(g[4]) for g in plans), len(plans), done))
        return 0

    # 一个文件的多处编辑必须在同一份文本上依次落下，否则后写的会覆盖先写的
    for path, lines, term, trail, edits in plans:
        text = '\n'.join(lines)
        for old, new in edits:
            text = text.replace(old, new, 1)
        with open(path, 'wb') as fh:
            fh.write(encode(text.split('\n'), term, trail))
    print('applied: %d edit(s) in %d file(s)'
          % (sum(len(g[4]) for g in plans), len(plans)))

    left = 0
    for path, _, old, new in sites:
        raw, lines, term, trail, problem = read_state(path)
        if problem:
            print('  POST %-32s !! %s' % (path.split('/')[-1], problem))
            left += 1
            continue
        t = '\n'.join(lines)
        if t.count(old):
            print('  POST %-32s !! anchor still present x%d' % (path.split('/')[-1],
                                                                t.count(old)))
            left += 1
    print('post-check: %d bad state(s)' % left)
    return 1 if left else 0


if __name__ == '__main__':
    sys.exit(main())
