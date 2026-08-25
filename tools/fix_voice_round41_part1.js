const fs = require('fs');
const path = require('path');

// === R41 SOURCES (8 patterns: 影子 + 韩冰 + 频率 + 赵大嘴/声音) ===

const EE1 = '频率比之前快了。';
const EE2 = '韩冰说话，音量压得很低。';
const EE3 = '韩冰的嗓音压低了。';
const EE4 = '那些影子在光里晃动，是被遗忘的东西在跳动。';
const EE5 = '那些影子在光里晃动，是被遗忘的东西在颤抖。';
const EE6 = '那些影子在光里晃动，是被遗忘的东西在游动。';
const EE7 = '那些影子在光里晃动，是被遗忘的东西在翻涌。';
const EE8 = '赵大嘴的声音很平。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;