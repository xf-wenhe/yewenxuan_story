const fs = require('fs');
const path = require('path');

// === R79 SOURCES (8 patterns) ===

const RR1 = '声音粗粝而干涩。';
const RR2 = '声音像被砂纸擦过一样。';
const RR3 = '声音在叫我。';
const RR4 = '声音在身后持续着。';
const RR5 = '声音平和。';
const RR6 = '声音压得极沉。';
const RR7 = '声音在抖。';
const RR8 = '声音细短得听不清。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;