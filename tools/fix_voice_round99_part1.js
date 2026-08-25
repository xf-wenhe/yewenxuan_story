const fs = require('fs');
const path = require('path');

const MM1 = '赵大嘴的声音颤抖着，"0428是我的名字。';
const MM2 = '叶文轩的声音。"深渊回声。12个半小时后激活。';
const MM3 = '叶文轩的声音，"0415碎片是钥匙。';
const MM4 = '韩冰开口，声音轻得快要模糊。';
const MM5 = '韩冰开口，音量低得几乎不可闻。';
const MM6 = '韩冰开口，声音轻得几近无形。';
const MM7 = '声音。有人在我脑子里说话。说';
const MM8 = '他还需要再久一些。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
