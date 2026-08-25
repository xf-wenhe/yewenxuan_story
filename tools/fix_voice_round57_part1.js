const fs = require('fs');
const path = require('path');

// === R57 SOURCES (8 patterns: R56 alternatives + 声音 descriptors) ===

const UU1 = '声音在发抖。';
const UU2 = '声音在颤动。';
const UU3 = '声音在发颤。';
const UU4 = '声音在颤。';
const UU5 = '声音很低。';
const UU6 = '声音变了。';
const UU7 = '声音很稳。';
const UU8 = '声音有点哑。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;