#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();
const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];

const checks = [
  // "心中暗道" and similar — character narrating internal monologue
  '心中暗道', '心里暗想', '心里想',
  // "嘴角浮起" variants
  '嘴角浮起', '嘴角牵动',
  // "眼神" patterns (common AI tell)
  '眼神一冷', '眼神一暗', '眼神微冷', '眼神暗沉',
  '眼中' + '闪过', '目光' + '中闪过', '眸光' + '一闪',
  // "心跳" / "脉搏" formulaic
  '心跳' + '漏了一拍', '心跳' + '停顿', '心跳' + '停滞',
  '脉搏' + '顿住', '脉搏' + '一滞', '脉搏' + '停顿',
  // "一股" surges
  '一股' + '无法', '一股' + '难以', '一股' + '莫名',
  '一股' + '寒意', '一股' + '暖流',
  // "呼吸一滞"
  '呼吸' + '一滞', '呼吸' + '停滞', '呼吸' + '停顿',
  // "身体一僵"
  '身体' + '一僵', '身体' + '猛地一僵',
  // "后背一凉"
  '后背' + '一凉', '后颈' + '发凉',
  // "喉结滚动"
  '喉结' + '滚动', '喉结' + '动了一下',
  // "手指'紧握"
  '手指' + '紧握', '手指' + '捏紧', '指甲' + '掐进',
  // "目光" + "复杂"
  '目光' + '复杂', '眼神' + '复杂', '一脸' + '复杂',
];

const results = {};
for (const p of checks) {
  let total = 0;
  for (const v of VOLUMES) {
    const d = path.join(baseDir, 'chapters', v);
    if (!fs.existsSync(d)) continue;
    const files = fs.readdirSync(d).filter(f => f.endsWith('-polished.md')).sort();
    for (const f of files) {
      total += fs.readFileSync(path.join(d, f), 'utf-8').split(p).length - 1;
    }
  }
  if (total > 0) results[p] = total;
}
for (const [p, c] of Object.entries(results).sort((a,b) => b[1] - a[1])) {
  console.log(c + 'x  ' + p);
}
