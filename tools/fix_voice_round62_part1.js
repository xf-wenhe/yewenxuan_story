const fs = require('fs');
const path = require('path');

// === R62 SOURCES (8 patterns) ===

const ZZ1 = '声音颤着。';
const ZZ2 = '声音很细小而短。';
const ZZ3 = '声音很细小而模糊。';
const ZZ4 = '声音平直。';
const ZZ5 = '声音颤了起来。';
const ZZ6 = '声音有些不确定。';
const ZZ7 = '声音轻而颤动。';
const ZZ8 = '声音很淡。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;