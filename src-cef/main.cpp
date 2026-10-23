#include <windows.h>
#include <shlobj.h>
#include <knownfolders.h>
#include <string>
#include <sstream>
#include <iomanip>
#include <vector>
#include <list>

#include "include/cef_app.h"
#include "include/cef_client.h"
#include "include/cef_command_line.h"
#include "include/cef_display_handler.h"
#include "include/cef_download_handler.h"
#include "include/cef_keyboard_handler.h"
#include "include/cef_request_handler.h"
#include "include/views/cef_browser_view.h"
#include "include/views/cef_window.h"
#include "include/wrapper/cef_message_router.h"
#include "include/wrapper/cef_helpers.h"

// Forward declaration
class SimpleClient;

// Helper to escape strings for JavaScript execution
static std::string EscapeForJs(const std::string& input) {
    std::ostringstream ss;
    ss << "\"";
    for (char c : input) {
        switch (c) {
            case '\\': ss << "\\\\"; break;
            case '"':  ss << "\\\""; break;
            case '\n': ss << "\\n"; break;
            case '\r': ss << "\\r"; break;
            case '\t': ss << "\\t"; break;
            default:
                if (static_cast<unsigned char>(c) < 32) {
                    ss << "\\u" << std::hex << std::setw(4) << std::setfill('0') << static_cast<int>(c);
                } else {
                    ss << c;
                }
                break;
        }
    }
    ss << "\"";
    return ss.str();
}

// Helper to get OS Downloads folder
static std::wstring GetOSDownloadsFolder() {
    PWSTR path = nullptr;
    if (SUCCEEDED(SHGetKnownFolderPath(FOLDERID_Downloads, 0, NULL, &path))) {
        std::wstring result(path);
        CoTaskMemFree(path);
        return result;
    }
    return L"C:\\Downloads";
}

// Convert wstring to string UTF-8
static std::string WStringToString(const std::wstring& wstr) {
    if (wstr.empty()) return std::string();
    int size_needed = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), NULL, 0, NULL, NULL);
    std::string strTo(size_needed, 0);
    WideCharToMultiByte(CP_UTF8, 0, &wstr[0], (int)wstr.size(), &strTo[0], size_needed, NULL, NULL);
    return strTo;
}

// Convert string UTF-8 to wstring
static std::wstring StringToWString(const std::string& str) {
    if (str.empty()) return std::wstring();
    int size_needed = MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), NULL, 0);
    std::wstring wstrTo(size_needed, 0);
    MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), &wstrTo[0], size_needed);
    return wstrTo;
}

// Query Handler for browser-side CEF Message Router
class QueryHandler : public CefMessageRouterBrowserSide::Handler {
public:
    virtual bool OnQuery(CefRefPtr<CefBrowser> browser,
                         CefRefPtr<CefFrame> frame,
                         int64_t query_id,
                         const CefString& request,
                         bool persistent,
                         CefRefPtr<Callback> callback) override {
        std::string req = request.ToString();

        if (req == "open-download-folder") {
            std::wstring downloads = GetOSDownloadsFolder();
            ShellExecuteW(NULL, L"open", downloads.c_str(), NULL, NULL, SW_SHOWNORMAL);
            callback->Success("ok");
            return true;
        }

        if (req == "get-download-path") {
            std::string downloads = WStringToString(GetOSDownloadsFolder());
            callback->Success(downloads);
            return true;
        }

        if (req.rfind("show-in-folder:", 0) == 0) {
            std::string filePath = req.substr(15);
            std::wstring wFilePath = StringToWString(filePath);
            std::wstring params = L"/select,\"" + wFilePath + L"\"";
            ShellExecuteW(NULL, L"open", L"explorer.exe", params.c_str(), NULL, SW_SHOWNORMAL);
            callback->Success("ok");
            return true;
        }

        if (req.rfind("open-external:", 0) == 0) {
            std::string url = req.substr(14);
            std::wstring wUrl = StringToWString(url);
            ShellExecuteW(NULL, L"open", wUrl.c_str(), NULL, NULL, SW_SHOWNORMAL);
            callback->Success("ok");
            return true;
        }

        if (req == "choose-download-path") {
            IFileDialog* pfd = nullptr;
            if (SUCCEEDED(CoCreateInstance(CLSID_FileOpenDialog, NULL, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&pfd)))) {
                DWORD dwOptions;
                if (SUCCEEDED(pfd->GetOptions(&dwOptions))) {
                    pfd->SetOptions(dwOptions | FOS_PICKFOLDERS);
                }
                HWND parentHwnd = browser->GetHost()->GetWindowHandle();
                if (SUCCEEDED(pfd->Show(parentHwnd))) {
                    IShellItem* psi = nullptr;
                    if (SUCCEEDED(pfd->GetResult(&psi))) {
                        PWSTR pszPath = nullptr;
                        if (SUCCEEDED(psi->GetDisplayName(SIGDN_FILESYSPATH, &pszPath))) {
                            std::string selected = WStringToString(pszPath);
                            CoTaskMemFree(pszPath);
                            psi->Release();
                            pfd->Release();
                            callback->Success(selected);
                            return true;
                        }
                        psi->Release();
                    }
                }
                pfd->Release();
            }
            callback->Failure(0, "User cancelled folder selection");
            return true;
        }

        return false;
    }
};

// Simple client handler
class SimpleClient : public CefClient,
                     public CefLifeSpanHandler,
                     public CefDisplayHandler,
                     public CefDownloadHandler,
                     public CefKeyboardHandler,
                     public CefRequestHandler {
private:
    CefRefPtr<CefMessageRouterBrowserSide> message_router_;
    std::unique_ptr<QueryHandler> query_handler_;
    std::list<CefRefPtr<CefBrowser>> browser_list_;
    bool is_closing_ = false;

public:
    SimpleClient() {
        CefMessageRouterConfig config;
        message_router_ = CefMessageRouterBrowserSide::Create(config);
        query_handler_ = std::make_unique<QueryHandler>();
        message_router_->AddHandler(query_handler_.get(), false);
    }

    virtual CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() override {
        return this;
    }

    virtual CefRefPtr<CefDisplayHandler> GetDisplayHandler() override {
        return this;
    }

    virtual CefRefPtr<CefDownloadHandler> GetDownloadHandler() override {
        return this;
    }

    virtual CefRefPtr<CefKeyboardHandler> GetKeyboardHandler() override {
        return this;
    }

    virtual CefRefPtr<CefRequestHandler> GetRequestHandler() override {
        return this;
    }

    virtual void OnTitleChange(CefRefPtr<CefBrowser> browser, const CefString& title) override {
        if (auto browser_view = CefBrowserView::GetForBrowser(browser)) {
            if (auto window = browser_view->GetWindow()) {
                window->SetTitle(title);
            }
        }
    }

    virtual void OnAfterCreated(CefRefPtr<CefBrowser> browser) override {
        browser_list_.push_back(browser);
    }

    virtual bool DoClose(CefRefPtr<CefBrowser> browser) override {
        if (browser_list_.size() == 1) {
            is_closing_ = true;
        }
        return false;
    }

    virtual void OnBeforeClose(CefRefPtr<CefBrowser> browser) override {
        message_router_->OnBeforeClose(browser);
        for (auto it = browser_list_.begin(); it != browser_list_.end(); ++it) {
            if ((*it)->IsSame(browser)) {
                browser_list_.erase(it);
                break;
            }
        }
        if (browser_list_.empty()) {
            CefQuitMessageLoop();
        }
    }

    virtual bool OnProcessMessageReceived(CefRefPtr<CefBrowser> browser,
                                          CefRefPtr<CefFrame> frame,
                                          CefProcessId source_process,
                                          CefRefPtr<CefProcessMessage> message) override {
        return message_router_->OnProcessMessageReceived(browser, frame, source_process, message);
    }

    virtual bool OnBeforeBrowse(CefRefPtr<CefBrowser> browser,
                                CefRefPtr<CefFrame> frame,
                                CefRefPtr<CefRequest> request,
                                bool user_gesture,
                                bool is_redirect) override {
        message_router_->OnBeforeBrowse(browser, frame);
        return false;
    }

    virtual void OnRenderProcessTerminated(CefRefPtr<CefBrowser> browser,
                                          TerminationStatus status,
                                          int error_code,
                                          const CefString& error_string) override {
        message_router_->OnRenderProcessTerminated(browser);
    }

    // ── CefDownloadHandler implementation ──
    virtual bool CanDownload(CefRefPtr<CefBrowser> browser,
                             const CefString& url,
                             const CefString& request_method) override {
        return true;
    }

    virtual bool OnBeforeDownload(CefRefPtr<CefBrowser> browser,
                                  CefRefPtr<CefDownloadItem> download_item,
                                  const CefString& suggested_name,
                                  CefRefPtr<CefBeforeDownloadCallback> callback) override {
        // Show native Save As dialog
        callback->Continue("", true);
        return true;
    }

    virtual void OnDownloadUpdated(CefRefPtr<CefBrowser> browser,
                                   CefRefPtr<CefDownloadItem> download_item,
                                   CefRefPtr<CefDownloadItemCallback> callback) override {
        uint32_t id = download_item->GetId();
        std::string full_path = download_item->GetFullPath().ToString();
        std::string suggested = download_item->GetSuggestedFileName().ToString();
        int percent = download_item->GetPercentComplete();
        int64_t speed = download_item->GetCurrentSpeed();
        int64_t total_bytes = download_item->GetTotalBytes();
        bool is_complete = download_item->IsComplete();
        bool is_canceled = download_item->IsCanceled() || download_item->IsInterrupted();

        std::string speed_str = "...";
        if (speed > 1024 * 1024) {
            char buf[32];
            snprintf(buf, sizeof(buf), "%.1f MB/s", (double)speed / (1024.0 * 1024.0));
            speed_str = buf;
        } else if (speed > 1024) {
            char buf[32];
            snprintf(buf, sizeof(buf), "%lld KB/s", (long long)(speed / 1024));
            speed_str = buf;
        }

        std::string total_str = "Unknown";
        if (total_bytes > 0) {
            char buf[32];
            snprintf(buf, sizeof(buf), "%.1f MB", (double)total_bytes / (1024.0 * 1024.0));
            total_str = buf;
        }

        std::ostringstream js;
        if (is_complete) {
            js << "window.__netglide_emit && window.__netglide_emit('download-done', {"
               << "id: '" << id << "', "
               << "status: 'completed', "
               << "savePath: " << EscapeForJs(full_path)
               << "});";
        } else if (is_canceled) {
            js << "window.__netglide_emit && window.__netglide_emit('download-done', {"
               << "id: '" << id << "', "
               << "status: 'failed', "
               << "savePath: " << EscapeForJs(full_path)
               << "});";
        } else {
            js << "window.__netglide_emit && window.__netglide_emit('download-progress', {"
               << "id: '" << id << "', "
               << "name: " << EscapeForJs(suggested) << ", "
               << "progress: " << (percent >= 0 ? percent : 0) << ", "
               << "speed: '" << speed_str << "', "
               << "totalSize: '" << total_str << "', "
               << "savePath: " << EscapeForJs(full_path)
               << "});";
        }

        CefRefPtr<CefFrame> frame = browser->GetMainFrame();
        if (frame) {
            frame->ExecuteJavaScript(js.str(), frame->GetURL(), 0);
        }
    }

    // ── CefKeyboardHandler implementation (F12 DevTools) ──
    virtual bool OnPreKeyEvent(CefRefPtr<CefBrowser> browser,
                               const CefKeyEvent& event,
                               CefEventHandle os_event,
                               bool* is_keyboard_shortcut) override {
        if (event.windows_key_code == VK_F12 && event.type == KEYEVENT_RAWKEYDOWN) {
            if (browser->GetHost()->HasDevTools()) {
                browser->GetHost()->CloseDevTools();
            } else {
                CefWindowInfo winInfo;
                winInfo.SetAsPopup(browser->GetHost()->GetWindowHandle(), "NetGlide DevTools");
                CefBrowserSettings settings;
                browser->GetHost()->ShowDevTools(winInfo, new SimpleClient(), settings, CefPoint());
            }
            return true;
        }
        return false;
    }

    IMPLEMENT_REFCOUNTING(SimpleClient);
};

// Window Delegate for CEF Views framework
class SimpleWindowDelegate : public CefWindowDelegate {
public:
    explicit SimpleWindowDelegate(CefRefPtr<CefBrowserView> browser_view)
        : browser_view_(browser_view) {}

    SimpleWindowDelegate(const SimpleWindowDelegate&) = delete;
    SimpleWindowDelegate& operator=(const SimpleWindowDelegate&) = delete;

    virtual void OnWindowCreated(CefRefPtr<CefWindow> window) override {
        window->AddChildView(browser_view_);
        window->Show();
        browser_view_->RequestFocus();
    }

    virtual void OnWindowDestroyed(CefRefPtr<CefWindow> window) override {
        browser_view_ = nullptr;
    }

    virtual bool CanClose(CefRefPtr<CefWindow> window) override {
        CefRefPtr<CefBrowser> browser = browser_view_->GetBrowser();
        if (browser) {
            return browser->GetHost()->TryCloseBrowser();
        }
        return true;
    }

    virtual CefSize GetPreferredSize(CefRefPtr<CefView> view) override {
        return CefSize(1366, 850);
    }

    virtual cef_show_state_t GetInitialShowState(CefRefPtr<CefWindow> window) override {
        return CEF_SHOW_STATE_NORMAL;
    }

private:
    CefRefPtr<CefBrowserView> browser_view_;

    IMPLEMENT_REFCOUNTING(SimpleWindowDelegate);
};

// Browser View Delegate for popups
class SimpleBrowserViewDelegate : public CefBrowserViewDelegate {
public:
    SimpleBrowserViewDelegate() = default;

    virtual bool OnPopupBrowserViewCreated(CefRefPtr<CefBrowserView> browser_view,
                                           CefRefPtr<CefBrowserView> popup_browser_view,
                                           bool is_devtools) override {
        CefWindow::CreateTopLevelWindow(new SimpleWindowDelegate(popup_browser_view));
        return true;
    }

    IMPLEMENT_REFCOUNTING(SimpleBrowserViewDelegate);
};

// Simple app
class SimpleApp : public CefApp,
                  public CefBrowserProcessHandler,
                  public CefRenderProcessHandler {
private:
    CefRefPtr<CefMessageRouterRendererSide> message_router_renderer_;
    CefRefPtr<SimpleClient> client_;

public:
    SimpleApp() {
        CefMessageRouterConfig config;
        message_router_renderer_ = CefMessageRouterRendererSide::Create(config);
    }

    virtual CefRefPtr<CefBrowserProcessHandler> GetBrowserProcessHandler() override {
        return this;
    }

    virtual CefRefPtr<CefRenderProcessHandler> GetRenderProcessHandler() override {
        return this;
    }

    virtual CefRefPtr<CefClient> GetDefaultClient() override {
        return client_;
    }

    // Command line flags
    virtual void OnBeforeCommandLineProcessing(const CefString& process_type,
                                              CefRefPtr<CefCommandLine> command_line) override {
        command_line->AppendSwitch("disable-gpu");
        command_line->AppendSwitch("disable-gpu-compositing");
        command_line->AppendSwitch("disable-web-security");
        command_line->AppendSwitch("allow-running-insecure-content");
        command_line->AppendSwitch("enable-media-stream");
        command_line->AppendSwitchWithValue("autoplay-policy", "no-user-gesture-required");
        command_line->AppendSwitchWithValue("user-agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 NetGlide/0.1.0");
    }

    // Render process callbacks
    virtual void OnContextCreated(CefRefPtr<CefBrowser> browser,
                                  CefRefPtr<CefFrame> frame,
                                  CefRefPtr<CefV8Context> context) override {
        message_router_renderer_->OnContextCreated(browser, frame, context);
    }

    virtual void OnContextReleased(CefRefPtr<CefBrowser> browser,
                                   CefRefPtr<CefFrame> frame,
                                   CefRefPtr<CefV8Context> context) override {
        message_router_renderer_->OnContextReleased(browser, frame, context);
    }

    virtual bool OnProcessMessageReceived(CefRefPtr<CefBrowser> browser,
                                          CefRefPtr<CefFrame> frame,
                                          CefProcessId source_process,
                                          CefRefPtr<CefProcessMessage> message) override {
        return message_router_renderer_->OnProcessMessageReceived(browser, frame, source_process, message);
    }

    virtual void OnContextInitialized() override {
        CEF_REQUIRE_UI_THREAD();

        CefBrowserSettings browser_settings;
        std::string url = "http://localhost:5173"; // Pointing to Vite dev server

        client_ = new SimpleClient();
        CefRefPtr<CefBrowserView> browser_view = CefBrowserView::CreateBrowserView(
            client_, url, browser_settings, nullptr, nullptr,
            new SimpleBrowserViewDelegate());

        CefRefPtr<CefWindow> window = CefWindow::CreateTopLevelWindow(new SimpleWindowDelegate(browser_view));
        window->Show();
    }

    IMPLEMENT_REFCOUNTING(SimpleApp);
};

// Entry point
int APIENTRY wWinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPWSTR lpCmdLine, int nCmdShow) {
    void* sandbox_info = nullptr;

    // Initialize COM for native file dialogs
    CoInitializeEx(NULL, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);

    CefMainArgs main_args(hInstance);
    CefRefPtr<SimpleApp> app(new SimpleApp);

    int exit_code = CefExecuteProcess(main_args, app.get(), sandbox_info);
    if (exit_code >= 0) {
        CoUninitialize();
        return exit_code;
    }

    CefSettings settings;
    settings.no_sandbox = true; // Disable sandbox for development simplicity

    // Dedicated cache path to avoid singleton lock collision
    std::wstring cache_dir = L"d:\\NetGlide\\cef_cache";
    CreateDirectoryW(cache_dir.c_str(), NULL);
    CefString(&settings.root_cache_path) = cache_dir;
    CefString(&settings.cache_path) = cache_dir;

    if (!CefInitialize(main_args, settings, app.get(), sandbox_info)) {
        CoUninitialize();
        return CefGetExitCode();
    }

    CefRunMessageLoop();
    CefShutdown();

    CoUninitialize();
    return 0;
}
