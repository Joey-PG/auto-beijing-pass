(global.webpackJsonp = global.webpackJsonp || []).push([
  ["pagesClgl/add/add"], {
    140:
      /*!**************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/main.js?{"page":"pagesClgl%2Fadd%2Fadd"} ***!
        \**************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        (function(t, e) {
          var i = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          n( /*! uni-pages */ 26);
          i(n( /*! vue */ 25));
          var c = i(n( /*! ./pagesClgl/add/add.vue */ 141));
          t.__webpack_require_UNI_MP_PLUGIN__ = n, e(c.default)
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/wx.js */ 1).default, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).createPage)
      },
    141:
      /*!*******************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/add/add.vue ***!
        \*******************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var i = n( /*! ./add.vue?vue&type=template&id=44592778& */ 142),
          c = n( /*! ./add.vue?vue&type=script&lang=js& */ 144);
        for (var l in c)["default"].indexOf(l) < 0 && function(t) {
          n.d(e, t, (function() {
            return c[t]
          }))
        }(l);
        n( /*! ./add.vue?vue&type=style&index=0&lang=scss& */ 146);
        var s = n( /*! ../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/runtime/componentNormalizer.js */ 35),
          o = Object(s.default)(c.default, i.render, i.staticRenderFns, !1, null, null, null, !1, i.components, void 0);
        o.options.__file = "pagesClgl/add/add.vue", e.default = o.exports
      },
    142:
      /*!**************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/add/add.vue?vue&type=template&id=44592778& ***!
        \**************************************************************************************************/
      /*! exports provided: render, staticRenderFns, recyclableRender, components */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var i = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./add.vue?vue&type=template&id=44592778& */ 143);
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
    143:
      /*!**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/add/add.vue?vue&type=template&id=44592778& ***!
        \**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! exports provided: render, staticRenderFns, recyclableRender, components */
      function(t, e, n) {
        "use strict";
        var i;
        n.r(e), n.d(e, "render", (function() {
          return c
        })), n.d(e, "staticRenderFns", (function() {
          return s
        })), n.d(e, "recyclableRender", (function() {
          return l
        })), n.d(e, "components", (function() {
          return i
        }));
        try {
          i = {
            uniIcons: function() {
              return Promise.all( /*! import() | uni_modules/uni-icons/components/uni-icons/uni-icons */ [n.e("common/vendor"), n.e("uni_modules/uni-icons/components/uni-icons/uni-icons")]).then(n.bind(null, /*! @/uni_modules/uni-icons/components/uni-icons/uni-icons.vue */ 462))
            },
            uniPopup: function() {
              return n.e( /*! import() | uni_modules/uni-popup/components/uni-popup/uni-popup */ "uni_modules/uni-popup/components/uni-popup/uni-popup").then(n.bind(null, /*! @/uni_modules/uni-popup/components/uni-popup/uni-popup.vue */ 440))
            }
          }
        } catch (t) {
          if (-1 === t.message.indexOf("Cannot find module") || -1 === t.message.indexOf(".vue")) throw t;
          console.error(t.message), console.error("1. 排查组件名称拼写是否正确"), console.error("2. 排查组件是否符合 easycom 规范，文档：https://uniapp.dcloud.net.cn/collocation/pages?id=easycom"), console.error("3. 若组件不符合 easycom 规范，需手动引入，并在 components 中注册该组件")
        }
        var c = function() {
            var t = this,
              e = t.$createElement,
              n = (t._self._c, t.hphm.length),
              i = t.hphm.length,
              c = t.hpzlmc.length,
              l = t.hpzlmc.length,
              s = t.zcsj.length,
              o = t.zcsj.length,
              r = t.cllxmc.length,
              a = t.cllxmc.length,
              u = "货车" === t.cllxmc ? t.kz4.length : null,
              p = "货车" === t.cllxmc ? t.kz4.length : null,
              h = t.__map(t.number, (function(e, n) {
                var i = t.__get_orig(e),
                  c = e == t.tmp_hphm.length && 8 != e,
                  l = n == t.number - 1 && !t.tmp_hphm.substr(e, 1) && t.isJia;
                return {
                  $orig: i,
                  g10: c,
                  g11: l,
                  g12: l ? null : t.tmp_hphm.substr(n, 1)
                }
              })),
              d = t.tmp_hphm.length;
            t.$mp.data = Object.assign({}, {
              $root: {
                g0: n,
                g1: i,
                g2: c,
                g3: l,
                g4: s,
                g5: o,
                g6: r,
                g7: a,
                g8: u,
                g9: p,
                l0: h,
                g13: d
              }
            })
          },
          l = !1,
          s = [];
        c._withStripped = !0
      },
    144:
      /*!********************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/add/add.vue?vue&type=script&lang=js& ***!
        \********************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var i = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/babel-loader/lib!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./add.vue?vue&type=script&lang=js& */ 145),
          c = n.n(i);
        for (var l in i)["default"].indexOf(l) < 0 && function(t) {
          n.d(e, t, (function() {
            return i[t]
          }))
        }(l);
        e.default = c.a
      },
    145:
      /*!***************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/babel-loader/lib!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/add/add.vue?vue&type=script&lang=js& ***!
        \***************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        (function(t) {
          var i = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          Object.defineProperty(e, "__esModule", {
            value: !0
          }), e.default = void 0;
          var c = i(n( /*! @babel/runtime/regenerator */ 30)),
            l = i(n( /*! @babel/runtime/helpers/asyncToGenerator */ 32));
          var s = {
            mounted: function() {
              var e = this;
              t.$on("car_type_selected", (function(t) {
                e.cllx = t.zdbm, e.cllxmc = t.zdz, e.kz3 = "", e.kz4 = ""
              })), t.$on("car_scan_result", (function(t) {
                e.hphm = t.hphm, e.fdjh = t.fdjh, e.ppxh = t.ppxh, e.cllx = t.cllx, e.cllxmc = t.cllxmc, e.zcsj = t.zcrq
              })), t.$on("carDetailSelect", (function(t) {
                e.kz3 = t.zdbm, e.kz4 = t.zdz
              }))
            },
            data: function() {
              return {
                isAdd: !1,
                isJia: !0,
                number: 8,
                endDate: (t = new Date, e = t.getFullYear(), n = t.getMonth() + 1, i = t.getDate(), n = n > 9 ? n : "0" + n, i = i > 9 ? i : "0" + i, "".concat(e, "-").concat(n, "-").concat(i)),
                inputAreaItems: ["冀", "津", "湘", "宁", "晋", "蒙", "辽", "吉", "黑", "沪", "苏", "浙", "皖", "闽", "赣", "鲁", "豫", "鄂", "粤", "桂", "琼", "川", "贵", "云", "渝", "藏", "陕", "甘", "青", "新"],
                inputHeadItems: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
                active: null,
                hpzlList: [],
                typeList: [],
                tmp_hphm: "",
                hphm: "",
                hpzl: "",
                hpzlmc: "",
                cllx: "",
                cllxmc: "",
                fdjh: "",
                ppxh: "",
                zcsj: "",
                kz4: "",
                kz3: "",
                isShow: getApp().globalData.config.ocrkg
              };
              var t, e, n, i
            },
            methods: {
              clickImg: function() {
                t.previewImage({
                  urls: ["/pagesClgl/static/tjcl_tip_demo.png"],
                  current: "",
                  success: function(t) {},
                  fail: function(t) {},
                  complete: function(t) {}
                })
              },
              requestCllxList: function() {
                var t = this;
                return (0, l.default)(c.default.mark((function e() {
                  var n;
                  return c.default.wrap((function(e) {
                    for (;;) switch (e.prev = e.next) {
                      case 0:
                        return e.next = 2, t.$myRequest({
                          url: "/ucDicController/queryDic",
                          data: {
                            type: "CLLXFL_HLW"
                          }
                        });
                      case 2:
                        200 == (n = e.sent).code && (t.typeList = n.data), t.$refs.cllx.open();
                      case 5:
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
                this.$refs.popup.open(), this.tmp_hphm = this.hphm
              },
              cancelAction: function() {
                this.$refs.popup.close()
              },
              confirmAction: function() {
                this.tmp_hphm.length ? (this.$refs.popup.close(), this.hphm = this.tmp_hphm) : t.showToast({
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
              scanAction: function() {
                t.navigateTo({
                  url: "/pagesClgl/camera/camera"
                })
              },
              tjclAction: function() {
                var e = this;
                return this.util.isEmptyString(this.hphm) ? t.showToast({
                  title: "请输入号牌号码",
                  icon: "none"
                }) : this.util.isEmptyString(this.hpzl) ? t.showToast({
                  title: "请输入号牌种类",
                  icon: "none"
                }) : this.util.isEmptyString(this.fdjh.replace(/\s*/g, "")) ? t.showToast({
                  title: "请输入发动机号",
                  icon: "none"
                }) : this.util.isEmptyString(this.ppxh.replace(/\s*/g, "")) ? t.showToast({
                  title: "请输入品牌型号",
                  icon: "none"
                }) : this.util.isNumAndLetterString(this.ppxh) ? this.util.isEmptyString(this.zcsj) ? t.showToast({
                  title: "请按行驶证选择车辆注册日期",
                  icon: "none"
                }) : this.util.isEmptyString(this.cllx) ? t.showToast({
                  title: "请选择车辆类型",
                  icon: "none"
                }) : "货车" === this.cllxmc && this.util.isEmptyString(this.kz3) ? t.showToast({
                  title: "请选择行驶证载明的车辆类型",
                  icon: "none"
                }) : (this.isAdd = !0, void this.$nextTick((function(t) {
                  e.requestAddCar()
                }))) : t.showToast({
                  title: "请输入字母数字，忽略大小写和其它字符",
                  icon: "none"
                })
              },
              requestAddCar: function() {
                var e = this;
                return (0, l.default)(c.default.mark((function n() {
                  var i, l;
                  return c.default.wrap((function(n) {
                    for (;;) switch (n.prev = n.next) {
                      case 0:
                        return i = e, setTimeout((function() {
                          i.isAdd = !1
                        }), 1500), n.next = 4, e.$myRequest({
                          url: "/relationController/add",
                          data: {
                            relation: {},
                            vehicle: {
                              hphm: e.hphm,
                              hpzl: e.hpzl,
                              hpzlmc: e.hpzlmc,
                              cllx: e.cllx,
                              cllxmc: e.cllxmc,
                              fdjh: e.fdjh.replace(/\s*/g, ""),
                              ppxh: e.ppxh.replace(/\s*/g, ""),
                              zcsj: e.zcsj,
                              kz3: e.kz3
                            }
                          }
                        });
                      case 4:
                        200 == (l = n.sent).code && (t.showToast({
                          title: l.msg,
                          icon: "none"
                        }), setTimeout((function() {
                          t.navigateBack()
                        }), 1500));
                      case 6:
                      case "end":
                        return n.stop()
                    }
                  }), n)
                })))()
              },
              bindDateChange: function(t) {
                this.zcsj = t.detail.value
              },
              hpzlAction: function() {
                this.requestHpzlList()
              },
              hpzlSelectAction: function(t) {
                this.hpzl = t.zdbm, this.hpzlmc = t.zdz;
                var e = this;
                setTimeout((function() {
                  e.$refs.hpzl.close()
                }), 300)
              },
              cllxAction: function() {
                this.requestCllxList()
              },
              cllxDetail: function() {
                t.navigateTo({
                  url: "/pagesClgl/CartypeDetail?kz3=".concat(this.kz3)
                })
              },
              cllxSelectAction: function(t, e) {
                this.cllx = t.zdbm, this.cllxmc = t.zdz, this.active = e, this.kz4 = "", this.kz3 = "";
                var n = this;
                setTimeout((function() {
                  n.$refs.cllx.close()
                }), 300)
              },
              requestHpzlList: function() {
                var t = this;
                return (0, l.default)(c.default.mark((function e() {
                  var n;
                  return c.default.wrap((function(e) {
                    for (;;) switch (e.prev = e.next) {
                      case 0:
                        return e.next = 2, t.$myRequest({
                          url: "/ucDicController/queryDic",
                          data: {
                            type: "HPZL_HLW"
                          }
                        });
                      case 2:
                        (n = e.sent).code && (t.hpzlList = n.data, t.hpzlList.forEach((function(t) {
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
              goZcgd: function() {
                t.navigateTo({
                  url: "/pagesOther/zcgd/zcgd"
                })
              },
              vinInput: function(t) {
                var e = t.detail.value;
                this.$nextTick((function() {
                  this.fdjh = e.replace(/[^_a-zA-Z0-9'无']/g, "").toUpperCase()
                }))
              },
              vinInput1: function(t) {
                var e = t.detail.value,
                  n = /[\u4E00-\u9FA5]/g;
                this.$nextTick((function() {
                  this.ppxh = e.replace(n, "").toUpperCase()
                }))
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
          e.default = s
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).default)
      },
    146:
      /*!*****************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/add/add.vue?vue&type=style&index=0&lang=scss& ***!
        \*****************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {
        "use strict";
        n.r(e);
        var i = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/postcss-loader/src??ref--8-oneOf-1-3!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./add.vue?vue&type=style&index=0&lang=scss& */ 147),
          c = n.n(i);
        for (var l in i)["default"].indexOf(l) < 0 && function(t) {
          n.d(e, t, (function() {
            return i[t]
          }))
        }(l);
        e.default = c.a
      },
    147:
      /*!*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!./node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!./node_modules/postcss-loader/src??ref--8-oneOf-1-3!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pagesClgl/add/add.vue?vue&type=style&index=0&lang=scss& ***!
        \*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(t, e, n) {}
  },
  [
    [140, "common/runtime", "common/vendor"]
  ]
]);