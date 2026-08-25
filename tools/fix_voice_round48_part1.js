const fs = require('fs');
const path = require('path');

// === R48 SOURCES (8 patterns: time phrases) ===

const LL1 = '他还需要片刻去梳理思绪。';
const LL2 = '他还需要一点时间才能想明白。';
const LL3 = '他还需要更多时间去梳理思绪。';
const LL4 = '他还需要一些时间才能理清方向。';
const LL5 = '他还需要一些时间把思路捋顺。';
const LL6 = '他还需要片刻才能拍板。';
const LL7 = '他还需要短暂的时间才能定下来。';
const LL8 = '他还需要一点时间才能形成决定。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;