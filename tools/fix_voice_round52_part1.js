const fs = require('fs');
const path = require('path');

// === R52 SOURCES (8 patterns: volume + time) ===

const PP1 = '音量低到几乎无声。';
const PP2 = '音量低得几乎听不到。';
const PP3 = '音量低到几乎听不到。';
const PP4 = '音量轻得几乎听不清。';
const PP5 = '音量轻得几乎消失。';
const PP6 = '他还需要一点时间才能弄懂。';
const PP7 = '他还需要些时间。';
const PP8 = '他还需要些时间才能弄通。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;