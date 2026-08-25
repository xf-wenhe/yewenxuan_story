const fs = require('fs');
const path = require('path');

// === R59 SOURCES (8 patterns) ===

const WW1 = '声音还在耳边回响，即使已经没人说话了。';
const WW2 = '声音停了一下。';
const WW3 = '声音说。';
const WW4 = '声音在0429信号中传来。';
const WW5 = '声音从旁边传来。';
const WW6 = '声音像是被砂砾磨过。';
const WW7 = '声音很轻，很稳。';
const WW8 = '声音异常沙哑。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;