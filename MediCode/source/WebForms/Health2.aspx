<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Health2.aspx.cs" Inherits="ifa.co.kr.Example.MediCode.Health2" %>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko">
<head runat="server">
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>건강검진 분석 완료</title>
    <link href="styles/health-demo.css" rel="stylesheet" />
</head>
<body>
<form id="form1" runat="server">
    <div class="health-image-wrap">
        <img class="health-image" src="/Example/images/Health_2.jpg" alt="건강검진 분석 완료 화면" />
        <button type="button" class="image-link back-link" aria-label="이전 페이지" onclick="history.back();"></button>
        <a class="image-link report-link" href="Main_New.aspx" aria-label="보장분석 보기" onclick="completeHealthAnalysis(event);"></a>
    </div>
</form>
<script src="scripts/medicode-demo-store.js"></script>
<script src="scripts/health-demo.js"></script>
</body>
</html>
