const { withAppDelegate, withInfoPlist } = require("@expo/config-plugins");

const BEGIN = "// BEGIN Kung Fu Fisher non-tracking ads";
const END = "// END Kung Fu Fisher non-tracking ads";
function configureAppDelegate(source) {
  // Replace our own block on repeated prebuilds without changing other plugins.
  source = source.replace(
    /\n[ \t]*\/\/ BEGIN Kung Fu Fisher non-tracking ads[\s\S]*?\/\/ END Kung Fu Fisher non-tracking ads\n?/g,
    "\n",
  );
  if (!/^import GoogleMobileAds\s*$/m.test(source))
    source = `import GoogleMobileAds\n${source}`;
  const launch = /(didFinishLaunchingWithOptions[\s\S]*?\)\s*->\s*Bool\s*\{)/;
  if (!launch.test(source))
    throw new Error(
      "Cannot configure non-tracking ads: Swift launch method not found.",
    );
  return source.replace(
    launch,
    `$1\n    ${BEGIN}\n    // Configure the native SDK before React/UMP can initialize or load any ad.\n    // The RN library's JS first-party-ID setter is a no-op in version 17.4.0.\n    MobileAds.shared.requestConfiguration.setPublisherFirstPartyIDEnabled(false)\n    MobileAds.shared.requestConfiguration.publisherPrivacyPersonalizationState = .disabled\n    ${END}\n`,
  );
}
function stripTrackingDescription(plist) {
  delete plist.NSUserTrackingUsageDescription;
  return plist;
}
function withNonTrackingAds(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults = stripTrackingDescription(mod.modResults);
    return mod;
  });
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== "swift")
      throw new Error("Non-tracking ads requires a Swift AppDelegate.");
    mod.modResults.contents = configureAppDelegate(mod.modResults.contents);
    return mod;
  });
}
module.exports = withNonTrackingAds;
module.exports.configureAppDelegate = configureAppDelegate;
module.exports.stripTrackingDescription = stripTrackingDescription;
