# 下載水杉輸入法

選擇作業系統後，依電腦架構下載安裝套件。各平台獨立發布，版本號不可直接比較；請先閱讀該版本的發布說明。

## Windows

適用於 Windows 10 和 Windows 11。下載安裝程式後，核對 SHA256 與發布頁的簽章說明，再依安裝精靈完成安裝。安裝後可按 `Win + Space` 切換至水杉輸入法。

若安裝後無法使用，請檢查 Microsoft Visual C++ x64 執行階段。x86 版本不能取代 x64 版本，下載與修復方式見[Windows 使用指南（簡體中文）](/docs/windows/)。

## macOS

適用於 macOS 12 以上。Universal 套件適用於 Apple Silicon 與 Intel Mac。PKG 可直接開啟安裝；一般 ZIP 解壓縮後，依包內的 `Install.command` 與發布說明操作。手動安裝不要選擇供自動更新使用的 `-update.zip`。

若未出現輸入法，可到系統設定的鍵盤與輸入方式選項中新增水杉。不同 macOS 版本的選項名稱可能不同。[查看 macOS 使用指南（簡體中文）](/docs/macos/)。

## Linux

請先確認處理器架構與發行版。`.deb` 通常用於 Debian／Ubuntu 系列，`.rpm` 用於相應的 RPM 發行版；不要只依副檔名判斷相容性，仍需核對發布說明中的依賴條件。

安裝後依指南重新啟動 IBus，再新增「Metasequoia IME」輸入方式。[查看 Linux 使用指南（簡體中文）](/docs/linux/)。

## 核對下載檔案

各安裝套件下方提供可用的 SHA256 校驗值。計算本機檔案的值，並與官方發布值比較：

- Windows PowerShell：`Get-FileHash .\檔案名稱 -Algorithm SHA256`
- macOS：`shasum -a 256 檔案名稱`
- Linux：`sha256sum 檔案名稱`

請將「檔案名稱」換成實際下載檔名；路徑含空白時請加上引號。SHA256 用於比對檔案，不等同於程式碼簽章或 Apple 公證。遇到安全提示時，先核對來源與發布說明。

## 安裝前先了解

Windows 和 Linux 的雲端候選字預設開啟；AI 聯想、語音辨識等功能也可能使用第三方服務。請查看[隱私說明（簡體中文）](/privacy/)。

遇到安裝問題可先查[常見問題](/zh-TW/faq/)，或[提交回報](/zh-TW/feedback/)。
