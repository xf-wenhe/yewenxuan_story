const fs = require('fs');
const path = require('path');

// === R67 SOURCES (8 patterns) ===

const EE1 = '声音弱小。';
const EE2 = '声音出来。';
const EE3 = '声音压得极弱。';
const EE4 = '声音轻得像耳语。';
const EE5 = '声音变了样。';
const EE6 = '声音稳如磐石。';
const EE7 = '声音抖得厉害。';
const EE8 = '声音细得像一根丝。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;