const fs = require('fs');
const path = require('path');

// === R87 SOURCES (8 patterns) ===

const AA1 = '声音压得更沉。。';
const AA2 = '声音细得让人费力才能听清。';
const AA3 = '声音轻得几乎听不见。';
const AA4 = '声音很轻，笑着。';
const AA5 = '声音小到听不见。';
const AA6 = '声音很轻在笑。';
const AA7 = '声音停了一下。';
const AA8 = '声音极哑。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
