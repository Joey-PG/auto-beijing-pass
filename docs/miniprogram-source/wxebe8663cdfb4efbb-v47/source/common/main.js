(global.webpackJsonp = global.webpackJsonp || []).push([
  ["common/main"], {
    0:
      /*!*****************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/main.js ***!
        \*****************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        (function(t, e, o) {
          var a = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4),
            r = a(n( /*! @babel/runtime/helpers/defineProperty */ 11));
          n( /*! uni-pages */ 26);
          var u = a(n( /*! vue */ 25)),
            i = a(n( /*! ./App */ 27)),
            c = n( /*! ./util/api.js */ 36),
            l = a(n( /*! ./util/util.js */ 37));

          function s(t, e) {
            var n = Object.keys(t);
            if (Object.getOwnPropertySymbols) {
              var o = Object.getOwnPropertySymbols(t);
              e && (o = o.filter((function(e) {
                return Object.getOwnPropertyDescriptor(t, e).enumerable
              }))), n.push.apply(n, o)
            }
            return n
          }
          t.__webpack_require_UNI_MP_PLUGIN__ = n, u.default.prototype.util = l.default, u.default.prototype.$myRequest = c.myRequest, u.default.prototype.$myUpload = c.myUpload, u.default.prototype.$baseUrl_auth = c.BASE_URL_auth, u.default.config.productionTip = !1, i.default.mpType = "app", e.getSystemInfo({
            success: function(t) {
              var e = t.windowWidth;
              u.default.prototype.$deviceWidth = e
            }
          }), o(new u.default(function(t) {
            for (var e = 1; e < arguments.length; e++) {
              var n = null != arguments[e] ? arguments[e] : {};
              e % 2 ? s(Object(n), !0).forEach((function(e) {
                (0, r.default)(t, e, n[e])
              })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n)) : s(Object(n)).forEach((function(e) {
                Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(n, e))
              }))
            }
            return t
          }({}, i.default))).$mount()
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/wx.js */ 1).default, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).default, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).createApp)
      },
    27:
      /*!*****************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/App.vue ***!
        \*****************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var o = n( /*! ./App.vue?vue&type=script&lang=js& */ 28);
        for (var a in o)["default"].indexOf(a) < 0 && function(t) {
          n.d(e, t, (function() {
            return o[t]
          }))
        }(a);
        n( /*! ./App.vue?vue&type=style&index=0&lang=scss& */ 33);
        var r = n( /*! ../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/runtime/componentNormalizer.js */ 35),
          u = Object(r.default)(o.default, void 0, void 0, !1, null, null, null, !1, void 0, void 0);
        u.options.__file = "App.vue", e.default = u.exports
      },
    28:
      /*!******************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/App.vue?vue&type=script&lang=js& ***!
        \******************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var o = n( /*! -!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/babel-loader/lib!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./App.vue?vue&type=script&lang=js& */ 29),
          a = n.n(o);
        for (var r in o)["default"].indexOf(r) < 0 && function(t) {
          n.d(e, t, (function() {
            return o[t]
          }))
        }(r);
        e.default = a.a
      },
    29:
      /*!*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/babel-loader/lib!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/App.vue?vue&type=script&lang=js& ***!
        \*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        (function(t) {
          var o = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          Object.defineProperty(e, "__esModule", {
            value: !0
          }), e.default = void 0;
          var a, r, u, i = o(n( /*! @babel/runtime/regenerator */ 30)),
            c = o(n( /*! @babel/runtime/helpers/asyncToGenerator */ 32)),
            l = ["wxebe8663cdfb4efbb", "gh_b6717b6e9a3d"],
            s = {
              globalData: {
                sjhm: null,
                yhxm: null,
                Authorization: null,
                address: {},
                oneEnter: !1,
                config: {
                  txrkg: !1
                },
                cardMsg: {},
                showPrivacy: !1,
                onMessageData: {}
              },
              methods: {
                onMessage: function(t) {
                  this.globalData.onMessageData = t
                },
                getAccessAble: function(e) {
                  return new Promise((function(n) {
                    var o = t.getLaunchOptionsSync(),
                      a = o.referrerInfo,
                      r = o.scene;
                    o.path;
                    console.log(e, o), console.log(r), a && l.includes(a.appId) ? (console.log("白名单appid", r, a.appId), n()) : (console.log("非白名单appid", r, a.appId), t.redirectTo({
                      url: "pages/bzzx/quitPage"
                    }))
                  }))
                }
              },
              onLaunch: (u = (0, c.default)(i.default.mark((function e() {
                var n;
                return i.default.wrap((function(e) {
                  for (;;) switch (e.prev = e.next) {
                    case 0:
                      t.getPrivacySetting && t.getPrivacySetting({
                        success: function(t) {
                          console.log("是否需要授权", t.needAuthorization, "隐私协议的名称为", t.privacyContractName), t.needAuthorization ? getApp().globalData.showPrivacy = !0 : getApp().globalData.showPrivacy = !1
                        },
                        fail: function() {},
                        complete: function() {}
                      }), (n = t.getStorageSync("user")) && (this.globalData.sfzmhm = n.sfzmhm, this.globalData.sjhm = n.mobile, this.globalData.yhxm = n.certName, this.globalData.Authorization = n.Authorization), t.getStorageSync("adress") && (this.globalData.address = t.getStorageSync("adress")), this.globalData.oneEnter = t.getStorageSync("oneEnter");
                    case 6:
                    case "end":
                      return e.stop()
                  }
                }), e, this)
              }))), function() {
                return u.apply(this, arguments)
              }),
              onLoad: (r = (0, c.default)(i.default.mark((function t() {
                return i.default.wrap((function(t) {
                  for (;;) switch (t.prev = t.next) {
                    case 0:
                    case "end":
                      return t.stop()
                  }
                }), t)
              }))), function() {
                return r.apply(this, arguments)
              }),
              onShow: (a = (0, c.default)(i.default.mark((function t() {
                return i.default.wrap((function(t) {
                  for (;;) switch (t.prev = t.next) {
                    case 0:
                    case "end":
                      return t.stop()
                  }
                }), t)
              }))), function() {
                return a.apply(this, arguments)
              }),
              onHide: function() {
                console.log("App Hide"), t.setStorageSync("hide", new Date)
              },
              onUnload: function() {
                t.getStorageSync("hide") && t.removeStorageSync("hide"), console.log("App unLoad")
              }
            };
          e.default = s
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).default)
      },
    33:
      /*!***************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/App.vue?vue&type=style&index=0&lang=scss& ***!
        \***************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var o = n( /*! -!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/postcss-loader/src??ref--8-oneOf-1-3!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./App.vue?vue&type=style&index=0&lang=scss& */ 34),
          a = n.n(o);
        for (var r in o)["default"].indexOf(r) < 0 && function(t) {
          n.d(e, t, (function() {
            return o[t]
          }))
        }(r);
        e.default = a.a
      },
    34:
      /*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!./node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!./node_modules/postcss-loader/src??ref--8-oneOf-1-3!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/App.vue?vue&type=style&index=0&lang=scss& ***!
        \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {}
  },
  [
    [0, "common/runtime", "common/vendor"]
  ]
]);