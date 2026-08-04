<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Disease_Plan.aspx.cs" Inherits="ifa.co.kr.Example.MediCode.Disease_Plan" ResponseEncoding="utf-8" %>
<%@ Register Src="~/Example/MediCode/WebUserControl_Top.ascx" TagName="WebUserControl_Top" TagPrefix="uc1" %>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko">
<head runat="server">
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>메디코드 보장 플랜</title>
    <link href="/MobileHome/MediCode/styles/medi_code.css?v=<%=DateTime.Now.ToString("yyyyMMddHHmmss") %>" rel="stylesheet" />
    <link href="styles/portfolio-overrides.css" rel="stylesheet" />
</head>
<body>
<form id="form1" runat="server">
    <uc1:WebUserControl_Top ID="WebUserControl_Top" runat="server" />
    <div class="wrap medi_main">
        <img src="/MobileHome/MediCode/images/g_logo.png" class="logo" alt="MediCode" />
        <p class="title mb3">나의 보장 플랜</p>

        <div class="w_box mb2">
            <p class="s_title mb1">포트폴리오 데모 안내</p>
            <p class="f14 gr_color">
                이 화면은 분석 결과에서 보장 설계로 이어지는 사용자 흐름을 보여주기 위한 예시입니다.
                실제 보험상품, 보험료, 보험사 정보는 포함하지 않습니다.
            </p>
        </div>

        <div class="w_box mb2">
            <p class="s_title mb1">데이터 처리 흐름</p>
            <ul class="dot_list gr_color2">
                <li>건강검진 및 유전자 데이터 보유 상태 확인</li>
                <li>슬라이더 비율에 해당하는 0~10 결과 데이터 조회</li>
                <li>위험 등급별 질병 목록 구성</li>
                <li>상세 리포트와 보장 플랜 화면 연결</li>
            </ul>
        </div>

        <button type="button" class="g_btn g_on mb1" onclick="location.href='Report.aspx';">리포트로 돌아가기</button>
    </div>
</form>
</body>
</html>
