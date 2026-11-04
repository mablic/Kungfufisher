import ExpoModulesCore
import StoreKit
import UIKit

public final class KungFuStoreUpdateModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KungFuStoreUpdate")
    AsyncFunction("infoAsync") { () -> [String: Any] in
      let bundle = Bundle.main
      let english = Locale(identifier: "en")
      let alpha3 = SKPaymentQueue.default().storefront?.countryCode
      let regionName = alpha3.flatMap { english.localizedString(forRegionCode: $0) }
      let country = regionName.flatMap { name in
        Locale.isoRegionCodes.first { english.localizedString(forRegionCode: $0) == name }
      } ?? Locale.current.region?.identifier ?? "US"
      return [
        "version": bundle.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "",
        "build": bundle.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "",
        "country": country,
        "systemVersion": UIDevice.current.systemVersion,
        "sandbox": bundle.appStoreReceiptURL?.lastPathComponent == "sandboxReceipt"
      ]
    }
  }
}
