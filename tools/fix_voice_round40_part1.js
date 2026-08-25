const fs = require('fs');
const path = require('path');

// === R40 SOURCES (8 patterns: recycled flat-voice descriptors + sand-voice patterns + time phrase) ===

const DD1 = '声音平直而缺乏变化。';
const DD2 = '声音中没有半点儿情绪。';
const DD3 = '声调里听不出起伏。';
const DD4 = '赵大嘴开口时声音沙哑得厉害。';
const DD5 = '赵大嘴的声音带着明显的沙哑。';
const DD6 = '赵大嘴的嗓音粗哑不堪。';
const DD7 = '赵大嘴说话带着浓厚的沙哑。';
const DD8 = '他还需要一点时间。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;