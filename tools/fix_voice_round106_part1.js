const fs = require('fs');
const path = require('path');

const TT1 = '嗓音冷静而寡淡。，';
const TT2 = '嗓音。。';
const TT3 = '声调平稳得让人感觉不到情感。，';
const TT4 = '声调平稳得几乎冷淡。，';
const TT5 = '声调忽然沉了。';
const TT6 = '声调降了下来。';
const TT7 = '声调突然沉了下来。';
const TT8 = '声调猛地低了下来。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;