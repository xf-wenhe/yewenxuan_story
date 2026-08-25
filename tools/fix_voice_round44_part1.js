const fs = require('fs');
const path = require('path');

// === R44 SOURCES (8 patterns: flat-voice recycled + 赵大嘴 follow + shadow recycled) ===

const HH1 = '声调从头到尾像一条直线。';
const HH2 = '语调平得像一潭死水，没有涟漪。';
const HH3 = '声音冷硬而空洞，没有半分感情。';
const HH4 = '赵大嘴紧随其后。';
const HH5 = '赵大嘴跟在他身后不远处。';
const HH6 = '影子在光照中摇晃，被遗忘的记忆在颤动。';
const HH7 = '光里晃动的影子持续抖动，被遗忘的东西在震颤。';
const HH8 = '影子在光照中漂浮，被遗忘的记忆在流转。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;