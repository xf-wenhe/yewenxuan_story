const fs = require('fs');
const path = require('path');

// === R64 SOURCES (8 patterns) ===

const BB1 = '声音中断了。';
const BB2 = '声音平而稳。';
const BB3 = '声音还在耳边回响着。';
const BB4 = '声音久久不散。';
const BB5 = '声音轻得难以捕捉。';
const BB6 = '声音在回廊中回荡。';
const BB7 = '声音颤抖不断。';
const BB8 = '声音静止一瞬。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;