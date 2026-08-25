const fs = require('fs');
const path = require('path');

// === R83 SOURCES (8 patterns) ===

const WW1 = '声音陡然高了起来。';
const WW2 = '声音拔高了。';
const WW3 = '声音稍抖。';
const WW4 = '声音清醒了一些。';
const WW5 = '声音抖动了。';
const WW6 = '声音细得像蚊子。';
const WW7 = '声音毫无波澜。';
const WW8 = '声音微弱得近乎无声。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;