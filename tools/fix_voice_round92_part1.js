const fs = require('fs');
const path = require('path');

// === R92 SOURCES (8 patterns) ===

const FF1 = '声音回旋片刻，终究淡去。';
const FF2 = '声音飘了过来。';
const FF3 = '声音低得像耳语。';
const FF4 = '声音，很轻。';
const FF5 = '声音有点不确定，"好像没那么使劲拽了。"';
const FF6 = '声音抖得没有停。';
const FF7 = '声音传了过来，继续说。';
const FF8 = '声音从远处传来，开口说了。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
