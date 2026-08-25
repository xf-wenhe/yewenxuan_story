const fs = require('fs');
const path = require('path');

// === R72 SOURCES (8 patterns) ===

const KK1 = '声音压到了最低点。。';
const KK2 = '声音平平的。';
const KK3 = '声音从身后传来。';
const KK4 = '声音断了。';
const KK5 = '声音颤抖不已。';
const KK6 = '声音哑了。';
const KK7 = '声音颤个不停。';
const KK8 = '声音冷得让人打颤。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;