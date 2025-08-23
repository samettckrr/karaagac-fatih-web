//import UIKit
import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {
  override func viewDidLoad() {
    super.viewDidLoad()

    #if DEBUG
    // Scheme'de verdiğimiz DEMO=1 mi?
    let isDemo = ProcessInfo.processInfo.environment["DEMO"] == "1"

    if isDemo, let wv = self.bridge?.webView {
      // Sayfa daha yüklenmeden DEMO bayrağını JS tarafına enjekte et
      let js = "window.__DEMO_FROM_SCHEME = true;"
      let script = WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
      wv.configuration.userContentController.addUserScript(script)

      // Güvenli olması için bir kez yenile (script baştan çalışsın)
      wv.reload()
    }
    #endif
  }
}
