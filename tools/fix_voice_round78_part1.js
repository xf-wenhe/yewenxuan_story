const fs = require('fs');
const path = require('path');

// === R78 SOURCES (8 patterns) ===

const QQ1 = '声音极低沉。';
const QQ2 = '声音顿了顿。';
const QQ3 = '声音传出去。';
const QQ4 = '声音在0429备份的信号中传来。';
const QQ5 = '声音有些干。';
const QQ6 = '声音在球形空间中流动。';
const QQ7 = '声音紧得像要断裂。';
const QQ8 = '声音沙哑得很厉害。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;