const urlReturnJsonAPI = "/Home/WebService.asmx/GetOpenData";
const urlImageView = "/File/ImageViewer/ImageView.aspx";
const urlProfileImage = "/Images/basic/profile_sample.png";

//function SetAppsLog(type) {
//    var currURL = encodeURIComponent(document.location.href);
//    $.ajax({
//        type: "post",
//        url: "/Home/WebService.asmx/SetAppsLog?type=" + type + "&desc=" + currURL,
//        secureuri: false,
//        processData: false,
//        contentType: false,
//        dataType: "json",
//        beforeSend: function () {

//        },
//        complete: function () {
//        },
//        success: function (data, status, e) {
//            var result = data.result;
//            var msg = data.msg;
//            //console.log(msg);
//        },
//        error: function (data, status, e) {

//        }
//    })

//}

function openPopup(name) {
    var obj = $(name);
    if (obj != undefined) {
        obj.addClass("on");
        //obj.fadeIn();
        var bg = $(".divbg");
        if (bg != undefined) {
            bg.addClass("on");
            //bg.fadeIn();
        }
    }
}

function closePopup(obj) {
    if (obj != undefined) {
        obj.removeClass("on");
        //obj.fadeOut();
        var bg = $(".divbg");
        if (bg != undefined) {
            bg.removeClass("on");
            //bg.fadeOut();
        }
    }
}

function getImageViewURL(path, defaultpath) {
    var url = urlImageView + "?imgPath=" + path;
    if (defaultpath != undefined && defaultpath != "") {
        url += "&defaultPath=" + defaultpath;
    } else {
        url += "&defaultPath=" + urlNoImage;
    }

    return url;
}

function openPopup(name) {
    var obj = $(name);
    if (obj != undefined) {
        obj.addClass("on");
        //obj.fadeIn();
        var bg = $(".divbg");
        if (bg != undefined) {
            bg.addClass("on");
            //bg.fadeIn();
        }
    }
}

function closePopup(obj) {
    if (obj != undefined) {
        obj.removeClass("on");
        //obj.fadeOut();
        var bg = $(".divbg");
        if (bg != undefined) {
            bg.removeClass("on");
            //bg.fadeOut();
        }
    }
}