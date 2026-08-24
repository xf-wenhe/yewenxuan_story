const fs = require('fs');
const path = require('path');

// === R30 SOURCES (10 recycled patterns) ===

const T1 = '他站在那里，一时不知道该迈出去';
const T2 = '他站在那里，一时不知道该走还是不走';
const T3 = '他站在那里，一时不知道该迈哪只脚';
const T4 = '他站在那里，一时不知道该朝哪个方向走';
const T5 = '他的目光在那些影子里凝滞了几秒';
const T6 = '他的目光在那些影子里定格了几秒';
const T7 = '他的目光在那些影子里多看了几秒';
const T8 = '他的目光在那些影子里停了几秒';
const T9 = '叶文轩睁开眼睛';
const T10 = '叶文轩没有回答';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;