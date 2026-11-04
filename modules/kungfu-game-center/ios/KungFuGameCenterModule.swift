import ExpoModulesCore
import GameKit
import UIKit

public final class KungFuGameCenterModule: Module {
  private var authenticating = false
  private var dashboardDelegate: DashboardDelegate?

  public func definition() -> ModuleDefinition {
    Name("KungFuGameCenter")
    Events("onAuthChange")

    AsyncFunction("authenticateAsync") { (promise: Promise) in
      if GKLocalPlayer.local.isAuthenticated {
        promise.resolve(self.playerStatus())
        return
      }
      guard !self.authenticating else {
        promise.reject("BUSY", "Game Center sign-in is already open.")
        return
      }
      self.authenticating = true
      var resolved = false
      GKLocalPlayer.local.authenticateHandler = { [weak self] controller, error in
        DispatchQueue.main.async {
          guard let self else { return }
          if let controller {
            self.sendEvent("onAuthChange", ["presenting": true])
            guard let parent = self.presenter(), parent.presentedViewController == nil else {
              self.authenticating = false
              if !resolved { resolved = true; promise.reject("BUSY", "Another screen is open. Try Game Center again from the home screen.") }
              return
            }
            parent.present(controller, animated: true)
            return
          }
          self.authenticating = false
          let status = self.playerStatus()
          self.sendEvent("onAuthChange", status)
          if !resolved {
            resolved = true
            if let error { promise.reject("SIGN_IN", error.localizedDescription) }
            else { promise.resolve(status) }
          }
        }
      }
    }.runOnQueue(.main)

    AsyncFunction("reportAsync") { (playerID: String, values: [String: Double], promise: Promise) in
      guard GKLocalPlayer.local.isAuthenticated, GKLocalPlayer.local.gamePlayerID == playerID else {
        promise.reject("SIGNED_OUT", "Game Center player changed."); return
      }
      // Merge against Apple's progress so an old local save cannot regress it.
      GKAchievement.loadAchievements { existing, error in
        if let error { promise.reject("LOAD", error.localizedDescription); return }
        DispatchQueue.main.async {
          guard GKLocalPlayer.local.isAuthenticated, GKLocalPlayer.local.gamePlayerID == playerID else {
            promise.reject("SIGNED_OUT", "Game Center player changed."); return
          }
          let known = Dictionary((existing ?? []).map { ($0.identifier, $0.percentComplete) }, uniquingKeysWith: max)
          let updates = values.compactMap { id, value -> GKAchievement? in
            guard id.hasPrefix("com.mablic.kungfufisher.achievement."), value.isFinite else { return nil }
            let progress = min(100, max(0, value))
            guard progress > (known[id] ?? 0) else { return nil }
            let achievement = GKAchievement(identifier: id)
            achievement.percentComplete = progress
            achievement.showsCompletionBanner = progress >= 100
            return achievement
          }
          guard !updates.isEmpty else { promise.resolve(true); return }
          GKAchievement.report(updates) { error in
            if let error { promise.reject("REPORT", error.localizedDescription) }
            else { promise.resolve(true) }
          }
        }
      }
    }.runOnQueue(.main)

    AsyncFunction("showAchievementsAsync") { (promise: Promise) in
      guard GKLocalPlayer.local.isAuthenticated else {
        promise.reject("SIGNED_OUT", "Sign in to Game Center first."); return
      }
      guard let parent = self.presenter(), parent.presentedViewController == nil else {
        promise.reject("BUSY", "Another screen is open."); return
      }
      let controller = GKGameCenterViewController(state: .achievements)
      self.dashboardDelegate = DashboardDelegate { [weak self] in
        self?.dashboardDelegate = nil
        promise.resolve(true)
      }
      controller.gameCenterDelegate = self.dashboardDelegate
      parent.present(controller, animated: true)
    }.runOnQueue(.main)
  }

  private func playerStatus() -> [String: Any] {
    let player = GKLocalPlayer.local
    return ["authenticated": player.isAuthenticated, "presenting": false,
      "playerID": player.isAuthenticated ? player.gamePlayerID : "",
      "alias": player.isAuthenticated ? player.displayName : ""]
  }

  private func presenter() -> UIViewController? {
    guard let scene = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene }).first(where: { $0.activationState == .foregroundActive }),
      let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController else { return nil }
    // Never present over another SDK's consent or ad controller.
    return root
  }
}

private final class DashboardDelegate: NSObject, GKGameCenterControllerDelegate {
  private let finish: () -> Void
  init(finish: @escaping () -> Void) { self.finish = finish }
  func gameCenterViewControllerDidFinish(_ controller: GKGameCenterViewController) {
    controller.dismiss(animated: true, completion: finish)
  }
}
