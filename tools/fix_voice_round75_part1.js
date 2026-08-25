const fs = require('fs');
const path = require('path');

// === R75 SOURCES (8 patterns) ===

const NN1 = '声音稳。';
const NN2 = '声音平直的。';
const NN3 = '声音细小而颤抖。';
const NN4 = '声音抖了一下。';
const NN5 = '声音轻得比平时更多。';
const NN6 = '声音抖了一点。';
const NN7 = '声音没了。';
const NN8 = '声音在变。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;