// fix_r221.js — Fix "他知道/她知道" deadly pattern at sentence start (44 occurrences)
const fs = require('fs'), p = require('path');
function getFP(ch) {
  const v = ch <= 100 ? 1 : ch <= 250 ? 2 : ch <= 400 ? 3 : ch <= 550 ? 4 : ch <= 750 ? 5 : ch <= 918 ? 6 : 7;
  const n = ch < 100 ? String(ch).padStart(2, '0') : String(ch).padStart(3, '0');
  return p.join('chapters', 'volume-' + v, 'chapter-' + n + '-polished.md');
}

const replacements = [
  // --- ch250: dialogue, repeat "他知道" x3 ---
  // Change to natural speech avoiding "他知道" pattern
  { ch: 250, old: '他知道你女儿在门后面。他知道你会走到门前。他知道你会在门后面找她。',
    new: '他清楚你女儿在门后面。清楚你会走到门前。清楚你会在门后面找她。' },

  // --- ch446: narration about father ---
  { ch: 446, old: '他知道了这一切之后，他怕叶子会受伤',
    new: '这件事落到他头上之后，他怕叶子会受伤' },

  // --- ch481: dialogue/narration mix ---
  { ch: 481, old: '她知道你在做一件很重要的事情',
    new: '她清楚你在做一件很重要的事情' },

  // --- ch502: narration about 沈知秋 ---
  { ch: 502, old: '她知道叶文轩会来。她知道叶文轩会救朵朵。',
    new: '叶文轩会来。叶文轩会救朵朵。' },

  // --- ch507: narration ---
  { ch: 507, old: '她知道他们看到了什么',
    new: '她看得清终端机里的一切' },

  // --- ch548: narration about prediction ---
  { ch: 548, old: '他知道你会因为0429碎片的绑定而成为锚点B',
    new: '你会因为0429碎片的绑定而成为锚点B' },

  // --- ch576: short narration ---
  { ch: 576, old: '她知道他会来',
    new: '他一定会来' },

  // --- ch616: memory loss narration ---
  { ch: 616, old: '他记得赵大嘴。他知道赵大嘴是谁。但他不记得赵大嘴长什么样了。',
    new: '他记得赵大嘴。赵大嘴是谁，他记得。但赵大嘴长什么样，他已经不记得了。' },

  // --- ch617: memory fading ---
  { ch: 617, old: '他知道这些事发生过，但他不记得那些细节了。',
    new: '这些事发生过。但那些细节，他已经想不起来了。' },

  // --- ch619: memory fading ---
  { ch: 619, old: '他知道他在回廊里等叶文轩，但他不记得等了多少天。',
    new: '他在回廊里等叶文轩。但等了几天，他记不清了。' },

  // --- ch622: transient description ---
  { ch: 622, old: '他知道那个方向是图书馆的最高层。',
    new: '那个方向是图书馆的最高层。' },

  // --- ch624: transient description ---
  { ch: 624, old: '他知道那个方向是闭环核心的图书馆最高层。',
    new: '那个方向是闭环核心的图书馆最高层。' },

  // --- ch625: narration about future self ---
  { ch: 625, old: '他知道第48循环的叶文轩会，走到这里。',
    new: '第48循环的叶文轩会走到这里。' },

  { ch: 625, old: '他知道会发生什么0429在等我',
    new: '他会发生的一切，0429早等了' },

  // --- ch627: probability lines ---
  { ch: 627, old: '他在概率线中看到了。他知道我们会选面对。他知道我们会打开v2.3模块。他知道我们会面对闭环的核心意识。',
    new: '他在概率线中看到了：他们会选面对。会打开v2.3模块。会面对闭环的核心意识。' },

  { ch: 627, old: '他等了我们121年。他知道你们会来。',
    new: '他等了我们121年。等你们来。' },

  // --- ch628: narration ---
  { ch: 628, old: '他在概率线中看到了你们会选面对。他知道你们会走到这里。他等了121年。',
    new: '他在概率线中看到了你们会选面对。会走到这里。他等了121年。' },

  // --- ch630: narration ---
  { ch: 630, old: '第47号叶文轩等了121年，等的就是这一刻。他知道我会选择留下。他在v2.3模块中留了这段话，让我知道：留下是延续。',
    new: '第47号叶文轩等了121年，等的就是这一刻。他会选择留下。他在v2.3模块中留了这段话：留下是延续。' },

  // --- ch632: same as ch630 ---
  { ch: 632, old: '第47号叶文轩等了121年，等的就是这一刻。他知道我会选择留下。他在v2.3模块中留了这段话，让我知道：留下是延续。',
    new: '第47号叶文轩等了121年，等的就是这一刻。他会选择留下。他在v2.3模块中留了这段话：留下是延续。' },

  // --- ch655 line 35: three "他知道" ---
  { ch: 655, old: '在设计的那一天，他知道了一件事——赵大嘴会遇到叶文轩。他知道赵大嘴会选叶文轩。他知道赵大嘴会在最关键的时刻选叶文轩。',
    new: '在设计的那一天，他明白了一件事——赵大嘴会遇到叶文轩。赵大嘴会选叶文轩。最关键的时刻，赵大嘴会选叶文轩。' },

  // --- ch655 line 85 ---
  { ch: 655, old: '他知道赵大嘴会遇到叶文轩，会选择跟着叶文轩走。',
    new: '赵大嘴会遇到叶文轩，会选择跟着叶文轩走。' },

  // --- ch710: narration ---
  { ch: 710, old: '第N-1轮的叶文轩在死前知道自己失败了。他知道自己无法打破闭环，闭环重新运行后他的意识会被覆盖，第N-1轮的叶文轩从这个世界上消失。',
    new: '第N-1轮的叶文轩在死前明白自己失败了。闭环打破不了。闭环重新运行后，他的意识会被覆盖，第N-1轮的叶文轩从这个世界上消失。' },

  // --- ch738: narration ---
  { ch: 738, old: '她知道自己的意识在衰减，知道她可能不会一直在那里等朵朵长大。',
    new: '她感觉自己的意识在衰减，可能不会一直在那里等朵朵长大。' },

  // --- ch788: four "她知道" ---
  { ch: 788, old: '她知道女儿不在她身边，不在她的灵魂里，不在她的核心意识里。她知道女儿在0428碎片里，在粉红色的光里，在跳，在等。她知道女儿在等她。她知道女儿在说：妈妈。',
    new: '女儿不在她身边，不在她的灵魂里，不在她的核心意识里。女儿在0428碎片里，在粉红色的光里，在跳，在等。在等她。女儿在说：妈妈。' },

  // --- ch790: narration ---
  { ch: 790, old: '她知道他在看。她一直知道。',
    new: '他一直在看。她一直清楚。' },

  // --- ch808: four "他知道" ---
  { ch: 808, old: '他知道闭环在死。他知道稳态在崩溃。他知道女儿的爱信号在加热核心。这些真相他知道47个循环，200年。',
    new: '闭环在死。稳态在崩溃。女儿的爱信号在加热核心。这些真相，他在47个循环里、200年里一直承受着。' },
];

let applied = 0, skipped = 0;
for (const r of replacements) {
  const fp = getFP(r.ch);
  let text = fs.readFileSync(fp, 'utf-8');
  if (!text.includes(r.old)) {
    console.log('SKIP ch' + r.ch + ': "' + r.old.substring(0, 40) + '..." not found');
    skipped++;
    continue;
  }
  text = text.replace(r.old, r.new);
  fs.writeFileSync(fp, text, 'utf-8');
  console.log('OK   ch' + r.ch + ': "' + r.old.substring(0, 40) + '..."');
  applied++;
}

console.log('\nApplied: ' + applied + ', Skipped: ' + skipped);
console.log('Total: ' + replacements.length);
