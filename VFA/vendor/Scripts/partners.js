function getPartnerImage(partner_name) {
    var partner_image = "";
    switch (partner_name) {
        case "교보생명":
            partner_image = "assets/partner/partner03.png";
            break;
        case "동양생명보험":
        case "동양생명":
            partner_image = "assets/partner/partner22.png";
            break;
        case "라이나생명":
            partner_image = "assets/partner/partner20.png";
            break;
        case "롯데손보":
            partner_image = "assets/partner/partner31.png";
            break;
        case "미래에셋생명":
            partner_image = "assets/partner/partner11.png";
            break;
        case "메리츠화재":
            partner_image = "assets/partner/partner27.png";
            break;
        case "삼성생명":
            partner_image = "assets/partner/partner01.png";
            break;
        case "삼성화재":
            partner_image = "assets/partner/partner29.png";
            break;
        case "신한생명": // 신한라이프
            partner_image = "assets/partner/partner08.png";
            break;
        case "신한라이프":
            partner_image = "assets/partner/partner43.png";
            break;
        case "알리안츠생명":
        case "알리안츠생명보험":
            partner_image = "assets/partner/partner09.png";
            break;
        case "푸르덴셜생명": // KB라이프
            partner_image = "assets/partner/partner07.png";
            break;
        case "한국줄기세포":
            partner_image = "assets/partner/partner39.png";
            break;
        case "한화생명":
            partner_image = "assets/partner/partner02.png";
            break;
        case "한화손보":
            partner_image = "assets/partner/partner28.png";
            break;
        case "현대라이프":
        case "푸본현대생명":
            partner_image = "assets/partner/partner12.png";
            break;
        case "현대해상":
            partner_image = "assets/partner/partner25.png";
            break;
        case "흥국생명":
            partner_image = "assets/partner/partner13.png";
            break;
        case "흥국화재":
            partner_image = "assets/partner/partner30.png";
            break;
        case "ABL생명":
            partner_image = "assets/partner/partner41.png";
            break;
        case "AIA생명":
            partner_image = "assets/partner/partner14.png";
            break;
        case "AIG손보":
            partner_image = "assets/partner/partner33.png";
            break;
        case "CHUBB":
        case "처브라이프":
        case "처브라이프생명":
            partner_image = "assets/partner/partner06.png";
            break;
        case "DAS법률비용보험":
            partner_image = "assets/partner/partner40.png";
            break;
        case "DB생명":
            partner_image = "assets/partner/partner21.png";
            break;
        case "DB손보":
            partner_image = "assets/partner/partner26.png";
            break;
        case "DGB생명":
            partner_image = "assets/partner/partner15.png";
            break;
        case "ING생명보험":
            partner_image = "assets/partner/partner16.png";
            break;
        case "KB생명":
        case "KB라이프":
        case "KB라이프P":
        case "KB라이프생명":
        case "KB라이프생명P":
        case "KB라이프생명(KB생명)":
        case "KB라이프생명(푸르덴셜생명)":
        case "KB라이프생명(푸르덴셜)":
            partner_image = "assets/partner/partner17.png";
            break;
        case "KB손보":
            partner_image = "assets/partner/partner23.png";
            break;
        case "KDB생명":
            partner_image = "assets/partner/partner18.png";
            break;
        case "MetLife":
        case "메트라이프":
        case "메트라이프생명":
            partner_image = "assets/partner/partner04.png";
            break;
        case "MG손보":
            partner_image = "assets/partner/partner24.png";
            break;
        case "NH농협생명":
            partner_image = "assets/partner/partner19.png";
            break;
        case "NH농협손보":
            partner_image = "assets/partner/partner32.png";
            break;
        case "PCA생명":
            partner_image = "assets/partner/partner05.png";
            break;
        case "하나생명":
            partner_image = "assets/partner/partner42.png";
            break;
        case "하나손해보험":
        case "하나손보":
            partner_image = "assets/partner/partner44.png";
            break;
        case "카디프생명보험":
        case "BNP파리바카디프생명":
            partner_image = "assets/partner/partner45.png";
            break;
        case "IBK연금보험":
            partner_image = "assets/partner/partner46.png";
            break;
        case "아이오르카":
            partner_image = "assets/partner/partner99.png";
            break;
        case "iM라이프":
            partner_image = "assets/partner/partner47.png";
            break;
        default:
            partner_image = "assets/partner/no_img.gif";
            break;
    }

    if (partner_name != undefined && (partner_image == "" || partner_image == "assets/partner/no_img.gif")) {
        console.log("Image Not Found, partner_name = " + partner_name);
    }

    return partner_image;
}