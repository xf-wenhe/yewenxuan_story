const fs = require('fs');
const path = require('path');

// === R37 SOURCES (8 patterns: recycled alternatives + character actions + 0429) ===

const AA1 = '赵大嘴的心脏在跳。';
const AA2 = '叶文轩的脑子在快速转动。';
const AA3 = '叶文轩的后背窜过一道凉意。';
const AA4 = '叶文轩沉默了。';
const AA5 = '他不知道从哪里开始说，也不知道该说什么。';
const AA6 = '记忆像破碎的镜片，每一片都映着不同的画面。';
const AA7 = '空气仿佛凝固了一般，谁也没有再说话。';
const AA8 = '0429在手腕上振动。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;