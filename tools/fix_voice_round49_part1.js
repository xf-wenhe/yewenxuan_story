const fs = require('fs');
const path = require('path');

// === R49 SOURCES (8 patterns: time + brain + 韩冰 voice + face + 赵大嘴 voice) ===

const MM1 = '他需要再一些时间。';
const MM2 = '叶文轩的脑子在拼命思考。';
const MM3 = '韩冰开口，声音低得几乎听不见。';
const MM4 = '韩冰用极低的音量说话。';
const MM5 = '赵大嘴出声，';
const MM6 = '叶文轩的脸很平，';
const MM7 = '赵大嘴的声音有些平，';
const MM8 = '叶文轩的声音有些平，';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;