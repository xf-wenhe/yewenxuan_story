const fs = require('fs');
const path = require('path');

// === R88 SOURCES (8 patterns) ===

const BB1 = '声音沙哑得十分严重。';
const BB2 = '声音沙哑得不自然。';
const BB3 = '声音沙哑得几乎听不出。';
const BB4 = '声音格外沙哑。';
const BB5 = '声音沙哑得严重。';
const BB6 = '声音嘶哑得异乎寻常。';
const BB7 = '声音像被碎石擦过。';
const BB8 = '声音像砂纸磨过一般。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
