const fs = require('fs');
const path = require('path');

// === R63 SOURCES (8 patterns) ===

const AA1 = '声音很哑。';
const AA2 = '声音很轻细。';
const AA3 = '声音平淡。';
const AA4 = '声音有点不确定。';
const AA5 = '声音没有高低，也没有顿挫。';
const AA6 = '声音消失了。';
const AA7 = '声音停顿了一下。';
const AA8 = '声音抖了起来。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;