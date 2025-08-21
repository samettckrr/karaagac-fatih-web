# iOS Icon & Splash Kaynakları

- icon.png → 1024x1024, köşesiz, şeffaflık YOK.
- splash.png → 2732x2732, düz (solid) arka plan + merkezde logo, şeffaflık YOK.

**Ne zaman çalıştırılacak (EN SON):**
1) `npm i -D @capacitor/assets`
2) `npx @capacitor/assets generate --ios`
3) `npx cap sync ios`

Bu üç adımı tüm eksikleri bitirdikten sonra çalıştır.
