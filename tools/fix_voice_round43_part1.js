const fs = require('fs');
const path = require('path');

// === R43 SOURCES (8 patterns: flat-voice recycled + shadow recycled + 赵大嘴 follow) ===

const GG1 = '声调从头到尾纹丝不动。';
const GG2 = '语调没有高低变化，只有一条线。';
const GG3 = '声音平得找不到任何起落。';
const GG4 = '声调始终维持在同一高度。';
const GG5 = '光中的影子来回晃动，被遗忘的东西还在跳动。';
const GG6 = '影子在光照中摇晃，被遗忘的记忆在躁动。';
const GG7 = '赵大嘴跟在叶文轩身后。';
const GG8 = '赵大嘴尾随在他后面。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;