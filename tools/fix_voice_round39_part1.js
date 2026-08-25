const fs = require('fs');
const path = require('path');

// === R39 SOURCES (8 patterns: recycled flat-voice descriptors + concentrated action phrases) ===

const CC1 = '叶文轩把目光投向赵大嘴。';
const CC2 = '叶文轩点头。';
const CC3 = '叶文轩的脑子在高速运转。';
const CC4 = '叶文轩的喉头猛地收紧。';
const CC5 = '叶文轩的呼吸堵了一瞬。';
const CC6 = '声线平直得像一条直线。';
const CC7 = '语气平稳得没有涟漪。';
const CC8 = '语气里没有任何震荡。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;