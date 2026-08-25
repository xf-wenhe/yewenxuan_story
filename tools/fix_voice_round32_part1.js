const fs = require('fs');
const path = require('path');

// === R32 SOURCES (8 patterns: recycled R27 alternatives + high-freq leftovers) ===

const V1 = '周围的空气因为这句话顿了一瞬';
const V2 = '周围的空气因为这句话静了一瞬';
const V3 = '那个念头在他脑子里转了好几圈，才停下来';
const V4 = '那个念头在他脑子里转了几个来回，才停下来';
const V5 = '沉默在两人之间蔓延，谁也没有先开口打破它';
const V6 = '叶文轩的脑子没停过';
const V7 = '暗红色的光';
const V8 = '叶文轩的眼睛在看赵大嘴';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;