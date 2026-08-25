const fs = require('fs');
const path = require('path');

// === R45 SOURCES (8 patterns: 赵大嘴 voice + 音量 + 赵大嘴 follow + 叶文轩 voice + 节奏) ===

const II1 = '赵大嘴的声音有些平。';
const II2 = '赵大嘴的声音有些哑。';
const II3 = '音量微乎其微。';
const II4 = '赵大嘴跟在队伍末尾。';
const II5 = '叶文轩说，声音很平。';
const II6 = '赵大嘴跟在最后面。';
const II7 = '节奏比以前快了不少。';
const II8 = '赵大嘴跟在叶文轩后面。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;