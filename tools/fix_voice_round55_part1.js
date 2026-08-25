const fs = require('fs');
const path = require('path');

// === R55 SOURCES (8 patterns: 声音 descriptors + 叶文轩 voice) ===

const SS1 = '声音很平。';
const SS2 = '声音很轻。';
const SS3 = '声音压得极低。';
const SS4 = '声音细若游丝。';
const SS5 = '声音压到最低。';
const SS6 = '叶文轩说话，声音几乎消散在空气里。';
const SS7 = '叶文轩说话时声音微不可闻。';
const SS8 = '叶文轩的声音细如蚊呐。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;