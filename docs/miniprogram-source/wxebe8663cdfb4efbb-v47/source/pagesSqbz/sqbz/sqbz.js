(global.webpackJsonp = global.webpackJsonp || []).push([
  ["pagesSqbz/sqbz/sqbz"], {
    317:
      /*!****************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/main.js?{"page":"pagesSqbz%2Fsqbz%2Fsqbz"} ***!
        \****************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        (function(t, e) {
          var r = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          n( /*! uni-pages */ 26);
          r(n( /*! vue */ 25));
          var a = r(n( /*! ./pagesSqbz/sqbz/sqbz.vue */ 318));
          t.__webpack_require_UNI_MP_PLUGIN__ = n, e(a.default)
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/wx.js */ 1).default, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).createPage)
      },
    318:
      /*!*********************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/sqbz/sqbz.vue ***!
        \*********************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var r = n( /*! ./sqbz.vue?vue&type=template&id=a8d9dec8& */ 319),
          a = n( /*! ./sqbz.vue?vue&type=script&lang=js& */ 321);
        for (var s in a)["default"].indexOf(s) < 0 && function(t) {
          n.d(e, t, (function() {
            return a[t]
          }))
        }(s);
        n( /*! ./sqbz.vue?vue&type=style&index=0&lang=scss& */ 323);
        var o = n( /*! ../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/runtime/componentNormalizer.js */ 35),
          i = Object(o.default)(a.default, r.render, r.staticRenderFns, !1, null, null, null, !1, r.components, void 0);
        i.options.__file = "pagesSqbz/sqbz/sqbz.vue", e.default = i.exports
      },
    319:
      /*!****************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/sqbz/sqbz.vue?vue&type=template&id=a8d9dec8& ***!
        \****************************************************************************************************/
      /*! exports provided: render, staticRenderFns, recyclableRender, components */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var r = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./sqbz.vue?vue&type=template&id=a8d9dec8& */ 320);
        n.d(e, "render", (function() {
          return r.render
        })), n.d(e, "staticRenderFns", (function() {
          return r.staticRenderFns
        })), n.d(e, "recyclableRender", (function() {
          return r.recyclableRender
        })), n.d(e, "components", (function() {
          return r.components
        }))
      },
    320:
      /*!****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/sqbz/sqbz.vue?vue&type=template&id=a8d9dec8& ***!
        \****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! exports provided: render, staticRenderFns, recyclableRender, components */
      function(t, e, n) {
        "use strict";
        var r;
        n.r(e), n.d(e, "render", (function() {
          return a
        })), n.d(e, "staticRenderFns", (function() {
          return o
        })), n.d(e, "recyclableRender", (function() {
          return s
        })), n.d(e, "components", (function() {
          return r
        }));
        try {
          r = {
            uniPopup: function() {
              return n.e( /*! import() | uni_modules/uni-popup/components/uni-popup/uni-popup */ "uni_modules/uni-popup/components/uni-popup/uni-popup").then(n.bind(null, /*! @/uni_modules/uni-popup/components/uni-popup/uni-popup.vue */ 440))
            }
          }
        } catch (t) {
          if (-1 === t.message.indexOf("Cannot find module") || -1 === t.message.indexOf(".vue")) throw t;
          console.error(t.message), console.error("1. 排查组件名称拼写是否正确"), console.error("2. 排查组件是否符合 easycom 规范，文档：https://uniapp.dcloud.net.cn/collocation/pages?id=easycom"), console.error("3. 若组件不符合 easycom 规范，需手动引入，并在 components 中注册该组件")
        }
        var a = function() {
            var t = this,
              e = t.$createElement;
            t._self._c;
            t._isMounted || (t.e0 = function(e) {
              t.jsy.jszh = t.jsy.jszh.toUpperCase()
            })
          },
          s = !1,
          o = [];
        a._withStripped = !0
      },
    321:
      /*!**********************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/sqbz/sqbz.vue?vue&type=script&lang=js& ***!
        \**********************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var r = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/babel-loader/lib!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./sqbz.vue?vue&type=script&lang=js& */ 322),
          a = n.n(r);
        for (var s in r)["default"].indexOf(s) < 0 && function(t) {
          n.d(e, t, (function() {
            return r[t]
          }))
        }(s);
        e.default = a.a
      },
    322:
      /*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/babel-loader/lib!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/sqbz/sqbz.vue?vue&type=script&lang=js& ***!
        \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        (function(t) {
          var r = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          Object.defineProperty(e, "__esModule", {
            value: !0
          }), e.default = void 0;
          var a = r(n( /*! @babel/runtime/regenerator */ 30)),
            s = r(n( /*! @babel/runtime/helpers/asyncToGenerator */ 32)),
            o = {
              onShow: function() {
                var e = this;
                t.$on("car_scan_result", (function(t) {
                  e.jsy.xm = t.xm, e.jsy.jszh = t.jszh, e.jsz = t.jsz
                }))
              },
              onLoad: function(t) {
                var e = this;
                t.data && (this.data = JSON.parse(t.data)), this.getUser(), this.$nextTick((function() {
                  e.$refs.popup.open(), e.timerRead = 3;
                  for (var t = 3; t > 0; t--) setTimeout((function() {
                    e.timerRead--
                  }), 1e3 * t)
                }))
              },
              data: function() {
                return {
                  data: {},
                  jsy: {
                    xm: "",
                    jszh: "",
                    dabh: ""
                  },
                  jsz: "",
                  txrList: 0 == getApp().globalData.config.txrkg ? [] : [{}],
                  txrxx: [],
                  txrkg: getApp().globalData.config.txrkg,
                  wtxr: !1,
                  isShow: getApp().globalData.config.ocrkg,
                  timerRead: 3
                }
              },
              methods: {
                getUser: function() {
                  var t = this;
                  return (0, s.default)(a.default.mark((function e() {
                    var n;
                    return a.default.wrap((function(e) {
                      for (;;) switch (e.prev = e.next) {
                        case 0:
                          return e.next = 2, t.$myRequest({
                            url: "/applyRecordController/getJsrxx",
                            type: "POST"
                          });
                        case 2:
                          200 == (n = e.sent).code && (t.jsy.xm = n.data.jsrxm, t.jsy.jszh = n.data.jszh, t.jsy.dabh = n.data.dabh);
                        case 4:
                        case "end":
                          return e.stop()
                      }
                    }), e)
                  })))()
                },
                scanCardAction: function() {
                  t.navigateTo({
                    url: "/pagesSqbz/camera/camera"
                  })
                },
                confirmTxrAction: function() {
                  this.wtxr = !this.wtxr, this.wtxr ? this.txrList = [] : this.txrList = [{}]
                },
                closePopup: function() {
                  this.timerRead || this.$refs.popup.close()
                },
                addTxrAction: function() {
                  10 !== this.txrList.length && this.txrList.push({})
                },
                deleteTxrAction: function() {
                  this.txrList.pop()
                },
                checkInfo: function() {
                  var e = this;
                  return (0, s.default)(a.default.mark((function n() {
                    var r;
                    return a.default.wrap((function(n) {
                      for (;;) switch (n.prev = n.next) {
                        case 0:
                          return r = {
                            jsrxm: e.jsy.xm,
                            jszh: e.jsy.jszh,
                            dabh: e.jsy.dabh,
                            txrxx: e.txrxx,
                            txrkg: getApp().globalData.config.txrkg,
                            wtxr: e.wtxr ? "1" : ""
                          }, n.next = 3, e.$myRequest({
                            url: "/applyRecordController/applyCheckNum",
                            data: r
                          });
                        case 3:
                          200 == n.sent.code && (e.data.jsrxm = e.jsy.xm, e.data.jszh = e.jsy.jszh, e.data.dabh = e.jsy.dabh, e.data.txrxx = e.txrxx, e.data.jszOcrPath = e.jsz, t.navigateTo({
                            url: "/pagesSqbz/jjxx/jjxx?data=" + JSON.stringify(e.data)
                          }));
                        case 5:
                        case "end":
                          return n.stop()
                      }
                    }), n)
                  })))()
                },
                toJtPage: function() {
                  t.navigateTo({
                    url: "/pagesOther/jthbjc/jthbjc"
                  })
                },
                nextAction: function() {
                  "{}" == JSON.stringify(this.txrList[0]) ? this.txrxx = [] : this.txrxx = this.txrList, this.checkInfo()
                }
              }
            };
          e.default = o
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).default)
      },
    323:
      /*!*******************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/sqbz/sqbz.vue?vue&type=style&index=0&lang=scss& ***!
        \*******************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var r = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/postcss-loader/src??ref--8-oneOf-1-3!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./sqbz.vue?vue&type=style&index=0&lang=scss& */ 324),
          a = n.n(r);
        for (var s in r)["default"].indexOf(s) < 0 && function(t) {
          n.d(e, t, (function() {
            return r[t]
          }))
        }(s);
        e.default = a.a
      },
    324:
      /*!***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!./node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!./node_modules/postcss-loader/src??ref--8-oneOf-1-3!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/sqbz/sqbz.vue?vue&type=style&index=0&lang=scss& ***!
        \***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {}
  },
  [
    [317, "common/runtime", "common/vendor"]
  ]
]);