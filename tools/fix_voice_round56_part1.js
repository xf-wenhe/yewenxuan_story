const fs = require('fs');
const path = require('path');

// === R56 SOURCES (8 patterns: 声音 descriptors + 叶文轩 voice tone) ===

const TT1 = '声音在抖。';
const TT2 = '声音很弱。';
const TT3 = '声音很细小。';
const TT4 = '声音极轻。';
const TT5 = '声音轻得发颤。';
const TT6 = '叶文轩的声线里听不出任何波澜。';
const TT7 = '叶文轩说话时语气平淡得不像真人。';
const TT8 = '叶文轩的声调平稳得近乎冷淡。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;