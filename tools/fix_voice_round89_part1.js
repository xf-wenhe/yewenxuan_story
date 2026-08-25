const fs = require('fs');
const path = require('path');

// === R89 SOURCES (8 patterns) ===

const CC1 = '声音像砂纸擦过一般。';
const CC2 = '声音发涩又发哑。';
const CC3 = '声音糙得厉害。';
const CC4 = '声音粗糙而沙哑。';
const CC5 = '声音粗得像砂石擦过。';
const CC6 = '声音像被砂纸磨过一样。';
const CC7 = '声音干哑而涩。';
const CC8 = '声音发涩。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
