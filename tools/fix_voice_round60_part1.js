const fs = require('fs');
const path = require('path');

// === R60 SOURCES (8 patterns) ===

const XX1 = '声音停了。';
const XX2 = '声音很微弱。';
const XX3 = '声音在石室中回响。';
const XX4 = '声音有些哑。';
const XX5 = '声音轻得颤。';
const XX6 = '声音极轻细。';
const XX7 = '声音压得更低。';
const XX8 = '声音干涩而沙哑。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;