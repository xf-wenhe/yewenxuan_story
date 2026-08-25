const fs = require('fs');
const path = require('path');

// === R47 SOURCES (8 patterns: 声音 + 赵大嘴 voice/follow + 时间) ===

const KK1 = '声音轻得几乎听不到。';
const KK2 = '赵大嘴说话时嗓音沙哑。';
const KK3 = '赵大嘴排在最后面。';
const KK4 = '赵大嘴排在队伍最后面。';
const KK5 = '赵大嘴排在队伍的最后面。';
const KK6 = '赵大嘴跟在队伍后面。';
const KK7 = '他还需要一段时间才能做出判断。';
const KK8 = '他还需要一段时间才能理出头绪。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;