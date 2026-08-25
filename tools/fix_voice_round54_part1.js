const fs = require('fs');
const path = require('path');

// === R54 SOURCES (8 patterns: 声音 descriptors + 叶文轩 voice + time phrases) ===

const RR1 = '声音冷得像没有温度。';
const RR2 = '声音平静而单调。';
const RR3 = '叶文轩把声音压到最低。';
const RR4 = '叶文轩把声音压得更低。';
const RR5 = '他还需要些时间才能弄懂。';
const RR6 = '他还需要些时间弄通。';
const RR7 = '他还需要时间去弄懂。';
const RR8 = '他还需要些时间才能想通。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;