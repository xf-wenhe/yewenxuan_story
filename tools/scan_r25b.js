const fs = require('fs');
const path = require('path');
const V = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const allText = [];
for (const v of V) {
  const d = path.join(process.cwd(), 'chapters', v);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('-polished.md')))
    allText.push(fs.readFileSync(path.join(d, f), 'utf-8'));
}
const combined = allText.join('\n');

// Scan for concentrated full-sentence patterns that are R24-era chapter-end boilerplate
const candidates = [
  // R24 s2a2: 念头一旦出现，就再也挥不掉了
  '念头一旦出现，就再也挥不掉了',
  // R24 s2a1: 这个念头一出现，就缠住了他
  '这个念头一出现，就缠住了他',
  // R24 s2a3: 一旦冒出来，这个念头就停不下来了
  '一旦冒出来，这个念头就停不下来了',
  // R24 s2a4: 这念头一冒出来，就怎么也挥不掉了
  '这念头一冒出来，就怎么也挥不掉了',
  // R24 s1a1: 这话没有出口，只是沉在了意识深处
  '这话没有出口，只是沉在了意识深处',
  // R24 s1a2: 这些话停在了嗓子口，沉进了意识最深处
  '这些话停在了嗓子口，沉进了意识最深处',
  // R24 s1a3: 这话没有说出口，只是沉在了意识里
  '这话没有说出口，只是沉在了意识里',
  // R24 s1a4: 这些念头留在心里，没有说出口
  '这些念头留在心里，没有说出口',
  // R24 s3a1: 他没把话说完，后面的事情他自己也说不清
  '他没把话说完，后面的事情他自己也说不清',
  // R24 s3a2: 话没说完，后面的事情他自己也理不清
  '话没说完，后面的事情他自己也理不清',
  // R24 s3a3: 话说到一半停住了，后面的事情他自己也说不清
  '话说到一半停住了，后面的事情他自己也说不清',
  // R24 s3a4: 他没把话说完，后面的他自己也讲不清
  '他没把话说完，后面的他自己也讲不清',
  // R24 s4a1: 远处的风声似乎大了一些，像是在应和
  '远处的风声似乎大了一些，像是在应和',
  // R24 s4a2: 风似乎也大了一些，像是在回应
  '风似乎也大了一些，像是在回应',
  // R24 s4a3: 远处的风声大了一些，像是在附和
  '远处的风声大了一些，像是在附和',
  // R24 s4a4: 风声似乎也大了一些，像是有什么在回应
  '风声似乎也大了一些，像是有什么在回应',
  // R24 s5a1: 周围的空气也因为这句话静了一瞬
  '周围的空气也因为这句话静了一瞬',
  // R24 s5a2: 空气似乎也因为这句话安静了下来
  '空气似乎也因为这句话安静了下来',
  // R24 s5a3: 周围的一切也因为这句话静了下来
  '周围的一切也因为这句话静了下来',
  // R24 s5a4: 周围的空气静了一瞬
  '周围的空气静了一瞬',
  // Other potential concentrated endings
  '墙上的灯光忽明忽暗',
  '四周静得连自己的呼吸声都听得见',
  '空气仿佛也凝固了一瞬',
  '空气也仿佛凝固了一瞬',
];

console.log('=== R25 TARGETED SCAN ===');
const results = [];
for (const s of candidates) {
  const cnt = combined.split(s).length - 1;
  if (cnt > 0) results.push([cnt, s]);
}
results.sort((a,b) => b[0] - a[0]);
for (const [cnt, s] of results) console.log('  ' + cnt + '  "' + s + '" (' + s.length + ' chars)');