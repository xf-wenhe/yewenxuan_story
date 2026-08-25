const fs = require('fs');
const path = require('path');

// === R58 SOURCES (8 patterns: concentrated 声音 + 叶文轩) ===

const VV1 = '声音很小。';
const VV2 = '声音平稳。';
const VV3 = '声音压得很低。';
const VV4 = '声音颤动着。';
const VV5 = '声音有点抖。';
const VV6 = '声音沙哑得厉害。';
const VV7 = '声音像被砂纸磨过一般。';
const VV8 = '叶文轩的声音在回廊中回荡。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;