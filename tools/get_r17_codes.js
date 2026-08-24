const fs = require('fs');
// Compute charCodes for all Round 17 patterns and alternatives
const items = {
  // Patterns
  joints_white: '指节发白',
  joints_pale:  '指节泛白',
  chest_dull:   '胸口闷',
  corner_slightly: '嘴角微微',
  corner_gently:  '嘴角轻轻',
  before_appear:  '眼前浮现',
  nail_squeeze:   '指甲掐',
  palm_seep:      '掌心渗出',
  voice_tremble:  '声音有些颤抖',
  // Alternatives
  jw1: '指节咬紧', jw2: '指节生疼', jw3: '指节发僵',
  jw4: '指关节发白', jw5: '指甲陷进肉里', jw6: '手指攥得发僵',
  jp1: '指节咬紧', jp2: '指节生疼', jp3: '指关节泛白',
  jp4: '指甲陷进肉里', jp5: '手指攥得发僵',
  cd1: '心口堵', cd2: '心口紧', cd3: '胸腔堵',
  cd4: '胸口发堵', cd5: '胸口发紧', cd6: '心口发沉',
  cs1: '嘴角抽动', cs2: '嘴角一抽', cs3: '嘴角动了动', cs4: '嘴角扯了扯',
  cg1: '嘴角抽动', cg2: '嘴角一抽', cg3: '嘴角动了动', cg4: '嘴角扯了扯',
  ba1: '眼前出现', ba2: '眼前展开', ba3: '眼前显现', ba4: '眼前呈现', ba5: '眼前映出',
  ns1: '指甲抠', ns2: '指甲抓', ns3: '指甲掐入', ns4: '指甲掐进',
  ps1: '掌心冒出', ps2: '掌心冒汗', ps3: '掌心发汗', ps4: '掌心出细汗',
  vt1: '声音发颤', vt2: '声音颤抖', vt3: '声音发抖', vt4: '声音抖起来',
};
for (const [k, v] of Object.entries(items)) {
  const codes = [...v].map(c => c.charCodeAt(0));
  console.log(k + ' = ' + JSON.stringify(codes) + '  ->  ' + v);
}