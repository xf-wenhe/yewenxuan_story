const fs = require('fs');
const path = require('path');

// === R51 SOURCES (8 patterns: low-volume voice) ===

const OO1 = '声音轻得几乎消散。';
const OO2 = '声音低得几乎无法感知。';
const OO3 = '声音低得几乎听不到。';
const OO4 = '声音低得几乎察觉不到。';
const OO5 = '声音轻得几乎听不到。';
const OO6 = '声音轻得几乎飘散。';
const OO7 = '声音轻得几乎消散在空气里。';
const OO8 = '他还需要一些时间才能理清头绪。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;