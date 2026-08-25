const fs = require('fs');
const path = require('path');

// === R73 SOURCES (8 patterns) ===

const LL1 = '声音颤抖不止。';
const LL2 = '声音有点飘，"它在叫我。';
const LL3 = '声音很模糊。像隔着一层水。像隔着一层时间。';
const LL4 = '声音从远处传来，浪拍在沙滩上的声音。';
const LL5 = '声音细得像游丝。。';
const LL6 = '声音颤抖着。';
const LL7 = '声音在0415碎片的最深层循环播放。';
const LL8 = '声音压到了最低。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;