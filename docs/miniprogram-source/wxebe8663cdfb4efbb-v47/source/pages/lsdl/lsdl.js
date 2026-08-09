(global.webpackJsonp = global.webpackJsonp || []).push([
  ["pages/lsdl/lsdl"], {
    54:
      /*!************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/main.js?{"page":"pages%2Flsdl%2Flsdl"} ***!
        \************************************************************************************/
      /*! no static exports found */
      function(e, t, n) {
        "use strict";
        (function(e, t) {
          var o = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          n( /*! uni-pages */ 26);
          o(n( /*! vue */ 25));
          var r = o(n( /*! ./pages/lsdl/lsdl.vue */ 55));
          e.__webpack_require_UNI_MP_PLUGIN__ = n, t(r.default)
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/wx.js */ 1).default, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).createPage)
      },
    55:
      /*!*****************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pages/lsdl/lsdl.vue ***!
        \*****************************************************************/
      /*! no static exports found */
      function(e, t, n) {
        "use strict";
        n.r(t);
        var o = n( /*! ./lsdl.vue?vue&type=template&id=65915e66& */ 56),
          r = n( /*! ./lsdl.vue?vue&type=script&lang=js& */ 58);
        for (var s in r)["default"].indexOf(s) < 0 && function(e) {
          n.d(t, e, (function() {
            return r[e]
          }))
        }(s);
        n( /*! ./lsdl.vue?vue&type=style&index=0&lang=scss& */ 60);
        var i = n( /*! ../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/runtime/componentNormalizer.js */ 35),
          a = Object(i.default)(r.default, o.render, o.staticRenderFns, !1, null, null, null, !1, o.components, void 0);
        a.options.__file = "pages/lsdl/lsdl.vue", t.default = a.exports
      },
    56:
      /*!************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pages/lsdl/lsdl.vue?vue&type=template&id=65915e66& ***!
        \************************************************************************************************/
      /*! exports provided: render, staticRenderFns, recyclableRender, components */
      function(e, t, n) {
        "use strict";
        n.r(t);
        var o = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./lsdl.vue?vue&type=template&id=65915e66& */ 57);
        n.d(t, "render", (function() {
          return o.render
        })), n.d(t, "staticRenderFns", (function() {
          return o.staticRenderFns
        })), n.d(t, "recyclableRender", (function() {
          return o.recyclableRender
        })), n.d(t, "components", (function() {
          return o.components
        }))
      },
    57:
      /*!************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pages/lsdl/lsdl.vue?vue&type=template&id=65915e66& ***!
        \************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! exports provided: render, staticRenderFns, recyclableRender, components */
      function(e, t, n) {
        "use strict";
        var o;
        n.r(t), n.d(t, "render", (function() {
          return r
        })), n.d(t, "staticRenderFns", (function() {
          return i
        })), n.d(t, "recyclableRender", (function() {
          return s
        })), n.d(t, "components", (function() {
          return o
        }));
        try {
          o = {
            uniPopup: function() {
              return n.e( /*! import() | uni_modules/uni-popup/components/uni-popup/uni-popup */ "uni_modules/uni-popup/components/uni-popup/uni-popup").then(n.bind(null, /*! @/uni_modules/uni-popup/components/uni-popup/uni-popup.vue */ 440))
            }
          }
        } catch (e) {
          if (-1 === e.message.indexOf("Cannot find module") || -1 === e.message.indexOf(".vue")) throw e;
          console.error(e.message), console.error("1. 排查组件名称拼写是否正确"), console.error("2. 排查组件是否符合 easycom 规范，文档：https://uniapp.dcloud.net.cn/collocation/pages?id=easycom"), console.error("3. 若组件不符合 easycom 规范，需手动引入，并在 components 中注册该组件")
        }
        var r = function() {
            var e = this.$createElement;
            this._self._c
          },
          s = !1,
          i = [];
        r._withStripped = !0
      },
    58:
      /*!******************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pages/lsdl/lsdl.vue?vue&type=script&lang=js& ***!
        \******************************************************************************************/
      /*! no static exports found */
      function(e, t, n) {
        "use strict";
        n.r(t);
        var o = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/babel-loader/lib!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./lsdl.vue?vue&type=script&lang=js& */ 59),
          r = n.n(o);
        for (var s in o)["default"].indexOf(s) < 0 && function(e) {
          n.d(t, e, (function() {
            return o[e]
          }))
        }(s);
        t.default = r.a
      },
    59:
      /*!*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/babel-loader/lib!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pages/lsdl/lsdl.vue?vue&type=script&lang=js& ***!
        \*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(e, t, n) {
        "use strict";
        (function(e) {
          var o = n( /*! @babel/runtime/helpers/interopRequireDefault */ 4);
          Object.defineProperty(t, "__esModule", {
            value: !0
          }), t.default = void 0;
          var r = o(n( /*! @babel/runtime/regenerator */ 30)),
            s = o(n( /*! @babel/runtime/helpers/asyncToGenerator */ 32)),
            i = {
              onShow: function() {},
              onLoad: function(e) {
                this.getVerifyCodeImg()
              },
              data: function() {
                return {
                  loginType: {},
                  jsy: {
                    xm: "",
                    sfzh: "",
                    sjhm: "",
                    txyzm: ""
                  },
                  verifyCodeImg: "",
                  verifyCodeToken: "",
                  isVerifyCodeTure: !1,
                  icon_selected_url: "/static/bzzx/jjzsm_selected.png",
                  icon_unselected_url: "/static/bzzx/jjzsm_unselected.png",
                  agree: !1,
                  wtxr: !1,
                  isShow: getApp().globalData.config.ocrkg,
                  _timer: null,
                  dxyzm: "",
                  minTime: 60,
                  uuid: "",
                  sjhmyc: "",
                  txyzmFlag: !0
                }
              },
              methods: {
                close: function() {
                  this.dxyzm = "", this.$refs.popup.close()
                },
                agreeAction: function() {
                  this.agree = !this.agree
                },
                isChinese: function(e) {
                  var t = this;
                  e && (clearTimeout(this._timer), this._timer = setTimeout((function() {
                    t.chineseTest(e) || t.showToast("姓名")
                  }), 300))
                },
                chineseTest: function(e) {
                  var t = !0;
                  return (!/^[\u4e00-\u9fa5\·]+$/gi.test(e) || e.length > 15) && (t = !1), t
                },
                isIdcard: function(e) {
                  var t = this;
                  e && (clearTimeout(this._timer), this._timer = setTimeout((function() {
                    t.idcardTest(e) || t.showToast("身份证号码")
                  }), 300))
                },
                idcardTest: function(e) {
                  var t = !0;
                  return /^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X)$/.test(e) && 18 === e.length || (t = !1), t
                },
                isPhone: function(e) {
                  var t = this;
                  e && (clearTimeout(this._timer), this._timer = setTimeout((function() {
                    t.phoneTest(e) || t.showToast("手机号码")
                  }), 300))
                },
                phoneTest: function(e) {
                  var t = !0;
                  return /^1[3-9]\d{9}$/.test(e) || (t = !1), t
                },
                isCaptcha: function(e) {},
                getVerifyCodeImg: function() {
                  var e = this;
                  return (0, s.default)(r.default.mark((function t() {
                    var n;
                    return r.default.wrap((function(t) {
                      for (;;) switch (t.prev = t.next) {
                        case 0:
                          return t.next = 2, e.$myRequest({
                            baseUrl: "auth",
                            url: "/userController/getPicCode?t=".concat(Math.random()),
                            method: "GET"
                          });
                        case 2:
                          n = t.sent, e.uuid = n.data.uuid, e.verifyCodeImg = "data:image/png;base64," + n.data.img;
                        case 5:
                        case "end":
                          return t.stop()
                      }
                    }), t)
                  })))()
                },
                showToast: function(t) {
                  return e.showToast({
                    title: "".concat(t, "格式错误！"),
                    icon: "none"
                  })
                },
                gotoOtherPage: function(t) {
                  1 === t ? e.navigateTo({
                    url: "/pagesOther/yhxy/yhxy"
                  }) : e.navigateTo({
                    url: "/pagesOther/yszc/yszc"
                  })
                },
                getCode: function() {
                  var e = this,
                    t = null;
                  t = setInterval((function() {
                    --e.minTime, 0 === e.minTime && (clearInterval(t), e.minTime = 60)
                  }), 1e3), 60 === e.minTime && e.getphoneCode()
                },
                getphoneCode: function() {
                  var e = this;
                  return (0, s.default)(r.default.mark((function t() {
                    return r.default.wrap((function(t) {
                      for (;;) switch (t.prev = t.next) {
                        case 0:
                          return t.next = 2, e.$myRequest({
                            baseUrl: "auth",
                            url: "/userController/getPhoneCode",
                            method: "GET",
                            data: {
                              phone: e.jsy.sjhm
                            }
                          });
                        case 2:
                          t.sent;
                        case 3:
                        case "end":
                          return t.stop()
                      }
                    }), t)
                  })))()
                },
                nextAction: function() {
                  return this.agree ? (this.txyzmFlag = !0, this.loginTypes(), this.chineseTest(this.jsy.xm) ? this.idcardTest(this.jsy.sfzh) ? this.phoneTest(this.jsy.sjhm) ? this.jsy.txyzm ? void this.login() : e.showToast({
                    title: "请输入图形验证码！",
                    icon: "none"
                  }) : this.showToast("手机号") : this.showToast("身份证号码") : this.showToast("姓名")) : e.showToast({
                    title: "请先勾选同意协议和隐私政策",
                    icon: "none"
                  })
                },
                login: function() {
                  var t = arguments,
                    n = this;
                  return (0, s.default)(r.default.mark((function o() {
                    var s, i;
                    return r.default.wrap((function(o) {
                      for (;;) switch (o.prev = o.next) {
                        case 0:
                          return s = t.length > 0 && void 0 !== t[0] ? t[0] : "", i = {
                            code: n.jsy.txyzm,
                            phoneNumber: n.jsy.sjhm,
                            sfzmhm: n.jsy.sfzh,
                            username: n.jsy.xm,
                            uuid: n.uuid,
                            source: "6ff67657da8346ddab418205e0442a64"
                          }, s && (i.phoneCode = n.dxyzm), o.next = 5, e.request({
                            url: "".concat(n.$baseUrl_auth, "/userController/loginUserJjz?t=").concat(Math.random()),
                            method: "POST",
                            data: i,
                            success: function(t) {
                              if (200 === t.data.code) {
                                var o = {
                                  sjhm: n.jsy.sjhm,
                                  yhxm: n.jsy.xm,
                                  Authorization: t.data.data
                                };
                                o && e.setStorageSync("user", o), getApp().globalData.sjhm = o.sjhm, getApp().globalData.yhxm = o.yhxm, getApp().globalData.Authorization = o.Authorization, e.navigateTo({
                                  url: "/pages/bzzx/bzzx?token=" + o.Authorization
                                })
                              } else {
                                if (500 === t.data.code && "16002" === t.data.data) return n.txyzmFlag = !1, n.getVerifyCodeImg(), e.showToast({
                                  title: t.data.msg,
                                  icon: "none"
                                });
                                if (500 !== t.data.code || "16003" !== t.data.data) return e.showToast({
                                  title: t.data.msg,
                                  icon: "none"
                                });
                                if (s || !n.loginType || "1" !== n.loginType.isStartPhoneMessage) return e.showToast({
                                  title: t.data.msg,
                                  icon: "none"
                                });
                                n.sjhmyc = n.jsy.sjhm.replace(/(\d{3})\d*(\d{4})/, "$1****$2"), n.$refs.popup.open()
                              }
                            },
                            fail: function() {}
                          });
                        case 5:
                        case "end":
                          return o.stop()
                      }
                    }), o)
                  })))()
                },
                loginTypes: function() {
                  var e = this;
                  return (0, s.default)(r.default.mark((function t() {
                    var n;
                    return r.default.wrap((function(t) {
                      for (;;) switch (t.prev = t.next) {
                        case 0:
                          return t.next = 2, e.$myRequest({
                            baseUrl: "auth",
                            url: "/userController/getLoginType",
                            method: "GET"
                          });
                        case 2:
                          n = t.sent, e.loginType = n.data;
                        case 4:
                        case "end":
                          return t.stop()
                      }
                    }), t)
                  })))()
                }
              }
            };
          t.default = i
        }).call(this, n( /*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2).default)
      },
    60:
      /*!***************************************************************************************************!*\
        !*** /Users/huazhijie/Desktop/工作/进京证/外网/WX/pages/lsdl/lsdl.vue?vue&type=style&index=0&lang=scss& ***!
        \***************************************************************************************************/
      /*! no static exports found */
      function(e, t, n) {
        "use strict";
        n.r(t);
        var o = n( /*! -!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/postcss-loader/src??ref--8-oneOf-1-3!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../../../../../../../Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./lsdl.vue?vue&type=style&index=0&lang=scss& */ 61),
          r = n.n(o);
        for (var s in o)["default"].indexOf(s) < 0 && function(e) {
          n.d(t, e, (function() {
            return o[e]
          }))
        }(s);
        t.default = r.a
      },
    61:
      /*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
        !*** ./node_modules/mini-css-extract-plugin/dist/loader.js??ref--8-oneOf-1-0!./node_modules/css-loader/dist/cjs.js??ref--8-oneOf-1-1!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-2!./node_modules/postcss-loader/src??ref--8-oneOf-1-3!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/sass-loader/dist/cjs.js??ref--8-oneOf-1-4!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--8-oneOf-1-5!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!/Users/huazhijie/Desktop/工作/进京证/外网/WX/pages/lsdl/lsdl.vue?vue&type=style&index=0&lang=scss& ***!
        \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
      /*! no static exports found */
      function(e, t, n) {}
  },
  [
    [54, "common/runtime", "common/vendor"]
  ]
]);