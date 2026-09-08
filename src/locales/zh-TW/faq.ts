/** Reviewed Traditional Chinese summaries of the pinned MSIME-Docs FAQ.
 * Update together with the source revision; links retain original issue evidence.
 */
export const faqSourceSha256 = '804da9e1a4a6dc89c4b864d7e02d2264ec1119992606a9bd88557494ad2d44fd';
export const faqRevision = '2026-09-08';
export const questions = [
  { title: '輸入漢字時顯示方框，應該安裝什麼字型？', category: '字型與顯示', answer: '先區分是候選文字缺字，還是只有工具列圖示顯示方框。候選漢字缺字時，請在外觀設定選擇能涵蓋該字的中文補充字型；若尚未安裝，先安裝後再重新選擇。主字型主要用於西文，不能取代中文補充字型。若只有文字送入某個應用程式後才出現方框，應檢查該程式的字型設定。仍無法解決時，請附上具體字元、字型名稱及截圖。', source: '/docs/windows/' },
  { title: 'Windows 10 工具列圖示變成方框，但按鈕仍能點擊？', category: '字型與顯示', answer: '歷史回報 #232 涉及 Direct2D 工具列使用的 Segoe Fluent Icons 字型。它與候選漢字的字型不同。可依原始回報，將外觀設定的介面繪製方式改為 WebView2，儲存後重新啟動輸入法作為暫時處理方式。字型請從微軟官方來源取得；安裝字型不保證補齊所有圖示。該問題在 2026-09-08 核對時仍未結案。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/232' },
  { title: '候選視窗太大、字太小，或每頁候選數量不合習慣？', category: '字型與顯示', answer: '可在外觀設定調整候選字級、預編輯文字字級、每頁候選數量及排列方向。候選數量設定影響分頁，不會減少全部候選結果。若調整後仍被遮住，請記錄縮放比例、解析度與介面繪製方式，不要反覆刪除詞庫。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/15' },
  { title: '安裝後無法切換輸入法，或設定視窗開啟後立即關閉？', category: '安裝與啟動', answer: '先檢查 Microsoft Visual C++ x64 執行階段。Server 與設定程式為 64 位元，只有 x86 版本並不足夠。可從微軟官方來源安裝或修復 x64 版本，再重新啟動 Windows。若仍有問題，請保存錯誤訊息及事件檢視器紀錄，不要先清空使用者資料。', source: '/docs/windows/' },
  { title: '安裝完成後，在哪裡開啟設定？', category: '安裝與啟動', answer: '按 Win + Space 切換至水杉輸入法，再於語言列的輸入法圖示按右鍵，或使用懸浮工具列的設定入口。首次安裝後若沒有圖示，可先重新啟動 Windows。歷史回報 #30 曾藉此恢復，但不代表所有設定問題都有相同原因；若視窗立即關閉，請先檢查執行階段。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/30' },
  { title: '候選視窗或設定頁空白，與文字顯示方框是同一個問題嗎？', category: '安裝與啟動', answer: '應分開排查。整個視窗空白或未出現時，先確認 Metasequoia IME Server 正在執行，再檢查 Microsoft Edge WebView2 Runtime 與安裝版本的發布說明。只有個別字元顯示方框時，優先檢查字型。若只在特定程式發生，可先用記事本比較，回報時附上程式版本及是否以系統管理員身分執行。', source: '/docs/windows/' },
  { title: '設定頁找不到 imesettings 的伺服器 IP，需要修改 DNS 嗎？', category: '安裝與啟動', answer: 'imesettings 是本機設定頁的資源位址，不應當作公開網站處理。#94 是舊版本的本機資源載入問題，當時沒有確認適用所有環境的修復方式。先確認安裝完整並依發布說明更新；若仍發生，記錄安裝路徑、版本、代理設定及錯誤截圖，不要套用來源不明的 hosts 或 DNS 修改方案。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/94' },
  { title: '輸入 fangan 時，為什麼先顯示 fan\'gan，而不是「方案」？', category: '輸入與快捷鍵', answer: '這是拼音切分歧義。可輸入 fang、半形單引號，再輸入 an，明確指定為 fang\'an。歷史回報 #41 說明「方案」已加入備選，但不代表所有歧義都改為最長匹配。新版若仍找不到，請附完整輸入字串、版本與候選截圖。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/41' },
  { title: '常用字突然找不到，需要刪除使用者詞庫嗎？', category: '輸入與快捷鍵', answer: '先更新並重新測試，不要直接刪除詞庫。#36 曾出現重新安裝後暫時恢復、之後又復發的情況。若目前版本仍有問題，請記錄輸入編碼、缺少的字、實際候選及近期詞庫操作。重設前先備份；使用者詞庫可能含個人內容，不要直接公開上傳。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/36' },
  { title: '英文單字置頂後，為什麼仍排在中文後面？', category: '輸入與快捷鍵', answer: '先確認目前是中文模式的中英混合輸入，還是獨立英文候選模式。中文混合輸入的英文候選預設不占中文首位，可按 Ctrl + Shift + E 切換至獨立英文候選模式比較。#110 也記錄了手動置頂問題，不能僅因回報已結案便認定所有情況都已修復。仍發生時請附編碼、候選順序與目前模式。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/110' },
  { title: 'Git Bash 中按 Shift 無法切換中英文？', category: '輸入與快捷鍵', answer: '先確認 Git Bash 是透過 mintty 執行，還是在 Windows Terminal 中執行。#32 的歷史修復針對 mintty.exe，不能直接套用到其他終端機。請用目前版本重新測試，並附上終端機名稱、版本與切換鍵設定；也可改用其他支援的切換鍵比較。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/32' },
  { title: '中英文狀態自行切回，或快捷鍵與其他軟體衝突？', category: '輸入與快捷鍵', answer: '先檢查輸入法的中英文切換鍵，關閉衝突的 Shift、Ctrl 或 Ctrl + Alt + Space 項目。Ctrl + Space 則由 Windows 的輸入語言快速鍵設定管理。其他自動切換或鍵盤工具也可能造成衝突；#16 中的 Capsense 案例只是其中一種原因。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/16' },
  { title: '可以使用微軟雙拼，或固定輸出英文標點嗎？', category: '輸入與快捷鍵', answer: 'Windows 版可在輸入設定選擇微軟雙拼，也可設定固定使用英文標點。固定英文與固定中文標點不能同時啟用；啟用後不再隨中英文模式改變。若安裝版本沒有這些選項，請對照發布說明與指南。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/31' },
  { title: '可以輸入一個詞，只取其中一個字嗎？', category: '輸入與快捷鍵', answer: '可在 Windows 輸入設定開啟「以词定字」。選中候選詞後，按 [ 輸入第一個漢字，按 ] 輸入最後一個漢字。此功能只取首字或末字，不能直接選取較長詞語中間的字。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/14' },
  { title: '候選詞的英文解釋不正確，可以自行修正嗎？', category: '翻譯與資料', answer: 'Windows 版可使用本機 custom_translations.txt 覆寫檔。檔案需使用 UTF-8，每行以真正的 Tab 分隔原詞與解釋，不能用空白代替。相同原詞以最後一筆為準，儲存後重新啟動輸入法。路徑、範例與格式請查看原始說明。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/75' },
  { title: '快捷片語可以批次匯入嗎？', category: '翻譯與資料', answer: '可在實用功能的快捷片語頁使用批次匯入。資料需為 UTF-8 純文字，不加欄位標題，每行以真正的 Tab 分隔編碼、片語與權重。其他輸入法的詞庫不能直接當作此格式使用；如回傳錯誤行號，請檢查欄位數與分隔字元。', source: 'https://github.com/metasequoiaime/MSIME-Windows/issues/29' },
  { title: '離線時還能輸入嗎？雲端功能失敗怎麼辦？', category: '翻譯與資料', answer: '本機詞庫輸入仍可使用。先關閉出問題的連線功能，確認一般輸入正常，再檢查服務位址、模型、憑證與網路狀態。需要離線使用時，請關閉雲端候選字、AI 聯想、線上翻譯、雲端語音辨識及文字潤飾等功能。回報錯誤時請遮住 Token、SecretKey 等憑證。', source: '/privacy/' },
  { title: '仍然無法解決，回報時要提供什麼？', category: '翻譯與資料', answer: '請提供輸入法與作業系統版本、輸入方案、操作步驟、預期及實際結果，並附截圖。相容性問題請補上應用程式版本與權限；顯示問題請補上字型、縮放比例與介面繪製方式。不要公開上傳完整詞庫、設定檔或服務憑證，安全漏洞請使用私下回報管道。', source: '/zh-TW/feedback/' },
] as const;
