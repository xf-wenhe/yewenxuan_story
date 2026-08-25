const fs = require('fs');
const path = require('path');

// === R53 SOURCES (8 patterns: 韩冰 voice + 声音平稳 + 音量轻 + time) ===

const QQ1 = '声音平稳而缺乏变化。';
const QQ2 = '音量轻得几近无声。';
const QQ3 = '韩冰开口，声音轻得近乎消散。';
const QQ4 = '韩冰开口，声音压到了最低。';
const QQ5 = '韩冰开口，声音轻得快要飘走。';
const QQ6 = '他还需要时间才能想明白。';
const QQ7 = '他还需要些时间才能理清。';
const QQ8 = '他还需要一会儿才行。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;