const urlMemberAPI = "/Home/Webservice.asmx/GetMemberData";
const urlOpenAPI = "/Home/Webservice.asmx/GetOpenData";

const urlAICreateToken = "https://ai.ifacloud.co.kr/ai";

const urlAIFetch = "https://ai.ifacloud.co.kr/veluga/ai";
const urlAIFollow = "https://ai.ifacloud.co.kr/veluga/follow";

function WriteLog(str) {
	$.getJSON("/Home/WebService.asmx/WriteLog?str=" + encodeURIComponent(str),
		function (json) {
			console.log(json.msg);
		}
	);
}

async function httpPostFile(url, formdata) {
	const options = {
		method: "POST",
		header: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: formdata,
	};
	const res = await fetch(url, options);
	const data = await res.json();
	if (res.ok) {
		return data;
	} else {
		throw Error(data);
	}
}

async function httpPagePost(method, params) {
	let url = window.location.pathname + "/" + method;
	let options = {
		method: "POST",
		body: params,
		headers: { "Content-Type": "application/json;charset=utf-8" }
	};
	let res = await fetch(url, options);
	let data = await res.json();
	if (res.ok) {
		return JSON.parse(data.d);
	} else {
		throw Error(data);
	}
}

// 2022.01.17 전화번호 패턴별 a태그 붙이기 기능 적용 함수(ex. html = AddTelLink(html);)
const telRegexArray = [
	/^([0-9]{3}[\s.-]?[0-9]{4})([\s.-]?[0-9]{4}?)$/,    // 010-8503-3148    // length = 13
	/^([0-9]{4}[\s.-]?[0-9]{3})([\s.-]?[0-9]{4}?)$/,    // 0505-083-5125    // length = 13
	/^([0-9]{3}[\s.-]?[0-9]{3})([\s.-]?[0-9]{4}?)$/,    // 080-852-8282     // length = 12
	/^([0-9]{2}[\s.-]?[0-9]{4})([\s.-]?[0-9]{4}?)$/,    // 02-6303-2771     // length = 12
	/^([0-9]{2}[\s.-]?[0-9]{3})([\s.-]?[0-9]{4}?)$/,    // 02-390-2771      // length = 11
	/^([0-9]{4})([\s.-]?[0-9]{4}?)$/                    // 1599-4600        // length = 9
];
var regexLength = [13, 13, 12, 12, 11, 9];
var regexUrl = /(https?:\/\/[^ ]*)/;

const urlRegex1 = /\[([^\]]+)\]\(([^)]+)\)/g;
const urlRegex2 = /\[(.*?)\]\((.*?)\)/g;
const titleRegex1 = /\#\#\#(.*?)<br\/>/g;
const titleRegex2 = /\#\#\#(.*?)\n/g;
const titleRegex3 = /\*\*(.*?)\*\*/g;
const formulaRegexs1 = /\\text{([^}]*)}/g;
const formulaRegexs2 = /\[(.*?)\]/g;
const formulaClass = ["", "cp"];

async function HttpAiPost(params) {
	const options = {
		method: "POST",
		headers: {
			"accept": "application/json",
			"Content-Type": "application/json"
		},
		body: params,
	};
	const res = await fetch(urlAICreateToken, options);
	const data = await res.json();
	if (res.ok) {
		return data;
	} else {
		throw Error(data);
	}
}

async function httpEventStream(url, params, session, item) {
	let bearer = getCookie("bearer") || "";
	try {
		var json = JSON.parse(params);
		if (json.offerlog) {
			WriteLog("url: " + window.location.pathname + ", mid: " + getPermission("uid") + ", params: " + params);
		}
	} catch (e) {
		WriteLog("url: " + window.location.pathname + ", mid: " + getPermission("uid") + ", error: " + e);
	}
	let headers = {
		"Content-Type": "application/json",
	};

	if (bearer != '') {
		let token = bearer.replace("bearer_token=", "");
		if (token != '') {
			headers["Authorization"] = "Bearer " + token;
        }
    }
	const options = {
		method: "POST",
		headers,
		body: params,
	};

	await fetch(url, options).then(response => {
		item.answered = false;
		item.answer = "";

		const stream = response.body;
		const reader = stream.getReader();
		const readChunk = () => {
			reader.read()
				.then(({
					value,
					done
				}) => {
					if (done) {
						item.displayed = true;
						return;
					}
					const chunkString = new TextDecoder().decode(value);
					//console.log(new Date(), chunkString, item.answer);

					const regex = /data: (.*?)(?:\n|$)/g;
					let match;
					const results = [];

					while ((match = regex.exec(chunkString)) !== null) {
						let match1 = match[1];

						try {
							let json = JSON.parse(match1);
							results.push(json);
						} catch (e) {
							console.log(e, match1);
                        }
					}

					//console.log(results);

					for (var i = 0; i < results.length; i++) {
						try {
							let result = results[i];

							if (result.errorMessage != null && result.errorMessage != undefined) {
								let errMsg = result.errorMessage || "";
								WriteLog("errMsg:" + errMsg);
								console.log(errMsg);
								item.answer = "잠시 후 다시 검색해주시기 바랍니다.";
								item.answer_code = 10;
								break;
							}

							switch (result.status) {
								case "CHAT_ID":
									let chat_id = result.data[0]._id;
									item.chat_id = chat_id;
									httpFollow(urlAIFollow, item);
									break;
								case "PROGRESS_TEXT":
									item.answer_code++;
									item.answer = result.msg;
									break;
								case "TEXT_START":
									item.answer_code = 8;
									item.answer = "";
									break;
								case "ASSISTANT":
									item.answer += result.content;
									if (!item.answered) {
										item.answer_date = new Date().yyyyMMddHHmmss();
										item.answered = true;
									}
									break;
								case "TEXT_END":
									item.answer_code = 9;
									break;
								case "SYSTEM_CONTEXT":
									item.datumitems = result.data;
									break;
								case "END":
									item.answer_code = 10;
									break;
							}
						} catch (e) {
							console.log(e);
						}
					}

					readChunk();
				})
				.catch(e => {
					console.error(e);
					item.answered = true;
					item.displayed = true;
					item.answer = "검색 도중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
				});
		};

		readChunk();
	}).catch(e => {
		console.log(e);
		item.answered = true;
		item.displayed = true;
		item.answer = "검색 도중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

		throw Error(e);
	});
}

async function newHttpEventStream(url, params, session_id, workflow_id, item) {

	let bearer = getCookie("bearer") || "";

	try {
		var json = JSON.parse(params);
		if (json.offerlog) {
			WriteLog("url: " + window.location.pathname + ", mid: " + getPermission("uid") + ", params: " + params);
		}
	} catch (e) {
		WriteLog("url: " + window.location.pathname + ", mid: " + getPermission("uid") + ", error: " + e);
	}
	//if (bearer != '') {
	//	let token = bearer.replace("bearer_token=", "");
	//	if (token != '') {
	//		headers["Authorization"] = "Bearer " + token;
	//	}
	//}
	const options = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		
		},
		body: params,
	};

	await fetch(url, options).then(response => {
		try {
			if (!response.ok) {
				WriteLog(response);
				console.log(response);
				item.answer_code = 10;
				item.displayed = true;
				item.answer = "검색 도중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
			} else {
				item.answer = "";

				const stream = response.body;
				const reader = stream.getReader();
				const readChunk = () => {
					reader.read()
						.then(({
							value,
							done
						}) => {
							if (done) {
								item.displayed = true;
								return;
							}
							const chunkString = new TextDecoder().decode(value);
							//console.log(new Date(), chunkString, item.answer);

							const regex = /data: (.*?)(?:\n|$)/g;
							let match;
							const results = [];

							while ((match = regex.exec(chunkString)) !== null) {
								let match1 = match[1];

								try {
									let json = JSON.parse(match1);
									results.push(json);
								} catch (e) {
									console.log(e, match1);
								}
							}

							//console.log(results);

							for (var i = 0; i < results.length; i++) {
								try {
									let result = results[i];
									//console.log(result);

									if (result.errorMessage != null && result.errorMessage != undefined) {
										let errMsg = result.errorMessage || "";
										WriteLog("errMsg:" + errMsg);
										console.log(errMsg);
										item.answer = "잠시 후 다시 검색해주시기 바랍니다.";
										item.answer_code = 10;
										break;
									}

									switch (result.status) {
										case "CHAT_ID":
											let chat_id = result.data[0]._id;
											item.chat_id = chat_id;
											httpFollow(urlAIFollow, item);
											break;
										case "PROGRESS_TEXT":
											item.answer_code++;
											item.answer = result.msg;
											break;
										case "TEXT_START":
											item.answer_code = 8;
											item.answer = "";
											break;
										case "ASSISTANT":
											if (item.answer == "") {
												item.answer_date = new Date().yyyyMMddHHmmss();
											}
											item.answer += result.content;
											break;
										case "TEXT_END":
											item.answer_code = 9;
											break;
										case "SYSTEM_CONTEXT":
											item.datumitems = result.data;
											break;
										case "END":
											item.answer_code = 10;
											break;
									}
								} catch (e) {
									console.log(e);
								}
							}

							readChunk();
						})
						.catch(e => {
							WriteLog(e);
							console.error(e);
							item.answer_code = 10;
							item.displayed = true;
							item.answer = "검색 도중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
						});
				};

				readChunk();
			}
		} catch (e) {

		}
	}).catch(e => {
		WriteLog(e);
		console.log(e);
		item.answer_code = 10;
		item.displayed = true;
		item.answer = "검색 도중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

		//throw Error(e);
	});
}

function httpFollow(url, item) {
	const options = {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Bearer " + getCookie("bearer").replace("bearer_token=", "")
		},
	};

	url += "/" + item.chat_id;

	fetch(url, options).then((response) => {
		if (response.ok) {
			return response.json();
		} else {
			return response.text();
		}
	}).then(json => {
		if (json.result == "1") {
			let items = json.item;
			//console.log(items);
			let followitems = [];
			items.forEach((item2) => { followitems.push({ "question": item2, "selected": false }); })

			item.followitems = followitems;
			item.follow_show = followitems.length > 0;
		}
	}).catch((error) => {
		console.log(error);
	});
}


function setCookie(name, value, expire_days) {
	let cookie_str = name + "=" + escape(value) + ";";
	if (expire_days != undefined) {
		let days = parseInt(expire_days) || 0;
		if (days >= 0) {
			let nowDate = new Date();
			let newDate = new Date();
			newDate.setDate(newDate.getDate() + days);
			newDate.setHours(0);
			newDate.setMinutes(0);
			newDate.setSeconds(0);
			var diff = newDate.getTime() - nowDate.getTime();
			if (diff < 0) diff = 0;
			var seconds = Math.abs(diff / 1000);
			cookie_str += "max-age=" + seconds + ";";
		}
	}
	cookie_str += "path=/;";

	document.cookie = cookie_str;
}

function getCookie(name) {
	var value = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
	return value ? unescape(value[2]) : null;
}

function AddTelLink(html, style) {
	var oldhtml = html;
	var newhtml = html;
	var telArray = [];

	try {
		if (html != undefined) {
			for (var i = 0; i < html.length; i++) {
				var subHtmlArray = [
					html.substring(i, i + regexLength[0] <= html.length ? i + regexLength[0] : html.length),
					html.substring(i, i + regexLength[1] <= html.length ? i + regexLength[1] : html.length),
					html.substring(i, i + regexLength[2] <= html.length ? i + regexLength[2] : html.length),
					html.substring(i, i + regexLength[3] <= html.length ? i + regexLength[3] : html.length),
					html.substring(i, i + regexLength[4] <= html.length ? i + regexLength[4] : html.length),
					html.substring(i, i + regexLength[5] <= html.length ? i + regexLength[5] : html.length),
				];

				let telMatchingArray = [
					telRegexArray[0].test(subHtmlArray[0]),
					telRegexArray[1].test(subHtmlArray[1]),
					telRegexArray[2].test(subHtmlArray[2]),
					telRegexArray[3].test(subHtmlArray[3]),
					telRegexArray[4].test(subHtmlArray[4]),
					telRegexArray[5].test(subHtmlArray[5])
				];

				var cnt = 0;
				for (var j = 0; j < telMatchingArray.length; j++) {
					if (telMatchingArray[j]) {
						cnt = j;
						var telStr = subHtmlArray[cnt];

						var telIsExist = false;
						for (var k = 0; k < telArray.length; k++) {
							if (telStr == telArray[k]) {
								telIsExist = true;
								break;
							}
						}

						if (!telIsExist) {
							telArray.push(telStr);
							newhtml = newhtml.replaceAll(telStr, "<a class='external' target='_blank'" + (style != undefined ? " " + style + " " : "") + "href='tel:" + telStr.replaceAll("-", "") + "'>" + telStr + "</a>");
						}

						i += regexLength[cnt];
					}
				}
			}
		} else {
			newhtml = "";
		}
	} catch (e) {
		console.log(e);
		newhtml = oldhtml;
	}

	return newhtml;
}

function AddAiHtml(html) {

	if (!html) return "";

	let text = html;

	try {
		text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g, (match, mTitle, mUrl, pUrl) => {
			/* -------------------------
			   1. Markdown 링크
			   [텍스트](URL)
			--------------------------*/
			if (mTitle && mUrl) {
				console.log(mTitle, mUrl);
				return `<a class='external' target='_blank' href='${mUrl}' onclick='event.stopPropagation();'>${mTitle}</a>`;
			}

			/* -------------------------
			   2. URL 자동 링크
			--------------------------*/
			if (pUrl) {
				console.log(pUrl);
				return `<a class='external' target='_blank' href='${pUrl}' onclick='event.stopPropagation();'>${pUrl}</a>`;
			}

			return match;
		});

		/*
		text = text.replace(
			/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
			"<a class='external' target='_blank' href='$2' onclick='event.stopPropagation();'>$1</a>"
		);

		text = text.replace(
			/(https?:\/\/[^\s<]+)/g,
			"<a class='external' target='_blank' href='$1' onclick='event.stopPropagation();'>$1</a>"
		);
		*/

		/* -------------------------
		   3. 제목 처리
		   ### 제목
		--------------------------*/

		text = text.replace(/###\s*(.*?)(\n|<br\/>|$)/g, "<div class='a_tp1'>$1</div>");


		/* -------------------------
		   4. 굵은 글씨
		--------------------------*/

		text = text.replace(/\*\*(.*?)\*\*/g, "<span class='a_tp2'>$1</span>");


		/* -------------------------
		   5. LaTeX 간단 처리
		--------------------------*/

		text = text.replace(/\\text\{([^}]*)\}/g, "$1");
		text = text.replace(/\\times/g, "X");
		text = text.replace(/\\%/g, "%");

		text = text.replace(/\\\[/g, "<span class='a_cp'>");
		text = text.replace(/\\\]/g, "</span>");


		/* -------------------------
		   6. 코드블럭 제거
		--------------------------*/

		text = text.replace(/```/g, "");


		/* -------------------------
		   7. Markdown 표 처리
		--------------------------*/

		text = ConvertMarkdownTable(text);


		/* -------------------------
		   8. 줄바꿈 처리
		--------------------------*/

		text = text.replace(/\r\n/g, "\n");
		text = text.replace(/\n/g, "<br/>");


		return text;

	} catch (e) {

		console.log("AddAiHtml error:", e);

		return html
			.replace(/\r\n/g, "<br/>")
			.replace(/\n/g, "<br/>");
	}
}

function ConvertMarkdownTable(text) {

	const tableRegex = /((\|.*\|\n)+)/g;

	return text.replace(tableRegex, function (match) {

		const rows = match.trim().split("\n");

		if (rows.length < 2) return match;

		let html = "<table class='ai_table'>";

		rows.forEach((row, index) => {

			if (row.includes("---")) return;

			const cols = row.split("|").filter(c => c.trim() !== "");

			html += "<tr>";

			cols.forEach(col => {

				if (index === 0)
					html += "<th>" + col.trim() + "</th>";
				else
					html += "<td>" + col.trim() + "</td>";

			});

			html += "</tr>";

		});

		html += "</table>";

		return html;

	});

}

//-----------------------------------------
// VUE.JS 에러메시지 출력
//-----------------------------------------
function VueAlert(msg) {
    if (msg.toString().startsWith("세션키")) {
        document.location = "/logout.ashx";
        return;
    }

    if (
        msg != "TypeError: Failed to fetch"
        && msg != "TypeError: cancelled"
        && msg != "TypeError: Load failed" // 페이지 로딩 중 이동할 때, Vue 설정 영역에서 벗어나서 발생하는 현상
    ) {
        alert(msg);
    }

}

//POST 로 WebService를 호출하려면 Web.config에 설정이 필요함
async function httpPost(url, params) {
    const options = {
        method: "POST",
        body: params,
    };
    const res = await fetch(url, options);
    const data = await res.json();
    if (res.ok) {
        return data;
    } else {
        throw Error(data);
    }
}

//-----------------------------------------
// 숫자함수
//-----------------------------------------
function NumberWithCommas(x) {
	if (x === undefined || x === null || x === '') {
		return '0';
	}

	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//-----------------------------------------
// 날짜함수
//-----------------------------------------
function AddMonth(sdate, n) {
    var currDate = new Date(sdate);
    var newDate = new Date(currDate.setMonth(currDate.getMonth() + n));
    var year = newDate.getFullYear();
    var month = newDate.getMonth() + 1; // +1을 해야 현재월이 됨  
    var day = newDate.getDay();
    if (day < 10)
        day = "-0" + day;
    else
        day = "-" + day;

    if (month < 10)
        month = "-0" + month;
    else
        month = "-" + month;

    return year + month + day;
}

function AddYear(sdate, n) {
    var currDate = new Date(sdate);
    var newDate = new Date(currDate.setFullYear(currDate.getFullYear() + n));
    var year = newDate.getFullYear();
    var month = newDate.getMonth() + 1; // +1을 해야 현재월이 됨  
    var day = newDate.getDay();
    if (day < 10)
        day = "-0" + day;
    else
        day = "-" + day;

    if (month < 10)
        month = "-0" + month;
    else
        month = "-" + month;

    return year + month + day;
}

//-----------------------------------------
// Excel 날짜함수
//-----------------------------------------

Date.prototype.yyyyMMddHHmmss = function () {
	var m = this.getMonth() + 1;
	var d = this.getDate();

	var h = this.getHours();
	var m2 = this.getMinutes();
	var s = this.getSeconds();

	var res = [this.getFullYear(), (m > 9 ? "" : "0") + m, (d > 9 ? "" : "0") + d].join("-") + " " + [(h > 9 ? "" : "0") + h, (m2 > 9 ? "" : "0") + m2, (s > 9 ? "" : "0") + s].join(":");
	return res;
};

Date.prototype.yyyyMMdd = function () {
	var m = this.getMonth() + 1;
	var d = this.getDate();

	return [this.getFullYear(), (m > 9 ? "" : "0") + m, (d > 9 ? "" : "0") + d].join("");
};

Date.prototype.yyyyMMdd2 = function () {
    var m = this.getMonth() + 1;
    var d = this.getDate();

    return [this.getFullYear(), (m > 9 ? "" : "0") + m, (d > 9 ? "" : "0") + d].join("-");
};

function excelLetter(num) {
	let letter = "",
		t;

	while (num > 0) {
		t = (num - 1) % 26;
		letter = String.fromCharCode(65 + t) + letter;
		num = (num - t) / 26 | 0;
	}
	return letter || undefined;
}

String.prototype.getExcelLength = function () {
	// 엑셀 표기 시 문자길이 가중치
	var byte = 0;
	var weight = 1.2;
	var array = this.split("\r\n");

	if (this.length <= 3) {
		weight = 1.3;
	}

	if (array.length == 1) { //개행문자 미포함
		for (var i = 0; i < this.length; i++) {
			var str = this.substring(i, i + 1);
			const code = this.charCodeAt(i);
			if (code > 127) { // 한글 및 특수문자
				byte += 1.73 * weight;
			} else if (code > 64 && code < 91) { // 대문자
				byte += 1.18 * weight;
			} else if (code > 96 && code < 123) { // 소문자
				byte += 0.93 * weight;
			} else { // 이외
				byte += 1 * weight;
			}
		}
	} else { //개행문자 포함
		let map = array.map(x => x.length);
		let max = Math.max(...map);
		let data = map.indexOf(max);
		var maxstr = array[data];

		for (var i = 0; i < maxstr.length; i++) {
			var str = maxstr.substring(i, i + 1);
			const code = maxstr.charCodeAt(i);
			if (code > 127) { // 한글 및 특수문자
				byte += 1.73 * weight;
			} else if (code > 64 && code < 91) { // 대문자
				byte += 1.18 * weight;
			} else if (code > 96 && code < 123) { // 소문자
				byte += 0.93 * weight;
			} else { // 이외
				byte += 1 * weight;
			}
		}
	}

	//console.log(this, array.length, byte);

	return byte;
}

class Excel {
	constructor(filename, sheetname, header) {
		this.filename = filename;
		this.workbook = new exceljs.Workbook();
		console.log(this.workbook);
		this.sheet = this.workbook.addWorksheet(sheetname);
		this.header = header;

		this.excelitems = [];
		this.total = 0;
		this.percent = 0;
		this.urlMemberAPI = "/Admin/WebService.asmx/GetOpenData";
		this.error = false;
		this.loading = false;
		this.page_size = 10000;
		this.dbonce = false;

		//this.standard = false;
		//this.standards = [];
		//this.outputs = [];
	};

	async loadTotalItem(json) {
		if (this.loading) {
			alert("이미 엑셀 다운로드를 진행하고 있습니다.11111");
			return;
		}

		console.log(new Date().yyyyMMddHHmmss(), "[START][DB]");
		var page = 1;
		this.loading = true;
		this.excelitems = [];
		this.percent = 0;


		var obj = $(divLoad);
		if (obj != undefined)
			obj.show();

		if (!this.dbonce) {
			while (true) {
				//json["page_no"] = page;
				//json["page_size"] = this.page_size;
				var items = await this.loadItem(json);
				if (items == undefined) {
					alert("데이터 조회 도중 오류가 발생했습니다.");
					this.loading = false;
					var obj = $(divLoad);
					if (obj != undefined)
						obj.hide();

					return;
				}
				if (this.error) {
					this.loading = false;
					var obj = $(divLoad);
					if (obj != undefined)
						obj.hide();

					return;
				}

				this.excelitems = this.excelitems.concat(items);
				console.log(new Date().yyyyMMddHHmmss(), "[END][DB][PART]", "엑셀데이터수:" + this.excelitems.length);
				if (items.length != this.page_size) {
					console.log(new Date().yyyyMMddHHmmss(), "[END][DB]", "엑셀데이터수:" + this.excelitems.length);
					// 데이터 조회 완료(percent:30)
					this.percent = 30;
					break;
				}
				page++;
			}
		} else {
			// page_no, page_size 안 넣어도 되지만 혹시 혼용해서 쓰는 경우가 있을 수 있어 포함시킴
			//json["page_no"] = page;
			//json["page_size"] = 1000000000;
			var items = await this.loadItem(json);
			if (items == undefined) {
				alert("데이터 조회 도중 오류가 발생했습니다.");
				this.loading = false;
				var obj = $(divLoad);
				if (obj != undefined)
					obj.hide();

				return;
			}
			if (this.error) {
				this.loading = false;
				var obj = $(divLoad);
				if (obj != undefined)
					obj.hide();

				return;
			}

			this.excelitems = this.excelitems.concat(items);
			console.log(new Date().yyyyMMddHHmmss(), "[END][DB]", "엑셀데이터수:" + this.excelitems.length);
			this.percent = 30;
		}

		this.setExcelColumns();
		this.excelDownload();
	}

	async loadEachItem(jsonarray) {
		if (this.loading) {
			alert("이미 엑셀 다운로드를 진행하고 있습니다.22222");
			return;
		}

		console.log(new Date().yyyyMMddHHmmss(), "[START][DB]");
		var page = 1;
		this.loading = true;
		this.excelitems = [];
		this.percent = 0;


		var obj = $(divLoad);
		if (obj != undefined)
			obj.show();

		for (var i = 0; i < jsonarray.length; i++) {
			var items = await this.loadItem(jsonarray[i]);
			if (items == undefined) {
				alert("데이터 조회 도중 오류가 발생했습니다.");
				this.loading = false;
				var obj = $(divLoad);
				if (obj != undefined)
					obj.hide();

				return;
			}
			if (this.error) {
				this.loading = false;
				var obj = $(divLoad);
				if (obj != undefined)
					obj.hide();

				return;
			}

			this.excelitems = this.excelitems.concat(items);
			console.log(new Date().yyyyMMddHHmmss(), "[END][DB][PART]", "엑셀데이터수:" + this.excelitems.length);
		}

		console.log(new Date().yyyyMMddHHmmss(), "[END][DB]", "엑셀데이터수:" + this.excelitems.length);
		// 데이터 조회 완료(percent:30)
		this.percent = 30;

		this.setExcelColumns();
		this.excelDownload();
	}

	async loadItem(json) {
		var params = JSON.stringify(json);
		//console.log(params);
		var that = this;
		return httpPost(this.urlMemberAPI, params)
			.then((json) => {
				//console.log(json);
				if (json.result == 1) {
					var items = json.items;
					//console.log(items);
					if (that.total > 100000) {
						alert("10만건을 초과하여 엑셀 다운로드를 받으실 수 없습니다.");
						that.error = true;
					} else {
						that.percent = that.parseInt((that.excelitems.length + items.length) * 30 / that.total);
					}

					var added_header = items.filter((item) => item.header == "1")[0];
					if (added_header != undefined) {
						Object.keys(added_header).forEach(function (key) {
							if (key != "header" && added_header[key] != "") {
								var obj = { header: added_header[key], key: key };
								that.header.push(obj);
							}
						});
					}

					// 연속으로 엑셀 다운로드 시 header 항목 중복되는 문제 필터링 처리
					that.header = that.header.filter((item1, idx1) => {
						return that.header.findIndex((item2, idx2) => {
							return item1.key == item2.key
						}) == idx1;
					});

					return items.filter((item) => item.header != "1");
				} else {
					console.log('API ERROR : ' + json.msg);
					return undefined;
				}
			})
			.catch((error) => alert(error));
	}

	async testLoad(json) {
		//if (this.loading) {
		//	alert("이미 엑셀 다운로드를 진행하고 있습니다.33333");
		//	return;
		//}

		console.log(new Date().yyyyMMddHHmmss(), "[START][DB]");
		this.loading = true;
		this.excelitems = [];
		this.percent = 0;


		var obj = $(divLoad);
		if (obj != undefined)
			obj.show();

		if (!this.dbonce) {
			while (true) {
				//json["page_no"] = page;
				//json["page_size"] = this.page_size;
				var items = await this.loadItem(json);
				console.log(items);
				if (items == undefined) {
					alert("데이터 조회 도중 오류가 발생했습니다.");
					this.loading = false;
					var obj = $(divLoad);
					if (obj != undefined)
						obj.hide();

					return;
				}
				if (this.error) {
					this.loading = false;
					var obj = $(divLoad);
					if (obj != undefined)
						obj.hide();

					return;
				}

				this.excelitems = this.excelitems.concat(items);
				console.log(new Date().yyyyMMddHHmmss(), "[END][DB][PART]", "엑셀데이터수:" + this.excelitems.length);
				if (items.length != this.page_size) {
					console.log(new Date().yyyyMMddHHmmss(), "[END][DB]", "엑셀데이터수:" + this.excelitems.length);
					// 데이터 조회 완료(percent:30)
					this.percent = 30;
					break;
				}
				page++;
			}
		} else {
			// page_no, page_size 안 넣어도 되지만 혹시 혼용해서 쓰는 경우가 있을 수 있어 포함시킴
			//json["page_no"] = page;
			//json["page_size"] = 1000000000;
			var items = await this.loadItem(json);

			if (items == undefined) {
				alert("데이터 조회 도중 오류가 발생했습니다.");
				this.loading = false;
				var obj = $(divLoad);
				if (obj != undefined)
					obj.hide();

				return;
			}
			if (this.error) {
				this.loading = false;
				var obj = $(divLoad);
				if (obj != undefined)
					obj.hide();

				return;
			}

			this.excelitems = this.excelitems.concat(items);

			console.log(new Date().yyyyMMddHHmmss(), "[END][DB]", "엑셀데이터수:" + this.excelitems.length);
			this.percent = 30;
		}

		//this.excelitems.push(this.header);
		this.setExcelColumns();
    }

	setExcelColumns() {
		var item_per_percent = this.parseInt(this.parseInt(this.excelitems.length) / 40);

		var that = this;
		this.excelitems.forEach((item, index) => {
			item.no = index + 1;

			if (index != 0 && index % item_per_percent == 0) {
				try {
					that.percent += 1;
					//console.log("setExcelColumns", "percent:" + that.percent);
					if (vm != undefined) {
						vm.$forceUpdate();
					}
				} catch (e) {

				}
			}
		});

		this.percent = 70;
	}

	excelDownload() {
		console.log(new Date().yyyyMMddHHmmss(), "[START][EXCEL]");
		const mimeType = { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
		this.sheet._rows = [];
		this.sheet.columns = this.header;
		//console.log("this.sheet.colums = " + this.sheet.columns);
		//console.log("this.excelitems = " + this.excelitems);

		
		//if (this.standard) {
		//	var that = this;
		//	var generateitems = [];
		//	var obj = {}, obj2, obj3;
		//	for (var i = 0; i < this.excelitems.length; i++) {
		//		var item = this.excelitems[i];

		//		obj2 = Object.assign(...Object.keys(item).map(v => ({ [v]: item[v] })).filter(item2 => { return that.standards.some(prop => item2.hasOwnProperty(prop)) }));

		//		if (i == 0) {
		//			generateitems.push(item);
		//			obj = obj2;
		//		} else {
		//			if (i + 1 == this.excelitems.length) {
		//				if (JSON.stringify(Object.entries(obj).sort()) !== JSON.stringify(Object.entries(obj2).sort())) {
		//					generateitems.push(obj3);
		//				}

		//				generateitems.push(item);
		//				obj3 = Object.assign(...Object.keys(item).map(v => ({ [v]: item[v] })).filter(item2 => { return that.outputs.some(prop => item2.hasOwnProperty(prop)) }));
		//				generateitems.push(obj3);
						
		//				break;
		//			} else {
		//				if (JSON.stringify(Object.entries(obj).sort()) !== JSON.stringify(Object.entries(obj2).sort())) {
		//					obj = obj2;
		//					generateitems.push(obj3);
		//				}

		//				generateitems.push(item);
		//				obj3 = Object.assign(...Object.keys(item).map(v => ({ [v]: item[v] })).filter(item2 => { return that.outputs.some(prop => item2.hasOwnProperty(prop)) }));
		//			}
		//		}
		//	}

		//	this.excelitems = generateitems;
		//}
		

		var start = 'A1';
		var end = excelLetter(this.header.length) + '2';

		if (this.excelitems.length == 0) {
			
			this.sheet.mergeCells(start + ":" + end);
			this.sheet.getCell(start).value = "결과가 없습니다.";
			this.sheet.getCell(start).alignment = { horizontal: "center" };
		} else {
			this.sheet.addRows(this.excelitems);
			console.log(this.sheet);
			this.excelitems = [];
		}
		// 컬럼별 길이
		this.sheet.columns.forEach(column => {
			const lengths = column.values.filter(value => value != "결과가 없습니다.").map(v => v.toString().getExcelLength());
			const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
			console.log("lengths = " + lengths);
			console.log("maxLength = "+maxLength)
			column.width = maxLength;
		});

		// 색상& 선
		this.sheet._rows.forEach((row, r_index) => {
			//var fgColor = "";
			//try {
			//	fgColor = row._cells.filter((cell, c_index) => { return cell._column._key == "bgcolor" && cell._value.model.value != "bgcolor" })[0]._value.model.value;
			//} catch (e) {
			//
			//}

			row._cells.forEach((cell, c_index) => {
				cell.style.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" }, };
				cell.style.alignment = { vertical: "middle", wrapText: true };

				//if (fgColor != "" && fgColor != undefined) {
				//	cell.style.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fgColor } };
				//}

				if (r_index == 0) {
					cell.style.fill = { type: "pattern", pattern: "solid", fgColor: { argb: 'FFBBDEFB' } };
				}
			});
		});
		let promise = [];
		var that = this;
		Promise.all(promise).then(() => {
			setTimeout(function () {
				that.workbook.xlsx.writeBuffer()
					.then(b => {
						saveAs(new Blob([b], mimeType), that.filename);
						that.percent = 100;

						var obj = $(divLoad);
						if (obj != undefined)
							obj.hide();

						that.loading = false;

						// Heap Memory Initialize
						that.workbook = new exceljs.Workbook();
						that.sheet = that.workbook.addWorksheet(that.sheetname);
						that.header = header;
						that.excelitems = [];
						console.log(new Date().yyyyMMddHHmmss(), "[END][EXCEL]");
					})
					.catch(err => console.log('Error writing excel export', err))
			}, 500);
		});
	}

	async addRow(item, index) {
		return this.sheet.addRow(item, index);
	}

	numWithComma(x) { return NumberWithCommas(x); }
	parseInt(x) { return (parseInt(x) || 0); }
	parseFloat(x) { return (parseFloat(x) || 0); }
}