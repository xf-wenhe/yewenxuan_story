const fs = require('fs');
const path = require('path');

// === R28 SOURCES (10 patterns, ~1561 total occurrences) ===

const S1 = '那句话沉进了他心里最深处';
const S2 = '叶文轩的心脏在跳';
const S3 = '他需要更多的时间';
const S4 = '他的目光在那些影子里停留了几秒';
const S5 = '这件事的来龙去脉，他还需要更多的时间才能弄清楚';
const S6 = '金色眼睛在闪烁';
const S7 = '叶文轩的脑子在转';
const S8 = '叶文轩的心脏停跳了一拍';
const S9 = '叶文轩闭上眼睛';
const S10 = '叶文轩看向赵大嘴';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;