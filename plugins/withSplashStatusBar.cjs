const {withAndroidStyles, AndroidConfig} = require('@expo/config-plugins');
module.exports = config => withAndroidStyles(config, mod => {
  for (const name of ['android:windowLightStatusBar', 'android:windowLightNavigationBar']) {
    mod.modResults = AndroidConfig.Styles.assignStylesValue(mod.modResults, {
      add: true, name, value: 'false', parent: {name: 'Theme.App.SplashScreen'},
    });
  }
  return mod;
});
