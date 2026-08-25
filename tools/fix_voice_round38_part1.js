const fs = require('fs');
const path = require('path');

// === R38 SOURCES (8 patterns: recycled alternatives + concentrated patterns) ===

const BB1 = '叶文轩的脑子在飞速运转。';
const BB2 = '他站在那里，什么也没有说出口。';
const BB3 = '叶文轩没有说话。';
const BB4 = '他抬起头，看向窗外，但窗外什么也没有。';
const BB5 = '赵大嘴跟在他后面。';
const BB6 = '备用能量在快速减少。';
const BB7 = '什么都没有。';
const BB8 = '叶文轩感到。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;