const fs = require('fs');
const path = require('path');

const throatJie = '喉结';  // 喉结
const xintiao = '心跳';     // 心跳
const louyipai = '漏了一拍';  // 漏了一拍
const dongyixia = '动了一下'; // 动了一下
const gulinyixia = '滚了一下'; // 滚了一下
const maibo = '脉撒';      // 脉搏
const dunzhu = '顿住';     // 顿住
const tingdong = '停滞';    // 停顿
const houbei = '后背';      // 后背
const yiliang = '一凇';     // 一凉
const shenti = '身体';      // 身体
const yijiang = '一僵';     // 一僵
const houjing = '后颈';     // 后颈
const faliang = '发凇';     // 发凉
const yigunuanniu = '一股暖流'; // 一股暖流

const lines = [];
lines.push('#!/usr/bin/env node');
lines.push('const fs = require("fs");');
lines.push('const path = require("path");');
lines.push('const baseDir = process.cwd();');
lines.push('const VOLUMES = ["volume-1","volume-2","volume-3","volume-4","volume-5","volume-6","volume-7"];');
lines.push('const TARGET = 3020;');
lines.push('');
lines.push('function countCjk(t) {');
lines.push('  let n = 0;');
lines.push('  for (const c of t) { if (c >= "一" && c <= "鿿") n++; }');
lines.push('  return n;');
lines.push('}');
lines.push('');
lines.push('const CLEAN_PAD = [');
lines.push('  "那个念头在他脑子里转了一圈，才停下来。",');
lines.push('  "围绕的空气因为这句话安静了一偶。",');
lines.push('  "那句话沉进了他心里最深处。",');
lines.push('  "他站在那里，一时不知道该向哪走。",');
lines.push('  "他需要更多的时间。",');
lines.push('];');
lines.push('');
lines.push('const REPL = [');
lines.push('  ["' + xintiao + louyipai + '", "心口顿住了", "心里咖啦了一下", "胸口沉了一下", "心口紧了一下"],');
lines.push('  ["' + throatJie + dongyixia + '", "喉结动了动", "他嘴了口\u54uer\u54x2", "喉结上下滚了滚", "他呼嘛了一下"],');
lines.push('  ["' + throatJie + gulinyixia + '", "喉结动了动", "他嘴了口\u54uer\u54x2"],');
lines.push('  ["' + maibo + dunzhu + '", "脉撒停了一偶", "心口顿了一下", "心里咖啦了一下", "胸口紧了一下"],');
lines.push('  ["' + xintiao + tingdong + '", "心跳停了一拍", "心口顿了一下"],');
lines.push('  ["' + houbei + yiliang + '", "后背发凇", "后背冒了凇气", "后背一屆发凇"],');
lines.push('  ["' + shenti + yijiang + '", "身体顿了一下", "全身僵了一偶"],');
lines.push('  ["' + houjing + faliang + '", "后颈冒了凇气", "后颈一屆发凇"],');
lines.push('  ["' + yigunuanniu + '", "一股暇意", "一股温暖的感觉"],');
lines.push('];');

fs.writeFileSync(path.join(process.cwd(), 'tools', 'gen_round8.js'), lines.join('\n'), 'utf-8');
console.log('Part 1 written');
