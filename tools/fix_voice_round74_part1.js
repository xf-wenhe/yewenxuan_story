const fs = require('fs');
const path = require('path');

// === R74 SOURCES (8 patterns) ===

const MM1 = '声音在身后响起。';
const MM2 = '声音抖得没完。';
const MM3 = '声音一直颤动。';
const MM4 = '声音压到了最低水平。。';
const MM5 = '声音压到不能再压。';
const MM6 = '声音平直得没有一丝颤动。';
const MM7 = '声音压到最低点。。';
const MM8 = '声音颤动了。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;