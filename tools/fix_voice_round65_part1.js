const fs = require('fs');
const path = require('path');

// === R65 SOURCES (8 patterns) ===

const CC1 = '声音传来说道。';
const CC2 = '声音带着紧绷感。';
const CC3 = '声音有些，软。';
const CC4 = '声音有些发紧。';
const CC5 = '声音有些含糊。';
const CC6 = '声音发颤。';
const CC7 = '声音更轻了。';
const CC8 = '声音没有起伏。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;