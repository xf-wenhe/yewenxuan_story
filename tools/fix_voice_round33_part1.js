const fs = require('fs');
const path = require('path');

// === R33 SOURCES (8 patterns: character voice descriptors + heart + mannerism) ===

const W1 = '叶文轩的声音很平';
const W2 = '赵大嘴的声音很轻';
const W3 = '叶文轩的声音很轻';
const W4 = '赵大嘴的声音很哑';
const W5 = '韩冰的声音很轻';
const W6 = '像是在确认什么';
const W7 = '叶文轩的心脏跳了一下';
const W8 = '叶文轩的心脏有些发堵';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;