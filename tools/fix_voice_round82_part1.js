const fs = require('fs');
const path = require('path');

// === R82 SOURCES (8 patterns) ===

const UU1 = '声音稳得像直线。';
const UU2 = '声音轻得快要飘远。';
const UU3 = '声音变了样，像有人在远处低语。';
const UU4 = '声音里没有一丝暖意。';
const UU5 = '声音继续压低。';
const UU6 = '声音变了调，似有似无地飘来。';
const UU7 = '声音微颤。';
const UU8 = '声音淡得几乎消失。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;