const items = {
  // Patterns
  heart_tremble: '心头一颤',
  heart_tighten: '心头一紧',
  heart_sank:    '心头一沉',
  heart_surge:   '心头涌起',
  heart_flash:   '心头闪过',
  brain_flash:   '脑中闪过',
  heart_stir:    '心头一动',
  heart_sweep:   '心头掠过',
  heart_pause:   '心头一滞',
  mind_flash:    '心中闪过',
  brain_appear:  '脑中浮现',
  surge_to_heart:'涌上心头',
  heart_choked:  '心头一窒',
  heart_astring: '心头一涩',
  heart_burst:   '心头一阵',
  mind_appear:   '心中浮现',
  inside_appear: '心里浮现',
  mind_surge:    '心中涌起',
  brow_lock:     '眉头紧锁',
  palm_sweat:    '掌心全是汗',
};
for (const [k, v] of Object.entries(items)) {
  const codes = [...v].map(c => c.charCodeAt(0));
  console.log(k + ' = ' + JSON.stringify(codes) + '  ->  ' + v);
}