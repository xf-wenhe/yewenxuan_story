const fs = require('fs');
const path = require('path');

// === R80 SOURCES (8 patterns) ===

const SS1 = '声音带着涩意。';
const SS2 = '声音在他脑海中响起。';
const SS3 = '声音放轻了。';
const SS4 = '声音抖着发颤。';
const SS5 = '声音压得极细。';
const SS6 = '声音又轻了一些。';
const SS7 = '声音极稳。';
const SS8 = '声音打破了沉默。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;