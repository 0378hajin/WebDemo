const urlReturnXMLAPI = '/Home/WebService.asmx/ExecOpenJsonCmd';
const urlReturnJsonAPI = '/Home/WebService.asmx/ExecOpenJsonReturnCmd';

async function httpGet(url, params) {
    const options = {
        method: "GET",
        contentType: "application/json; charset=utf-8"
    };
    const res = await fetch(url, options);
    const data = await res.json();
    if (res.ok) {
        return data;
    } else {
        throw Error(data);
    }
}


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

function httpPostJson(url, param) {
    return fetch(url, {
        method: "post",
        body: (param == null || param == undefined || param == "") ? "" : JSON.stringify(param),
        headers: { "Content-Type": "application/json;charset=utf-8" }
    }).then((response) => {
        return (response.ok) ? response.json() : response.text();
    }).then(json => {
        return json.d
    }).catch((error) => { alert(error); });
}

function inputFocus(e) {
    $(e).find('input[type="number"]').focus();
}

const moneyToKoreanAll = (value) => {
    const koreanNumber = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const tenThousandUnit = ['만', '억', '조', '해'];
    const tenUnit = ['', '십', '백', '천'];
    let answer = '';
    let unit = 10000;
    let index = 0;
    let division = Math.pow(unit, index);

    while (Math.floor(value / division) > 0) {
        const mod = Math.floor(value % (division * unit) / division);
        if (mod) {
            const modToArray = mod.toString().split('');
            const modLength = modToArray.length - 1;
            const toKorean = modToArray.reduce((a, v, i) => {
                a += `${koreanNumber[v * 1]}${tenUnit[modLength - i]}`;
                return a;
            }, '');
            answer = `${toKorean}${tenThousandUnit[index]} ` + answer;
        }
        division = Math.pow(unit, ++index);
    }
    return answer + '원';
}


// 단위별 한글 변환 (단위 : 만원, ex. 2억 1,234만원)
const moneyFormat = (value) => {
    const numbers = [
        numbering(value % 100000000000000000000, 10000000000000000),
        numbering(value % 10000000000000000, 1000000000000),
        numbering(value % 1000000000000, 100000000),
        numbering(value % 100000000, 10000),
        value % 10000
    ];

    return setUnitText(numbers)
        .filter(number => !!number)
        .join(' ');
}

const setUnitText = (numbers) => {
    const unit = ['만원', '억', '조', '경', '해'];
    return numbers.map((number, index) => !!number ? NumberWithCommas(number) + unit[(unit.length - 1) - index] : number)
}

const numbering = (value, division) => {
    const result = Math.floor(value / division);
    return result === 0 ? null : (result % division);
}

//const NUMBER_FORMAT_REGX = /\B(?=(\d{3})+(?!\d))/g;

//const numberFormat = (value) => {
//    return value.toString().replace(NUMBER_FORMAT_REGX, ',');
//}

// 2022.06.15 금액 컴마 함수
String.prototype.priceComma = function () {
    try {
        if (this)
            return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        else
            return 0;
    }
    catch{
        return 0;
    }
};

// 2022.06.15 금액만 추출
String.prototype.priceNotNumberForEmpty = function () {
    return this.replace(/[^0-9]/g, '').substr(0, 8);
}

// 2022.06.15 금액이 변경될 때마다 컴마 반영
String.prototype.priceCommaReflect = function () {
    return this.priceNotNumberForEmpty().priceComma();
};

function birthParse(birth) {
    // 1990 형식이 아닌 900214-1 형식이면 스플릿해서 출생년도 설정
    if (birth != undefined) {
        if (birth.length == 8) {
            let aBirth = birth.split('-');
            let year;
            if (aBirth[1] == 1 || aBirth[1] == 2 || aBirth[1] == 5 || aBirth[1] == 6) {
                year = (19 + aBirth[0]).substr(0, 4);
            }
            else {
                year = (20 + aBirth[0]).substr(0, 4);
            }
            let month = aBirth[0].substr(2, 2);
            let day = aBirth[0].substr(4, 2);

            return year + '-' + month + '-' + day;
        }
        else {
            return birth;
        }
    }
    
}

function nowDate() {
    let today = new Date();
    let month = ('0' + (today.getMonth() + 1)).slice(-2);
    let day = ('0' + today.getDate()).slice(-2);
    return today.getFullYear() + '-' + month + '-' + day;
}

function socialNumberForGender(socialNumber) {
    if (socialNumber != undefined) {
        let socialArray = socialNumber.split('-');

        const social1 = socialArray[0];
        const social2 = socialArray[1];

        let result;
        switch (social2) {
            case "1":
            case "3":
            case "5":
            case "7":
            case "9":
                result = "MAN";
                break;
            case "2":
            case "4":
            case "6":
            case "8":
            case "0":
                result = "WOMAN";
                break;
            default:
                result = "MAN";
                break;
        }

        return result;
    }
    
}

function socialNumberForBirth(socialNumber) {

    if (socialNumber.length == 8) {
        let socialArray = socialNumber.split('-');

        const social1 = socialArray[0];
        const social2 = socialArray[1];

        let result;
        switch (social2) {
            case "1":
            case "2":
            case "5":
            case "6":
                result = "19" + social1;
                break;
            case "3":
            case "4":
            case "7":
            case "8":
                result = "20" + social1;
                break;
            case "9":
            case "0":
                result = "18" + social1;
                break;
            default:
                result = "19" + social1;
                break;
        }

        return result;
    }
    else {
        return socialNumber.replace(/-/g, '');
    }
}

function numberLengthHandle(el, maxlength) {
    el.value = el.value.replace(/-/g, '');
    if (el.value.length > maxlength) {
        el.value = el.value.substr(0, maxlength);
    }
}

function minorAgeHandle(el) {
    el.value = el.value.replace(/-/g, '');
    let regex1 = /^[023456789]/;
    //let regex2 = /^[023456789]/;
    if (regex1.test(el.value)) {
        el.value = el.value.substr(0, 1);
    }
    else {
        el.value = el.value.substr(0, 2);
    }
}

function petAverageLife(weight, type, age) {
    let result = 0;
    if (type == 'DOG') {
        switch (weight) {
            case '5':
                result = 14 - age;
                break;
            case '10':
                result = 15 - age;
                break;
            case '20':
                result = 15 - age;
                break;
            case '0':
                result = 13 - age;
                break;
        }
    }
    else {
        result = 20 - age;
    }

    return result < 1 ? 1 : result;
}

function petCareCost(weight, type) {
    let result = 0;
    if (type == 'DOG') {
        switch (weight) {
            case '5':
                result = 100000;
                break;
            case '10':
                result = 130000;
                break;
            case '20':
                result = 150000;
                break;
            case '0':
                result = 180000;
                break;
        }
    }
    else {
        result = 70000;
    }
    return result;
}

function petCareCostCalc(weight, type, age) {
    return petAverageLife(weight, type, age) * petCareCost(weight, type) * 12;
}

function petMedicalCost(type) {
    let result = 0;
    if (type == 'DOG') {
        result = 50000;
    }
    else {
        result = 40000;
    }
    return result;
}

function petMedicalCostCalc(weight, type, age) {
    return petAverageLife(weight, type, age) * petMedicalCost(type) * 12;
}

function petFuneralCost(weight) {
    let result = 0;
    switch (weight) {
        case '5':
            result = 400000;
            break;
        case '10':
            result = 400000;
            break;
        case '20':
            result = 550000;
            break;
        case '0':
            result = 700000;
            break;
    }
    return result;
}

function searchParam(key) {
    return new URLSearchParams(location.search).get(key);
}

function NumberWithCommas(x) {
    try {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    catch {
        return 0;
    }
}

const getCookieValue = (key, subKey) => {
    let cookieKey = key + "=";
    let result = "";
    const cookieArr = document.cookie.split(";");

    for (let i = 0; i < cookieArr.length; i++) {
        if (cookieArr[i][0] === " ") {
            cookieArr[i] = cookieArr[i].substring(1);
        }

        if (cookieArr[i].indexOf(cookieKey) === 0) {
            if (subKey == undefined) {
                result = cookieArr[i].slice(cookieKey.length, cookieArr[i].length);
                return result;
            }
            else {
                let subCookie = cookieArr[i].substring(cookieArr[i].indexOf("=") + 1);
                const subCookieArr = subCookie.split("&");

                let subCookieKey = subKey + "=";
                for (let j = 0; j < subCookieArr.length; j++) {
                    if (subCookieArr[j].indexOf(subCookieKey) === 0) {
                        result = subCookieArr[j].substring(subCookieKey.length);
                        return result;
                    }
                }
            }
        }
    }
    return result;
}

function setCookie(name, value, day) {
    var day = new Date();
    // ms단위기에 1초로 변환->60초->60분->24시간->최종적으로 day
    day.setTime(day.getTime() + (1000 * 24 * 60 * 60 * day));

    var expires = "expires=" + day.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}


$(document).ready(function () {
    $(document).on('keydown', 'input[type=number]', function (event) {
        //console.log(event.originalEvent);
        if ((event.keyCode > 47 && event.keyCode < 58) || event.keyCode == 8 || (event.keyCode >= 96 && event.keyCode <= 105))
            return true;
        else
            return false;

        
    })
})
