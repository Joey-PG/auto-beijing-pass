(global.webpackJsonp = global.webpackJsonp || []).push([
  ["pagesClgl/scanResult/scanResult"], {
    172:
      /*!****************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/main.js?{"page":"pagesClgl%2FscanResult%2FscanResult"} ***!
        \****************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        (function(t, e) {
          var i = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          n( /*! uni-pages */ 26);
          i(n( /*! vue */ 25));
          var r = i(n( /*! ./pagesClgl/scanResult/scanResult.vue */ 173));
          t.__webpack_require_UNI_MP_PLUGIN__ = n, e(r.default)
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/wx.js */ 1).default, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).createPage)
      },
    173:
      /*!*********************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/scanResult/scanResult.vue ***!
        \*********************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var i = n( /*! ./scanResult.vue?vue&type=template&id=0ef19c98& */ 174),
          r = n( /*! ./scanResult.vue?vue&type=script&lang=js& */ 176);
        for (var c in r)["default"].indexOf(c) < 0 && function(t) {
          n.d(e, t, (function() {
            return r[t]
          }))
        }(c);
        n( /*! ./scanResult.vue?vue&type=style&index=0&lang=scss& */ 178);
        var o = n( /*! ../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/runtime/componentNormalizer.js */ 35),
          s = Object(o.default)(r.default, i.render, i.staticRenderFns, !1, null, null, null, !1, i.components, void 0);
        s.options.__file = "pagesClgl/scanResult/scanResult.vue", e.default = s.exports
      },
    174:
      /*!****************************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/scanResult/scanResult.vue?vue&type=template&id=0ef19c98& ***!
        \****************************************************************************************************************/
      /*! exports provided: render, staticRenderFns, recyclableRender, components */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var i = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./scanResult.vue?vue&type=template&id=0ef19c98& */ 175);
        n.d(e, "render", (function() {
          return i.render
        })), n.d(e, "staticRenderFns", (function() {
          return i.staticRenderFns
        })), n.d(e, "recyclableRender", (function() {
          return i.recyclableRender
        })), n.d(e, "components", (function() {
          return i.components
        }))
      },
    175:
      /*!****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/scanResult/scanResult.vue?vue&type=template&id=0ef19c98& ***!
        \****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! exports provided: render, staticRenderFns, recyclableRender, components */
      function(t, e, n) {
        "use strict";
        var i;
        n.r(e), n.d(e, "render", (function() {
          return r
        })), n.d(e, "staticRenderFns", (function() {
          return o
        })), n.d(e, "recyclableRender", (function() {
          return c
        })), n.d(e, "components", (function() {
          return i
        }));
        try {
          i = {
            uniPopup: function() {
              return n.e( /*! import() | uni_modules/uni-popup/components/uni-popup/uni-popup */ "uni_modules/uni-popup/components/uni-popup/uni-popup").then(n.bind(null, /*! @/uni_modules/uni-popup/components/uni-popup/uni-popup.vue */ 440))
            }
          }
        } catch (t) {
          if (-1 === t.message.indexOf("Cannot find module") || -1 === t.message.indexOf(".vue")) throw t;
          console.error(t.message), console.error("1. 排查组件名称拼写是否正确"), console.error("2. 排查组件是否符合 easycom 规范，文档：https://uniapp.dcloud.net.cn/collocation/pages?id=easycom"), console.error("3. 若组件不符合 easycom 规范，需手动引入，并在 components 中注册该组件")
        }
        var r = function() {
            var t = this,
              e = t.$createElement,
              n = (t._self._c, t.getCllx(t.item.cllx)),
              i = t.__map(t.number, (function(e, n) {
                var i = t.__get_orig(e),
                  r = e == t.tmp_hphm.length && 8 != e,
                  c = 7 == e && !t.tmp_hphm.substr(e, 1) && t.isJia;
                return {
                  $orig: i,
                  g0: r,
                  g1: c,
                  g2: c ? null : t.tmp_hphm.substr(e, 1)
                }
              })),
              r = t.tmp_hphm.length;
            t.$mp.data = Object.assign({}, {
              $root: {
                m0: n,
                l0: i,
                g3: r
              }
            })
          },
          c = !1,
          o = [];
        r._withStripped = !0
      },
    176:
      /*!**********************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/scanResult/scanResult.vue?vue&type=script&lang=js& ***!
        \**********************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var i = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/babel-loader/lib!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./scanResult.vue?vue&type=script&lang=js& */ 177),
          r = n.n(i);
        for (var c in i)["default"].indexOf(c) < 0 && function(t) {
          n.d(e, t, (function() {
            return i[t]
          }))
        }(c);
        e.default = r.a
      },
    177:
      /*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/babel-loader/lib!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/scanResult/scanResult.vue?vue&type=script&lang=js& ***!
        \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        (function(t) {
          var i = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          Object.defineProperty(e, "__esModule", {
            value: !0
          }), e.default = void 0;
          var r = i(n( /*! @babel/runtime/regenerator */ 30)),
            c = i(n( /*! @babel/runtime/helpers/asyncToGenerator */ 32));
          var o = {
            onShow: function() {
              var e = this;
              t.$on("car_type_selected", (function(t) {
                e.item.cllx = t.zdbm, e.item.cllxmc = t.zdz, e.$forceUpdate()
              }))
            },
            onLoad: function(t) {
              t && t.item && (this.item = JSON.parse(decodeURIComponent(t.item)), this.item.ppxh = this.item.ppxh.replace(/([^\u0000-\u00FF])/g, (function(t) {
                return ""
              })), this.item.kz2 = item.kz2, this.requestCllxList())
            },
            data: function() {
              return {
                number: 8,
                isJia: !0,
                endDate: (t = new Date, e = t.getFullYear(), n = t.getMonth() + 1, i = t.getDate(), n = n > 9 ? n : "0" + n, i = i > 9 ? i : "0" + i, "".concat(e, "-").concat(n, "-").concat(i)),
                inputAreaItems: ["冀", "津", "湘", "宁", "晋", "蒙", "辽", "吉", "黑", "沪", "苏", "浙", "皖", "闽", "赣", "鲁", "豫", "鄂", "粤", "桂", "琼", "川", "贵", "云", "渝", "藏", "陕", "甘", "青", "新"],
                inputHeadItems: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
                typeList: [],
                item: {
                  src: "",
                  sbdh: "",
                  fdjh: "",
                  ppxh: "",
                  cllxmc: "",
                  hphm: "",
                  zcrq: "",
                  cllx: "",
                  kz2: ""
                },
                active: null,
                tmp_hphm: ""
              };
              var t, e, n, i
            },
            methods: {
              requestCllxList: function() {
                var t = this;
                return (0, c.default)(r.default.mark((function e() {
                  var n;
                  return r.default.wrap((function(e) {
                    for (;;) switch (e.prev = e.next) {
                      case 0:
                        return e.next = 2, t.$myRequest({
                          url: "/ucDicController/queryDic",
                          data: {
                            type: "CLLXFL_HLW"
                          }
                        });
                      case 2:
                        200 == (n = e.sent).code && (t.typeList = n.data);
                      case 4:
                      case "end":
                        return e.stop()
                    }
                  }), e)
                })))()
              },
              getCllx: function(t) {
                var e = this.typeList.find((function(e) {
                  return e.zdbm == t
                }));
                return e ? e.zdz : "请选择车辆类型"
              },
              cllxAction: function() {
                this.requestCllxList(), this.$refs.cllx.open()
              },
              vinInput: function(t) {
                var e = t.detail.value;
                this.$nextTick((function() {
                  this.item.fdjh = e.replace(/[^_a-zA-Z0-9'无']/g, "").toUpperCase()
                }))
              },
              vinInput1: function(t) {
                var e = t.detail.value,
                  n = /[\u4E00-\u9FA5]/g;
                this.$nextTick((function() {
                  this.item.ppxh = e.replace(n, "").toUpperCase()
                }))
              },
              cllxSelectAction: function(t, e) {
                this.item.cllx = t.zdbm, this.item.cllxmc = t.zdz, this.active = e;
                var n = this;
                setTimeout((function() {
                  n.$refs.cllx.close()
                }), 300)
              },
              deleteAction: function() {
                this.tmp_hphm = this.tmp_hphm.substr(0, this.tmp_hphm.length - 1)
              },
              cphmAction: function() {
                this.$refs.popup.open(), this.item.hphm && (this.tmp_hphm = this.item.hphm)
              },
              cancelAction: function() {
                this.$refs.popup.close()
              },
              confirmAction: function() {
                this.tmp_hphm.length ? (this.$refs.popup.close(), this.item.hphm = this.tmp_hphm, this.$forceUpdate()) : t.showToast({
                  title: "请输入车牌号码",
                  icon: "none"
                })
              },
              keyClick: function(t) {
                if (this.isJia) {
                  if (this.tmp_hphm.length >= 7) return
                } else if (this.tmp_hphm.length >= 8) return;
                this.tmp_hphm += t
              },
              reScanAction: function() {
                t.navigateBack()
              },
              confirmInfoAction: function() {
                if (!this.util.isNumAndLetterString(this.item.ppxh.replace(/\s*/g, ""))) return t.showToast({
                  title: "请输入字母数字，忽略大小写和其它字符",
                  icon: "none"
                });
                t.$emit("car_scan_result", this.item), t.navigateBack({
                  delta: 2
                })
              },
              goHideJia: function(t) {
                7 == t && (this.isJia = !1)
              }
            }
          };
          e.default = o
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).default)
      },
    178:
      /*!*******************************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/scanResult/scanResult.vue?vue&type=style&index=0&lang=scss& ***!
        \*******************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var i = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/postcss-loader/src??ref--8-oneOf-1-3!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./scanResult.vue?vue&type=style&index=0&lang=scss& */ 179),
          r = n.n(i);
        for (var c in i)["default"].indexOf(c) < 0 && function(t) {
          n.d(e, t, (function() {
            return i[t]
          }))
        }(c);
        e.default = r.a
      },
    179:
      /*!***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!./node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!./node_modules/postcss-loader/src??ref--8-oneOf-1-3!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/scanResult/scanResult.vue?vue&type=style&index=0&lang=scss& ***!
        \***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {}
  },
  [
    [172, "common/runtime", "common/vendor"]
  ]
]);