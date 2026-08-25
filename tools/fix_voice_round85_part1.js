const fs = require('fs');
const path = require('path');

// === R85 SOURCES (8 patterns) ===

const YY1 = '声音消失了。';
const YY2 = '声音低沉。';
const YY3 = '声音平缓。';
const YY4 = '声音细小。';
const YY5 = '声音发抖。';
const YY6 = '声音抖。';
const YY7 = '声音颤了一下。';
const YY8 = '声音变轻了。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
