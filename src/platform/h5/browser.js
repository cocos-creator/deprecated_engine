/**
 * @module Browser
 * @main
 */

var Browser = (function () {
    var win = window, nav = win.navigator, doc = document, docEle = doc.documentElement;
    var ua = nav.userAgent.toLowerCase();

    var Browser = {};
    Browser.BROWSER_TYPE_WECHAT = "wechat";
    Browser.BROWSER_TYPE_ANDROID = "androidbrowser";
    Browser.BROWSER_TYPE_IE = "ie";
    Browser.BROWSER_TYPE_QQ = "qqbrowser";
    Browser.BROWSER_TYPE_MOBILE_QQ = "mqqbrowser";
    Browser.BROWSER_TYPE_UC = "ucbrowser";
    Browser.BROWSER_TYPE_360 = "360browser";
    Browser.BROWSER_TYPE_BAIDU_APP = "baiduboxapp";
    Browser.BROWSER_TYPE_BAIDU = "baidubrowser";
    Browser.BROWSER_TYPE_MAXTHON = "maxthon";
    Browser.BROWSER_TYPE_OPERA = "opera";
    Browser.BROWSER_TYPE_OUPENG = "oupeng";
    Browser.BROWSER_TYPE_MIUI = "miuibrowser";
    Browser.BROWSER_TYPE_FIREFOX = "firefox";
    Browser.BROWSER_TYPE_SAFARI = "safari";
    Browser.BROWSER_TYPE_CHROME = "chrome";
    Browser.BROWSER_TYPE_LIEBAO = "liebao";
    Browser.BROWSER_TYPE_QZONE = "qzone";
    Browser.BROWSER_TYPE_SOUGOU = "sogou";
    Browser.BROWSER_TYPE_UNKNOWN = "unknown";

    var browserType = Browser.BROWSER_TYPE_UNKNOWN;
    var browserTypes = ua.match(/sogou|qzone|liebao|micromessenger|qqbrowser|ucbrowser|360 aphone|360browser|baiduboxapp|baidubrowser|maxthon|trident|oupeng|opera|miuibrowser|firefox/i) ||
                                ua.match(/chrome|safari/i);
    if (browserTypes && browserTypes.length > 0) {
        browserType = browserTypes[0];
        if (browserType === 'micromessenger') {
            browserType = Browser.BROWSER_TYPE_WECHAT;
        }
        else if (browserType === "safari" && (ua.match(/android.*applewebkit/))) {
            browserType = Browser.BROWSER_TYPE_ANDROID;
        }
        else if (browserType === "trident") {
            browserType = Browser.BROWSER_TYPE_IE;
        }
        else if (browserType === "360 aphone") {
            browserType = Browser.BROWSER_TYPE_360;
        }
    }
    else if (ua.indexOf("iphone") && ua.indexOf("mobile")) {
        browserType = "safari";
    }

    /**
     * @property {string} type - Indicate the running browser type
     */
    Browser.type = browserType;

    return Browser;
})();

var BrowserGetter = (function () {

    var BrowserGetter = {
        init: function () {
            this.html = document.getElementsByTagName("html")[0];
        },
        availWidth: function (frame) {
            if (!frame || frame === this.html) {
                return window.innerWidth;
            }
            else {
                return frame.clientWidth;
            }
        },
        availHeight: function (frame) {
            if (!frame || frame === this.html) {
                return window.innerHeight;
            }
            else {
                return frame.clientHeight;
            }
        },
        adaptationType: Browser.type
    };

    if (window.navigator.userAgent.indexOf("OS 8_1_") > -1) {   //this mistake like MIUI, so use of MIUI treatment method
        BrowserGetter.adaptationType = Browser.BROWSER_TYPE_MIUI;
    }
    switch (BrowserGetter.adaptationType) {
        case Browser.BROWSER_TYPE_SAFARI:
            //BrowserGetter.meta["minimal-ui"] = "true";
            BrowserGetter.availWidth = function (frame) {
                return frame.clientWidth;
            };
            BrowserGetter.availHeight = function (frame) {
                return frame.clientHeight;
            };
            break;
        //case Browser.BROWSER_TYPE_CHROME:
        //    BrowserGetter.__defineGetter__("target-densitydpi", function () {
        //        return cc.view._targetDensityDPI;
        //    });
        case Browser.BROWSER_TYPE_SOUGOU:
        case Browser.BROWSER_TYPE_UC:
            BrowserGetter.availWidth = function (frame) {
                return frame.clientWidth;
            };
            BrowserGetter.availHeight = function (frame) {
                return frame.clientHeight;
            };
            break;
        //case Browser.BROWSER_TYPE_MIUI:
        //    BrowserGetter.init = function () {
        //        if (view.__resizeWithBrowserSize) return;
        //        var resize = function(){
        //            view.setDesignResolutionSize(
        //                view._designResolutionSize.width,
        //                view._designResolutionSize.height,
        //                view._resolutionPolicy
        //            );
        //            window.removeEventListener("resize", resize, false);
        //        };
        //        window.addEventListener("resize", resize, false);
        //    };
        //    break;
    }

    BrowserGetter.init();
    return BrowserGetter;
})();
