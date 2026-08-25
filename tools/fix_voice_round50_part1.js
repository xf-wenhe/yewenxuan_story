const fs = require('fs');
const path = require('path');

// === R50 SOURCES (8 patterns: voice volume + 赵大嘴 voice) ===

const NN1 = '声音轻得几乎消失。';
const NN2 = '声音轻得快要消散。';
const NN3 = '音量轻得几乎听不见了。';
const NN4 = '声音微弱得几乎听不见。';
const NN5 = '赵大嘴的声调平直';
const NN6 = '赵大嘴说话，嗓音粗哑。';
const NN7 = '赵大嘴开口，嗓音沙哑。';
const NN8 = '频率比以前明显升高。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;