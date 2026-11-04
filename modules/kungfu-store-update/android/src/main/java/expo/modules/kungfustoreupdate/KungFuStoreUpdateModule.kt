package expo.modules.kungfustoreupdate

import android.app.Activity
import android.os.Build
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KungFuStoreUpdateModule : Module() {
  private var manager: AppUpdateManager? = null
  private var pending: Promise? = null
  private val requestCode = 49172
  private val listener = InstallStateUpdatedListener { state ->
    if (state.installStatus() == InstallStatus.DOWNLOADED)
      sendEvent("onDownloaded", mapOf("downloaded" to true))
  }
  override fun definition() = ModuleDefinition {
    Name("KungFuStoreUpdate")
    Events("onDownloaded")
    OnCreate {
      appContext.reactContext?.let { context ->
        manager = AppUpdateManagerFactory.create(context)
        manager?.registerListener(listener)
      }
    }
    OnDestroy {
      manager?.unregisterListener(listener)
      pending?.reject("CLOSED", "Update screen closed", null); pending = null
    }
    OnActivityDestroys { pending?.resolve("cancelled"); pending = null }
    OnActivityResult { _, result ->
      if (result.requestCode == requestCode) {
        pending?.resolve(if (result.resultCode == Activity.RESULT_OK) "accepted" else "cancelled")
        pending = null
      }
    }
    AsyncFunction("checkAsync") { promise: Promise ->
      val context = appContext.reactContext
      if (context == null) { promise.resolve(mapOf("available" to false)); return@AsyncFunction }
      val pm = context.packageManager
      val installed = pm.getPackageInfo(context.packageName, 0)
      @Suppress("DEPRECATION")
      val buildCode = if (Build.VERSION.SDK_INT >= 28) installed.longVersionCode else installed.versionCode.toLong()
      @Suppress("DEPRECATION")
      val fromPlay = pm.getInstallerPackageName(context.packageName) == "com.android.vending"
      if (!fromPlay || manager == null) { promise.resolve(mapOf("available" to false)); return@AsyncFunction }
      manager!!.appUpdateInfo.addOnSuccessListener { info ->
        promise.resolve(mapOf(
          "available" to (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE),
          "downloaded" to (info.installStatus() == InstallStatus.DOWNLOADED),
          "flexible" to info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE),
          "version" to installed.versionName,
          "build" to buildCode.toString(),
          "latestBuild" to info.availableVersionCode().toString()
        ))
      }.addOnFailureListener { promise.reject("CHECK_FAILED", it.message, it) }
    }
    AsyncFunction("startAsync") { promise: Promise ->
      val activity = appContext.currentActivity
      val updateManager = manager
      if (activity == null || updateManager == null || pending != null) {
        promise.resolve("unavailable"); return@AsyncFunction
      }
      pending = promise
      // AppUpdateInfo is single-use: always obtain a fresh instance after user consent.
      updateManager.appUpdateInfo.addOnSuccessListener { info ->
        if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE || !info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
          pending?.resolve("unavailable"); pending = null
        } else try {
          val started = updateManager.startUpdateFlowForResult(info, activity,
            AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build(), requestCode)
          if (!started) { pending?.resolve("unavailable"); pending = null }
        } catch (error: Exception) { pending?.reject("START_FAILED", error.message, error); pending = null }
      }.addOnFailureListener { pending?.reject("START_FAILED", it.message, it); pending = null }
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("completeAsync") { promise: Promise ->
      val updateManager = manager
      if (updateManager == null) { promise.resolve(false); return@AsyncFunction }
      updateManager.completeUpdate().addOnSuccessListener { promise.resolve(true) }
        .addOnFailureListener { promise.reject("COMPLETE_FAILED", it.message, it) }
    }.runOnQueue(Queues.MAIN)
  }
}
