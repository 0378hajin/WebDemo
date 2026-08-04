(function (window) {
    "use strict";
    window.urlReturnJsonAPI = "demo://index";
    window.httpPost = function (_, raw) {
        var params = typeof raw === "string" ? JSON.parse(raw || "{}") : (raw || {});
        var items = [];
        if (params.cmd === "MobileHomeMemberInfo") {
            items = [{ member_name:"포트폴리오", member_mobile:"1544-8141", corp_hr_id:"F000", corp_jop_position:"개발자", corp_level:"", dept_name:"서비스개발" }];
        } else if (params.cmd === "MemberInfo") {
            items = [{ member_id:"demo-member", member_name:"포트폴리오" }];
        } else if (params.cmd === "MobileHomeSearch") {
            items = [{ app_name:"메디코드", app_url:"Intro.html", blank_yn:"0" }];
        }
        return Promise.resolve({ result:1, msg:"정상 처리", items:items });
    };
    window.VueAlert = function (error) { console.error(error); };
}(window));
