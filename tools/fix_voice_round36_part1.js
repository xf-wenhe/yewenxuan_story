const fs = require('fs');
const path = require('path');

// === R36 SOURCES (8 patterns: recycled alternatives + 0428 backup lines + looking-at patterns) ===

const Z1 = '那句话沉进了他心里，再也抹不掉。';
const Z2 = '那句话沉进了他心里，再也浮不上来。';
const Z3 = '叶文轩看着他。';
const Z4 = '赵大嘴看着他。';
const Z5 = '叶文轩感觉到心跳。';
const Z6 = '那些被压下去的东西，现在一点一点地浮上来。';
const Z7 = '0428备份在坐标的位置发光，';
const Z8 = '0428备份在坐标的位置运行，';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;