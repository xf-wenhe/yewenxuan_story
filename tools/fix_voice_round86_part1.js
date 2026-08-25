const fs = require('fs');
const path = require('path');

// === R86 SOURCES (8 patterns) ===

const ZZ1 = '声音轻得几近无声。。';
const ZZ2 = '声音轻得随时会断掉。。';
const ZZ3 = '声音细得像一缕风。。';
const ZZ4 = '声音压到了底线。。';
const ZZ5 = '声音细得仿佛游丝。。';
const ZZ6 = '声音小得几乎听不到了。。';
const ZZ7 = '声音压得低到几乎听不见。。';
const ZZ8 = '声音轻得快要散开。。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
