const fs = require('fs');
const path = require('path');

// === R81 SOURCES (8 patterns) ===

const TT1 = '声音在叶文轩的意识中响起，飘荡。';
const TT2 = '声音反复几次，最后消失不见。';
const TT3 = '声音淡得像水。';
const TT4 = '声音抖得让人听不清。';
const TT5 = '声音变了调，混着隐隐的响动。';
const TT6 = '声音从后方传来。';
const TT7 = '声音弱得难以察觉。';
const TT8 = '声音发哑。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;