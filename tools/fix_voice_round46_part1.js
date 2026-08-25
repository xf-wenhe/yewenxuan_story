const fs = require('fs');
const path = require('path');

// === R46 SOURCES (8 patterns: 音量 + 赵大嘴 voice + 赵大嘴 follow) ===

const JJ1 = '声音小得几乎听不到。';
const JJ2 = '音量低得几乎难以察觉。';
const JJ3 = '声音小得几乎无法听见。';
const JJ4 = '音量低得几乎听不清。';
const JJ5 = '赵大嘴开口，语调平得像水面。';
const JJ6 = '赵大嘴的声调平直而均匀。';
const JJ7 = '赵大嘴说话，嗓音沙哑。';
const JJ8 = '赵大嘴跟在叶文轩的后面。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;