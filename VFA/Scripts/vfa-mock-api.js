(function (window) {
    "use strict";

    var member = {
        member_id: "demo.vfa@example.com",
        member_name: "김데모",
        member_mobile: "010-0000-0000",
        hashed_passwd: "",
        encrypt_social_number: "",
        member_img_path: "",
        member_birth: "1993-04-15",
        member_gender: "1",
        member_status: "1",
        reg_dtm: "2026-07-01 오전 10:00:00",
        cus_id: "0",
        withdraw_yn: "2",
        withdraw_memo: "",
        marketing_yn: "1",
        fa_hrid: "F000",
        fa_mohom_id: "DEMO_FA",
        login_count: "1"
    };

    var contract = {
        id: "1001",
        member_id: member.member_id,
        corp_name: "iM라이프",
        ifa_item_code: "DEMO001",
        item_code: "DEMO-VFA-001",
        item_name: "스마트 변액연금보험 (데모)",
        item_display_name: "스마트 변액연금보험",
        contract_date: "2026-07-22",
        account_number: "DEMO-ACCOUNT-001",
        invest_amount: "300000",
        contract_money: "15000000",
        stock_code: "DEMO-STOCK-001",
        req_yn: "N",
        keep_state: "정상",
        contract_status: "정상",
        reg_dtm: "2026-07-31 오후 2:30:00"
    };

    var managedContract = Object.assign({}, contract, {
        id: "2001",
        invest_type_01: "1",
        invest_type_02: "1",
        invest_purpose: "1",
        target_age: "65",
        cus_birth: member.member_birth,
        gp_apply_yn: "1",
        alarm_yn: "1",
        fund_name_list: "글로벌주식형,미국채권형,단기채권형",
        fund_ratio_list: "50,25,25",
        create_dtm: "2026-08-04 오전 10:40:00",
        update_date: "2026-11-02",
        update_days: "90",
        days_remaining: "90",
        display_yn: "1"
    });

    try {
        var savedConfig = JSON.parse(sessionStorage.getItem("vfaDemoReservedConfig") || "null");
        if (savedConfig) Object.assign(managedContract, savedConfig);
    } catch (error) {
        console.warn("VFA 데모 설정 복원 실패", error);
    }

    var corpList = [
        { id:"1", corp_code:"L31", corp_name:"iM라이프" },
        { id:"2", corp_code:"D02", corp_name:"샘플라이프" },
        { id:"3", corp_code:"D03", corp_name:"포트폴리오보험" }
    ];

    var itemList = [
        { id:"101", corp_name:"iM라이프", item_name:"스마트 변액연금보험 (데모)", item_display_name:"스마트 변액연금보험", item_code:"DEMO-VFA-001", ifa_item_code:"DEMO001" },
        { id:"102", corp_name:"iM라이프", item_name:"글로벌 변액적립보험 (데모)", item_display_name:"글로벌 변액적립보험", item_code:"DEMO-VFA-002", ifa_item_code:"DEMO002" }
    ];

    var recommendedFunds = [
        { id:"3001", std_date:"2026-08-04", item_code:managedContract.item_code, fund_code:"DEMO-FUND-01", fund_ratio:"50", fund_price:"1000.00", safe_yn:"1", fund_name:"글로벌주식형" },
        { id:"3002", std_date:"2026-08-04", item_code:managedContract.item_code, fund_code:"DEMO-FUND-02", fund_ratio:"25", fund_price:"1250.50", safe_yn:"2", fund_name:"미국채권형" },
        { id:"3003", std_date:"2026-08-04", item_code:managedContract.item_code, fund_code:"DEMO-FUND-03", fund_ratio:"25", fund_price:"1015.30", safe_yn:"2", fund_name:"단기채권형" }
    ];

    var rebalancingList = [{
        id: "4001",
        contract_id: managedContract.id,
        std_date: "2026-08-04",
        item_name: managedContract.item_name,
        sell_corp_name: managedContract.corp_name,
        check_yn: "N",
        check_dtm: ""
    }];

    var rebalancingDetail = [
        { data_type:"BEFORE", contract_id:managedContract.id, std_date:"2026-08-04", fund_code:"OLD-FUND-01", fund_ratio:"60", fund_name:"국내주식형" },
        { data_type:"BEFORE", contract_id:managedContract.id, std_date:"2026-08-04", fund_code:"OLD-FUND-02", fund_ratio:"40", fund_name:"글로벌채권형" },
        { data_type:"AFTER", contract_id:managedContract.id, std_date:"2026-08-04", fund_code:"DEMO-FUND-01", fund_ratio:"50", fund_name:"글로벌주식형" },
        { data_type:"AFTER", contract_id:managedContract.id, std_date:"2026-08-04", fund_code:"DEMO-FUND-02", fund_ratio:"25", fund_name:"미국채권형" },
        { data_type:"AFTER", contract_id:managedContract.id, std_date:"2026-08-04", fund_code:"DEMO-FUND-03", fund_ratio:"25", fund_name:"단기채권형" }
    ];

    function simulationItems() {
        var items = [];
        var cursor = new Date(2023, 6, 1);
        var index = 0;
        while (cursor <= new Date(2026, 7, 1)) {
            var year = cursor.getFullYear();
            var month = String(cursor.getMonth() + 1).padStart(2, "0");
            items.push({
                id: String(5000 + index),
                item_code: managedContract.item_code,
                std_date: year + "-" + month + "-01",
                bm_price: (1000 + index * 6 + Math.sin(index / 2) * 18).toFixed(2),
                simul_price: (1000 + index * 9 + Math.sin(index / 2.4) * 22).toFixed(2),
                reg_dtm: "2026-08-04 오전 10:00:00"
            });
            cursor.setMonth(cursor.getMonth() + 1);
            index += 1;
        }
        return items;
    }

    function result(items, extra) {
        return Object.assign({ result:1, msg:"정상 처리", items:items || [] }, extra || {});
    }

    function response(params) {
        var command = params.cmd;
        if (command === "VFAConfigReservedSave") {
            ["invest_type_01", "invest_type_02", "invest_purpose", "target_age", "gp_apply_yn", "update_days"].forEach(function (key) {
                if (params[key] !== undefined && params[key] !== null && String(params[key]) !== "") {
                    managedContract[key] = String(params[key]);
                }
            });
            sessionStorage.setItem("vfaDemoReservedConfig", JSON.stringify({
                invest_type_01:managedContract.invest_type_01,
                invest_type_02:managedContract.invest_type_02,
                invest_purpose:managedContract.invest_purpose,
                target_age:managedContract.target_age,
                gp_apply_yn:managedContract.gp_apply_yn,
                update_days:managedContract.update_days
            }));
            return result([managedContract]);
        }
        if (command === "VFAConfigReserved") return result([managedContract]);
        var responses = {
            MemberInfoIM: result([member]),
            MemberContract: result([contract]),
            MemberContractMP: result([managedContract]),
            MemberContractView: result([managedContract]),
            MemberContractByCode: result([contract]),
            GetPFList: result([]),
            GetPFListView: result([contract]),
            GetPFCustomList: result([]),
            MPList: result([managedContract]),
            VFACorpInfo: result([{ id:"1", corp_name:"iM라이프", corp_tel:"1588-0000", corp_url:"#" }]),
            MobileHomeMemberInfo: result([{ member_name:"김데모", member_mobile:"010-0000-0000", corp_name:"포트폴리오", corp_jop_position:"개발자", corp_level:"", member_img_path:"" }]),
            BMFund: result([{ fund_name:"글로벌 혼합지수" }]),
            SimulList: result(simulationItems()),
            RebalacingView: result(recommendedFunds),
            RebalancingList: result(rebalancingList),
            RebalancingDetail: result(rebalancingDetail),
            CorpList: result(corpList),
            VFAItem: result(itemList),
            VFACorpList: result(corpList),
            VFAItemList: result(itemList),
            HasVFAContract: result([]),
            SaveMemberInfo: result([]),
            VFAContractAdd: result([{ id:managedContract.id }]),
            MemberContractAdd: result([{ id:contract.id, result:"OK" }]),
            ContractAddIM: result([]),
            MemberAddIM: result([member]),
            ItemDel: result([]),
            MemberContractDel: result([]),
            ServiceReqAdd: result([]),
            RebalancingListUpdate: result([])
        };
        return responses[command] || result([]);
    }

    window.urlReturnJsonAPI = "demo://vfa";
    window.httpPost = function (_, raw) {
        var params = typeof raw === "string" ? JSON.parse(raw || "{}") : (raw || {});
        return Promise.resolve(response(params));
    };
    window.VueAlert = function (error) { console.error(error); };
    window.VFADemoData = { member:member, contract:contract, managedContract:managedContract };
}(window));
