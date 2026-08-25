const fs = require('fs');
const path = require('path');

// === R42 SOURCES (8 patterns: time phrases + 赵大嘴跟在后面 + frequency recycled) ===

const FF1 = '他还需要片刻才能想清楚。';
const FF2 = '他还需要更多的时间来理清思路。';
const FF3 = '他还需要短暂的时间来做决定。';
const FF4 = '他还需要一会儿才能把话说完。';
const FF5 = '赵大嘴跟在后面。';
const FF6 = '节奏比之前明显加速了。';
const FF7 = '频率比之前提升了一个档次。';
const FF8 = '这个频率比之前的要高。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;