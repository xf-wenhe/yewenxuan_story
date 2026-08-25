const fs = require('fs');
const path = require('path');

// === R71 SOURCES (8 patterns) ===

const JJ1 = '声音说话。。';
const JJ2 = '声音压得比平时更低。。';
const JJ3 = '声音了。';
const JJ4 = '声音极低地说了句。';
const JJ5 = '声音戛然而止。';
const JJ6 = '声音低到了底。。';
const JJ7 = '声音压到了极限。。';
const JJ8 = '声音压到了最低。。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;