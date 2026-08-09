(global.webpackJsonp = global.webpackJsonp || []).push([
  ["pagesClgl/edit/edit"], {
    148:
      /*!****************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/main.js?{"page":"pagesClgl%2Fedit%2Fedit"} ***!
        \****************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        (function(t, e) {
          var i = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          n( /*! uni-pages */ 26);
          i(n( /*! vue */ 25));
          var a = i(n( /*! ./pagesClgl/edit/edit.vue */ 149));
          t.__webpack_require_UNI_MP_PLUGIN__ = n, e(a.default)
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/wx.js */ 1).default, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).createPage)
      },
    149:
      /*!*********************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/edit/edit.vue ***!
        \*********************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var i = n( /*! ./edit.vue?vue&type=template&id=381cfa18& */ 150),
          a = n( /*! ./edit.vue?vue&type=script&lang=js& */ 152);
        for (var r in a)["default"].indexOf(r) < 0 && function(t) {
          n.d(e, t, (function() {
            return a[t]
          }))
        }(r);
        n( /*! ./edit.vue?vue&type=style&index=0&lang=scss& */ 154);
        var c = n( /*! ../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/runtime/componentNormalizer.js */ 35),
          l = Object(c.default)(a.default, i.render, i.staticRenderFns, !1, null, null, null, !1, i.components, void 0);
        l.options.__file = "pagesClgl/edit/edit.vue", e.default = l.exports
      },
    150:
      /*!****************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/edit/edit.vue?vue&type=template&id=381cfa18& ***!
        \****************************************************************************************************/
      /*! exports provided: render, staticRenderFns, recyclableRender, components */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var i = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./edit.vue?vue&type=template&id=381cfa18& */ 151);
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
    151:
      /*!****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/edit/edit.vue?vue&type=template&id=381cfa18& ***!
        \****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! exports provided: render, staticRenderFns, recyclableRender, components */
      function(t, e, n) {
        "use strict";
        var i;
        n.r(e), n.d(e, "render", (function() {
          return a
        })), n.d(e, "staticRenderFns", (function() {
          return c
        })), n.d(e, "recyclableRender", (function() {
          return r
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
        var a = function() {
            var t = this,
              e = t.$createElement,
              n = (t._self._c, t.carDetail.hphm ? t.carDetail.hphm.length : null),
              i = t.carDetail.hphm ? t.carDetail.hphm.length : null,
              a = t.carDetail.hphm ? t.carDetail.hpzlmc.length : null,
              r = t.carDetail.hphm ? t.carDetail.hpzlmc.length : null,
              c = t.carDetail.hphm ? t.carDetail.fdjh.length : null,
              l = t.carDetail.hphm ? t.carDetail.ppxh.length : null,
              s = t.carDetail.hphm ? t.carDetail.zcsj.length : null,
              o = t.carDetail.hphm ? t.carDetail.zcsj.length : null,
              u = t.carDetail.hphm ? t.carDetail.cllxmc.length : null,
              h = t.carDetail.hphm ? t.carDetail.cllxmc.length : null,
              p = t.__map(t.number, (function(e, n) {
                var i = t.__get_orig(e),
                  a = e == t.tmp_hphm.length && 8 != e,
                  r = n == t.number - 1 && !t.tmp_hphm.substr(e, 1) && t.isJia;
                return {
                  $orig: i,
                  g10: a,
                  g11: r,
                  g12: r ? null : t.tmp_hphm.substr(n, 1)
                }
              })),
              f = t.tmp_hphm.length;
            t.$mp.data = Object.assign({}, {
              $root: {
                g0: n,
                g1: i,
                g2: a,
                g3: r,
                g4: c,
                g5: l,
                g6: s,
                g7: o,
                g8: u,
                g9: h,
                l0: p,
                g13: f
              }
            })
          },
          r = !1,
          c = [];
        a._withStripped = !0
      },
    152:
      /*!**********************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/edit/edit.vue?vue&type=script&lang=js& ***!
        \**********************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var i = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/babel-loader/lib!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./edit.vue?vue&type=script&lang=js& */ 153),
          a = n.n(i);
        for (var r in i)["default"].indexOf(r) < 0 && function(t) {
          n.d(e, t, (function() {
            return i[t]
          }))
        }(r);
        e.default = a.a
      },
    153:
      /*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/babel-loader/lib!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/edit/edit.vue?vue&type=script&lang=js& ***!
        \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        (function(t) {
          var i = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          Object.defineProperty(e, "__esModule", {
            value: !0
          }), e.default = void 0;
          var a = i(n( /*! @babel/runtime/regenerator */ 30)),
            r = i(n( /*! @babel/runtime/helpers/asyncToGenerator */ 32));
          var c = {
            mounted: function() {
              var e = this;
              t.$on("car_type_selected", (function(t) {
                e.carDetail.cllx = t.zdbm, e.carDetail.cllxmc = t.zdz, e.carDetail.kz4 = "", e.carDetail.kz3 = ""
              })), t.$on("carDetailSelect", (function(t) {
                e.carDetail.kz3 = t.zdbm, e.carDetail.kz4 = t.zdz
              }))
            },
            onLoad: function(t) {
              this.vId = t.vId, this.requestCarDetail()
            },
            data: function() {
              return {
                isEdit: !1,
                number: 8,
                isJia: !0,
                vId: "",
                carDetail: {},
                typeList: [],
                tmp_hphm: "",
                active: null,
                endDate: (t = new Date, e = t.getFullYear(), n = t.getMonth() + 1, i = t.getDate(), n = n > 9 ? n : "0" + n, i = i > 9 ? i : "0" + i, "".concat(e, "-").concat(n, "-").concat(i)),
                inputAreaItems: ["湘", "宁", "津", "冀", "晋", "蒙", "辽", "吉", "黑", "沪", "苏", "浙", "皖", "闽", "赣", "鲁", "豫", "鄂", "粤", "桂", "琼", "川", "贵", "云", "渝", "藏", "陕", "甘", "青", "新"],
                inputHeadItems: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
                hpzlList: []
              };
              var t, e, n, i
            },
            methods: {
              requestCllxList: function() {
                var t = this;
                return (0, r.default)(a.default.mark((function e() {
                  var n;
                  return a.default.wrap((function(e) {
                    for (;;) switch (e.prev = e.next) {
                      case 0:
                        return e.next = 2, t.$myRequest({
                          url: "/ucDicController/queryDic",
                          data: {
                            type: "CLLXFL_HLW"
                          }
                        });
                      case 2:
                        200 == (n = e.sent).code && (t.typeList = n.data, t.$refs.cllx.open());
                      case 4:
                      case "end":
                        return e.stop()
                    }
                  }), e)
                })))()
              },
              deleteAction: function() {
                this.tmp_hphm = this.tmp_hphm.substr(0, this.tmp_hphm.length - 1)
              },
              cphmAction: function() {
                this.$refs.popup.open(), this.tmp_hphm = this.carDetail.hphm
              },
              cancelAction: function() {
                this.$refs.popup.close()
              },
              confirmAction: function() {
                this.tmp_hphm.length ? (this.$refs.popup.close(), this.carDetail.hphm = this.tmp_hphm) : t.showToast({
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
              hpzlAction: function() {
                this.requestHpzlList()
              },
              cllxDetail: function() {
                t.navigateTo({
                  url: "/pagesClgl/CartypeDetail?kz3=".concat(this.carDetail.kz3)
                })
              },
              hpzlSelectAction: function(t) {
                this.carDetail.hpzl = t.zdbm, this.carDetail.hpzlmc = t.zdz;
                var e = this;
                setTimeout((function() {
                  e.$refs.hpzl.close()
                }), 300)
              },
              requestHpzlList: function() {
                var t = this;
                return (0, r.default)(a.default.mark((function e() {
                  var n;
                  return a.default.wrap((function(e) {
                    for (;;) switch (e.prev = e.next) {
                      case 0:
                        return e.next = 2, t.$myRequest({
                          url: "/ucDicController/queryDic",
                          data: {
                            type: "HPZL_HLW"
                          }
                        });
                      case 2:
                        200 == (n = e.sent).code && (t.hpzlList = n.data, t.hpzlList.forEach((function(t) {
                          switch (t.zdbm) {
                            case "02":
                              t.tip = "蓝底白字", t.imageUrl = "/pagesClgl/static/hpzl_01.png";
                              break;
                            case "01":
                              t.tip = "黄底黑字(440X140)", t.imageUrl = "/pagesClgl/static/hpzl_02.png";
                              break;
                            case "52":
                              t.tip = "渐变绿色底黑字", t.imageUrl = "/pagesClgl/static/hpzl_03.png";
                              break;
                            case "51":
                              t.tip = "黄绿双拼色", t.imageUrl = "/pagesClgl/static/hpzl_04.png";
                              break;
                            case "06":
                              t.tip = "黑底白字/红字", t.imageUrl = "/pagesClgl/static/hpzl_06.png";
                              break;
                            case "13":
                              t.tip = "黄底黑字(300X165)", t.imageUrl = "/pagesClgl/static/hpzl_05.png"
                          }
                        })), t.$refs.hpzl.open());
                      case 4:
                      case "end":
                        return e.stop()
                    }
                  }), e)
                })))()
              },
              vinInput: function(t) {
                var e = t.detail.value;
                this.$nextTick((function() {
                  this.carDetail.fdjh = e.replace(/[^_a-zA-Z0-9'无']/g, "").toUpperCase()
                }))
              },
              vinInput1: function(t) {
                var e = t.detail.value,
                  n = /[\u4E00-\u9FA5]/g;
                this.$nextTick((function() {
                  this.carDetail.ppxh = e.replace(n, "").toUpperCase()
                }))
              },
              bindDateChange: function(t) {
                this.carDetail.zcsj = t.detail.value
              },
              cllxAction: function() {
                this.requestCllxList()
              },
              cllxSelectAction: function(t, e) {
                this.carDetail.cllx = t.zdbm, this.carDetail.cllxmc = t.zdz, this.carDetail.kz4 = "", this.carDetail.kz3 = "", this.active = e;
                var n = this;
                setTimeout((function() {
                  n.$refs.cllx.close()
                }), 300)
              },
              requestCarDetail: function() {
                var t = this;
                return (0, r.default)(a.default.mark((function e() {
                  var n;
                  return a.default.wrap((function(e) {
                    for (;;) switch (e.prev = e.next) {
                      case 0:
                        return e.next = 2, t.$myRequest({
                          url: "/vehicleController/getInfo",
                          data: {
                            vId: t.vId
                          }
                        });
                      case 2:
                        200 == (n = e.sent).code && (t.carDetail = n.data, "01" == n.data.cllx ? t.active = 0 : t.active = 1);
                      case 4:
                      case "end":
                        return e.stop()
                    }
                  }), e)
                })))()
              },
              saveChangeAction: function() {
                var e = this;
                return this.util.isEmptyString(this.carDetail.ppxh) ? t.showToast({
                  title: "请输入品牌型号",
                  icon: "none"
                }) : this.util.isNumAndLetterString(this.carDetail.ppxh.replace(/\s*/g, "")) ? this.util.isEmptyString(this.carDetail.fdjh.replace(/\s*/g, "")) ? t.showToast({
                  title: "请输入发动机号",
                  icon: "none"
                }) : "货车" === this.carDetail.cllxmc && this.util.isEmptyString(this.carDetail.kz3) ? t.showToast({
                  title: "请选择行驶证载明的车辆类型",
                  icon: "none"
                }) : (this.isEdit = !0, void this.$nextTick((function(t) {
                  e.requestChange()
                }))) : t.showToast({
                  title: "请输入字母数字，忽略大小写和其它字符",
                  icon: "none"
                })
              },
              requestChange: function() {
                var e = this;
                return (0, r.default)(a.default.mark((function n() {
                  var i, r;
                  return a.default.wrap((function(n) {
                    for (;;) switch (n.prev = n.next) {
                      case 0:
                        return i = e, setTimeout((function() {
                          i.isEdit = !1
                        }), 1500), n.next = 4, i.$myRequest({
                          url: "/vehicleController/edit",
                          data: i.carDetail
                        });
                      case 4:
                        200 == (r = n.sent).code ? (t.showToast({
                          title: r.msg,
                          icon: "none"
                        }), setTimeout((function() {
                          t.navigateBack()
                        }), 1500)) : t.showToast({
                          title: r.msg,
                          icon: "none"
                        });
                      case 6:
                      case "end":
                        return n.stop()
                    }
                  }), n)
                })))()
              },
              goCllx: function() {
                t.navigateTo({
                  url: "/pagesClgl/cllx/cllx"
                })
              },
              goHideJia: function(t) {
                7 == t && (this.isJia = !1)
              }
            }
          };
          e.default = c
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).default)
      },
    154:
      /*!*******************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/edit/edit.vue?vue&type=style&index=0&lang=scss& ***!
        \*******************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var i = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/postcss-loader/src??ref--8-oneOf-1-3!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./edit.vue?vue&type=style&index=0&lang=scss& */ 155),
          a = n.n(i);
        for (var r in i)["default"].indexOf(r) < 0 && function(t) {
          n.d(e, t, (function() {
            return i[t]
          }))
        }(r);
        e.default = a.a
      },
    155:
      /*!***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!./node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!./node_modules/postcss-loader/src??ref--8-oneOf-1-3!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/edit/edit.vue?vue&type=style&index=0&lang=scss& ***!
        \***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {}
  },
  [
    [148, "common/runtime", "common/vendor"]
  ]
]);