const fs = require('fs');
const path = require('path');

// === R34 SOURCES (8 patterns: recycled R33 alternatives that became high-freq) ===

const X1 = '叶文轩开口，语调没有任何起伏。';
const X2 = '叶文轩说话不带任何情绪。';
const X3 = '叶文轩的声音平淡无波。';
const X4 = '叶文轩开口，语气毫无波澜。';
const X5 = '赵大嘴开口，声音低得几乎听不见。';
const X6 = '赵大嘴说话，音量压得很低。';
const X7 = '赵大嘴的嗓音压低了。';
const X8 = '赵大嘴用极低的音量说话。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;