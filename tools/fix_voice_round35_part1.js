const fs = require('fs');
const path = require('path');

// === R35 SOURCES (8 patterns: recycled R33/R29 alternatives) ===

const Y1 = '叶文轩说话，音量压得很低。';
const Y2 = '叶文轩开口，声音低得几乎听不见。';
const Y3 = '叶文轩的嗓音压低了。';
const Y4 = '叶文轩用极低的音量说话。';
const Y5 = '那句话沉进了他心里，沉得极深。';
const Y6 = '那句话沉进了他心里，留在了最深处。';
const Y7 = '夜里的风比他想象的要冷一些，吹在脸上有些刺骨。';
const Y8 = '他低头看了看自己的手，手还在发抖。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;