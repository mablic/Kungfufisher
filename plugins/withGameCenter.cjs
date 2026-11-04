const { withEntitlementsPlist } = require('@expo/config-plugins');
module.exports = function withGameCenter(config) {
  return withEntitlementsPlist(config, mod => {
    mod.modResults['com.apple.developer.game-center'] = true;
    return mod;
  });
};
