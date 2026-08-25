const fs = require('fs');
const path = require('path');

// === R90 SOURCES (8 patterns) ===

const DD1 = '声音短促而清楚。';
const DD2 = '声音短促。';
const DD3 = '声音只有几个字。';
const DD4 = '声音寥寥几个字。';
const DD5 = '声音断了一下，传输中断了。';
const DD6 = '声音：听得到。';
const DD7 = '声音歇了片刻。';
const DD8 = '声音平得没有节奏。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
