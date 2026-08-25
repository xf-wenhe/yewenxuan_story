const fs = require('fs');
const path = require('path');

// === R94 SOURCES (8 patterns) ===

const HH1 = '声音于回廊内回荡。';
const HH2 = '声音在叶文轩的耳朵中回响。';
const HH3 = '声音0428碎片的声音在叶文轩的意识中，飘荡。';
const HH4 = '声音他没有自己的，选择。';
const HH5 = '声音变得更温柔，了。';
const HH6 = '声音证实了他的感知：检测到闭环边界信号变化。';
const HH7 = '声音在0429的信号中传来，0429备份在翻译。';
const HH8 = '声音0429备份在翻译，赵大嘴的声音。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
