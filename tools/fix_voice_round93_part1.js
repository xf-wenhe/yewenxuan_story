const fs = require('fs');
const path = require('path');

// === R93 SOURCES (8 patterns) ===

const GG1 = '声音在回廊里回响。';
const GG2 = '声音在回廊中回响。';
const GG3 = '声音在石头间折射。';
const GG4 = '声音，是从意识中听到的。一个很沉的声音。一个很老的声音。';
const GG5 = '声音在抖，是激动的，抖。';
const GG6 = '声音，很紧。';
const GG7 = '声音平稳，够我们准备了。';
const GG8 = '声音从前方传来，很近又很远。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
