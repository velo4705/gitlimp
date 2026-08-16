// Mock of the Wails backend for the browser.
// Mirrors the desktop app's binding surface (window.go.main.App.* + runtime)
// so the playground can swap in a real backend without UI changes.

const APP_VERSION = '1.0.0';

function detectOS() {
    const ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return 'windows';
    if (/Mac/i.test(ua)) return 'macos';
    if (/Android/i.test(ua)) return 'android';
    if (/Linux/i.test(ua)) return 'linux';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    return 'unknown';
}

const ASSETS = {
    windows: 'gitlimp.exe',
    linux: 'gitlimp-1.0.0-x86_64.AppImage',
};

const GITLIMP_REPO = 'https://github.com/velo4705/gitlimp';
const RELEASES_URL = GITLIMP_REPO + '/releases';

export function detectOSName() { return detectOS(); }

export function downloadAssetURL() {
    const os = detectOS();
    const asset = ASSETS[os];
    if (!asset) return RELEASES_URL;
    return `${RELEASES_URL}/latest`;
}

// The same API the desktop app exposes through Wails. Each method returns
// a Promise, matching the generated frontend/wailsjs/go/main/App.js wrappers.
export const mockApp = {
    GetVersion: () => Promise.resolve(APP_VERSION),

    CheckForUpdates: () => Promise.resolve({
        current: APP_VERSION,
        latest: APP_VERSION,
        available: false,
        html_url: GITLIMP_REPO + '/releases',
        error: '',
    }),

    OpenFile: () => Promise.resolve(null),

    LoadFile: (path) => Promise.resolve(null),

    CloseTab: () => Promise.resolve(),

    GetRecentFiles: () => Promise.resolve([]),

    ClearRecentFiles: () => Promise.resolve(),

    ResolveImagePaths: (_path, html) => Promise.resolve(html),

    IsMarkdown: (path) => Promise.resolve(/\.(md|markdown)$/i.test(path || '')),
};

export const mockRuntime = {
    EventsOn: () => () => {},
    BrowserOpenURL: (url) => { window.open(url, '_blank', 'noopener'); },
};

// Install the mock into window.go so any code expecting the Wails runtime
// (e.g. the generated App.js wrappers) works unchanged.
export function installMock() {
    window.go = {
        main: {App: mockApp},
        runtime: mockRuntime,
    };
    window.runtime = mockRuntime;
    window.BrowserOpenURL = mockRuntime.BrowserOpenURL;
}