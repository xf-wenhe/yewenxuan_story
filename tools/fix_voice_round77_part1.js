const fs = require('fs');
const path = require('path');

// === R77 SOURCES (8 patterns) ===

const PP1 = '声音平直而稳。';
const PP2 = '声音内容是：爸爸。';
const PP3 = '声音平滑。';
const PP4 = '声音很紧。';
const PP5 = '声音很急。';
const PP6 = '声音低哑。';
const PP7 = '声音沉。';
const PP8 = '声音很轻，在笑。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;