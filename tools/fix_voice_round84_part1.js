const fs = require('fs');
const path = require('path');

// === R84 SOURCES (8 patterns) ===

const XX1 = '他还需要些时间才行。。';
const XX2 = '他还需要短暂的时间才能说完。。';
const XX3 = '他还需要一段时间。。';
const XX4 = '他还需要点时间。。';
const XX5 = '他还需要一些时间才能把话说完整。。';
const XX6 = '他还需要片刻才能把话讲完。。';
const XX7 = '他还需要些时间。。';
const XX8 = '他还需要短暂的时间来思考。。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
