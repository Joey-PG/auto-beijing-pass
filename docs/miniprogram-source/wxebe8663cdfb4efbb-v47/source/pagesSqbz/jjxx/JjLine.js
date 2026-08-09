(global.webpackJsonp = global.webpackJsonp || []).push([
  ["pagesSqbz/jjxx/JjLine"], {
    333:
      /*!******************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/main.js?{"page":"pagesSqbz%2Fjjxx%2FJjLine"} ***!
        \******************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        (function(t, e) {
          var o = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          n( /*! uni-pages */ 26);
          o(n( /*! vue */ 25));
          var r = o(n( /*! ./pagesSqbz/jjxx/JjLine.vue */ 334));
          t.__webpack_require_UNI_MP_PLUGIN__ = n, e(r.default)
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/wx.js */ 1).default, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).createPage)
      },
    334:
      /*!***********************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/jjxx/JjLine.vue ***!
        \***********************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var o = n( /*! ./JjLine.vue?vue&type=template&id=09ebe5e0&scoped=true& */ 335),
          r = n( /*! ./JjLine.vue?vue&type=script&lang=js& */ 337);
        for (var i in r)["default"].indexOf(i) < 0 && function(t) {
          n.d(e, t, (function() {
            return r[t]
          }))
        }(i);
        n( /*! ./JjLine.vue?vue&type=style&index=0&id=09ebe5e0&lang=scss&scoped=true& */ 339);
        var a = n( /*! ../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/runtime/componentNormalizer.js */ 35),
          c = Object(a.default)(r.default, o.render, o.staticRenderFns, !1, null, "09ebe5e0", null, !1, o.components, void 0);
        c.options.__file = "pagesSqbz/jjxx/JjLine.vue", e.default = c.exports
      },
    335:
      /*!******************************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/jjxx/JjLine.vue?vue&type=template&id=09ebe5e0&scoped=true& ***!
        \******************************************************************************************************************/
      /*! exports provided: render, staticRenderFns, recyclableRender, components */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var o = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./JjLine.vue?vue&type=template&id=09ebe5e0&scoped=true& */ 336);
        n.d(e, "render", (function() {
          return o.render
        })), n.d(e, "staticRenderFns", (function() {
          return o.staticRenderFns
        })), n.d(e, "recyclableRender", (function() {
          return o.recyclableRender
        })), n.d(e, "components", (function() {
          return o.components
        }))
      },
    336:
      /*!******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/jjxx/JjLine.vue?vue&type=template&id=09ebe5e0&scoped=true& ***!
        \******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! exports provided: render, staticRenderFns, recyclableRender, components */
      function(t, e, n) {
        "use strict";
        var o;
        n.r(e), n.d(e, "render", (function() {
          return r
        })), n.d(e, "staticRenderFns", (function() {
          return a
        })), n.d(e, "recyclableRender", (function() {
          return i
        })), n.d(e, "components", (function() {
          return o
        }));
        try {
          o = {
            uniIcons: function() {
              return Promise.all( /*! import() | uni_modules/uni-icons/components/uni-icons/uni-icons */ [n.e("common/vendor"), n.e("uni_modules/uni-icons/components/uni-icons/uni-icons")]).then(n.bind(null, /*! @/uni_modules/uni-icons/components/uni-icons/uni-icons.vue */ 462))
            }
          }
        } catch (t) {
          if (-1 === t.message.indexOf("Cannot find module") || -1 === t.message.indexOf(".vue")) throw t;
          console.error(t.message), console.error("1. 排查组件名称拼写是否正确"), console.error("2. 排查组件是否符合 easycom 规范，文档：https://uniapp.dcloud.net.cn/collocation/pages?id=easycom"), console.error("3. 若组件不符合 easycom 规范，需手动引入，并在 components 中注册该组件")
        }
        var r = function() {
            var t = this.$createElement;
            this._self._c
          },
          i = !1,
          a = [];
        r._withStripped = !0
      },
    337:
      /*!************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/jjxx/JjLine.vue?vue&type=script&lang=js& ***!
        \************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var o = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/babel-loader/lib!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./JjLine.vue?vue&type=script&lang=js& */ 338),
          r = n.n(o);
        for (var i in o)["default"].indexOf(i) < 0 && function(t) {
          n.d(e, t, (function() {
            return o[t]
          }))
        }(i);
        e.default = r.a
      },
    338:
      /*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/babel-loader/lib!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/jjxx/JjLine.vue?vue&type=script&lang=js& ***!
        \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        (function(t) {
          var o = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          Object.defineProperty(e, "__esModule", {
            value: !0
          }), e.default = void 0;
          var r = o(n( /*! @babel/runtime/regenerator */ 30)),
            i = o(n( /*! @babel/runtime/helpers/defineProperty */ 11)),
            a = o(n( /*! @babel/runtime/helpers/asyncToGenerator */ 32)),
            c = n( /*! @/util/util */ 37);

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

          function d(t) {
            for (var e = 1; e < arguments.length; e++) {
              var n = null != arguments[e] ? arguments[e] : {};
              e % 2 ? s(Object(n), !0).forEach((function(e) {
                (0, i.default)(t, e, n[e])
              })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n)) : s(Object(n)).forEach((function(e) {
                Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(n, e))
              }))
            }
            return t
          }
          var l = {
            data: function() {
              return {
                jjlk: null,
                jjlkArea: null,
                sfzj: "0",
                zjInfo: {
                  zjxxdz: "",
                  zjxxdzgdjd: "",
                  zjxxdzgdwd: ""
                },
                jjlkList: [],
                globalData: null,
                vId: !1,
                data: ""
              }
            },
            beforeMount: function() {
              this.globalData = getApp().globalData, console.log(this.globalData)
            },
            watch: {
              "globalData.onMessageData": function(t) {
                console.log(t), this.data = JSON.stringify(t), t.location && ("ChooseZjaddress" === t.id ? this.zjInfo = {
                  zjxxdz: t.name,
                  zjxxdzgdjd: t.location.lng,
                  zjxxdzgdwd: t.location.lat
                } : "jjdl" === t.id && (this.jjlk = {
                  zdz: t.name,
                  jjlkgdjd: t.location.lng,
                  jjlkgdwd: t.location.lat
                }))
              }
            },
            onLoad: function(t) {
              var e = JSON.parse(t.params);
              this.vId = t.vId, this.sfzj = e.sfzj || "0", "1" === this.sfzj ? this.zjInfo = {
                zjxxdz: e.zjxxdz || "",
                zjxxdzgdjd: e.zjxxdzgdjd || "",
                zjxxdzgdwd: e.zjxxdzgdwd || ""
              } : "0" === this.sfzj && (this.jjlk = {
                zdz: e.jjlkmc,
                zdbm: e.jjlk,
                jjlkgdjd: e.jjlkgdjd || "",
                jjlkgdwd: e.jjlkgdwd || ""
              }), this.requestJjlkList()
            },
            methods: {
              jjlkAreaAction: function(t) {
                this.jjlkArea = t
              },
              handleClick: function(e) {
                (0, c.getLocation)((function() {
                  var n = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {
                    longitude: "",
                    latitude: ""
                  };
                  t.navigateTo({
                    url: "/pagesSqbz/jjxx/ChooseLine?lng=".concat(n.longitude, "&lat=").concat(n.latitude, "&id=").concat(e),
                    success: function() {
                      console.log(getCurrentPages())
                    }
                  })
                }))
              },
              jjlkRoadAction: function(t) {
                this.jjlk = t
              },
              requestJjlkList: function() {
                var t = this;
                return (0, a.default)(r.default.mark((function e() {
                  var n;
                  return r.default.wrap((function(e) {
                    for (;;) switch (e.prev = e.next) {
                      case 0:
                        return e.next = 2, t.$myRequest({
                          url: "/ucDicController/queryDic",
                          data: {
                            type: "jjlk",
                            vId: t.vId
                          }
                        });
                      case 2:
                        200 == (n = e.sent).code && (t.jjlkArea = n.data[0], t.jjlkList = n.data);
                      case 4:
                      case "end":
                        return e.stop()
                    }
                  }), e)
                })))()
              },
              addressSelect: function() {
                var e = this;
                return (0, a.default)(r.default.mark((function n() {
                  return r.default.wrap((function(n) {
                    for (;;) switch (n.prev = n.next) {
                      case 0:
                        (0, c.getLocation)((function(n) {
                          var o = n.latitude,
                            r = n.longitude,
                            i = e.zjInfo,
                            a = i.zjxxdzgdjd || r,
                            c = i.zjxxdzgdwd || o;
                          t.navigateTo({
                            url: "/pagesSqbz/jjxx/ChooseZjaddress?lng=".concat(a, "&lat=").concat(c)
                          })
                        }));
                      case 1:
                      case "end":
                        return n.stop()
                    }
                  }), n)
                })))()
              },
              change: function(t) {
                this.sfzj = t.detail.value
              },
              handleSubmit: function() {
                if (!this.sfzj) return t.showToast({
                  title: "请选择是否已在京",
                  icon: "none"
                });
                var e = {
                  sfzj: this.sfzj
                };
                if ("1" === this.sfzj) {
                  if (!this.zjInfo.zjxxdz) return t.showToast({
                    title: "请选择在京详细地址",
                    icon: "none"
                  });
                  e = d(d({}, e), this.zjInfo), console.log(e)
                } else {
                  if (!this.jjlk && !this.jjlk.name) return t.showToast({
                    title: "请选择进京道路",
                    icon: "none"
                  });
                  e = d(d({}, e), {}, {
                    jjlk: this.jjlk.zdbm,
                    jjlkmc: this.jjlk.zdz,
                    jjlkgdjd: this.jjlk.jjlkgdjd || "",
                    jjlkgdwd: this.jjlk.jjlkgdwd || ""
                  })
                }
                console.log(e), t.$emit("jjdl", e);
                var n = getCurrentPages().reverse().findIndex((function(t) {
                  return "pagesSqbz/jjxx/jjxx" === t.route
                }));
                t.navigateBack({
                  delta: n
                })
              }
            }
          };
          e.default = l
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).default)
      },
    339:
      /*!*********************************************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/jjxx/JjLine.vue?vue&type=style&index=0&id=09ebe5e0&lang=scss&scoped=true& ***!
        \*********************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var o = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/postcss-loader/src??ref--8-oneOf-1-3!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./JjLine.vue?vue&type=style&index=0&id=09ebe5e0&lang=scss&scoped=true& */ 340),
          r = n.n(o);
        for (var i in o)["default"].indexOf(i) < 0 && function(t) {
          n.d(e, t, (function() {
            return o[t]
          }))
        }(i);
        e.default = r.a
      },
    340:
      /*!*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!./node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!./node_modules/postcss-loader/src??ref--8-oneOf-1-3!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesSqbz/jjxx/JjLine.vue?vue&type=style&index=0&id=09ebe5e0&lang=scss&scoped=true& ***!
        \*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {}
  },
  [
    [333, "common/runtime", "common/vendor"]
  ]
]);