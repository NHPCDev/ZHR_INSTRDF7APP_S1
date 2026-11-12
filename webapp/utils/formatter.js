sap.ui.define(["sap/ui/core/IconPool",
    "sap/ui/core/format/NumberFormat",
    "sap/ui/core/format/DateFormat"
], function (IconPool, NumberFormat, DateFormat) {
    'use strict';

    return {
        formatAttachmentIcon: function (mime) {
            if (mime !== null || mime !== "") {
                return sap.ui.core.IconPool.getIconForMimeType(mime);
            }
        },
        formatStatusState: function (status) {
            if (status) {
                if (status === "03") {
                    return "Success";
                } else if (status === "02" || status === "New") {
                    return "Information";
                } else if (status === "01") {
                    return "Warning";
                } else if (status === "04") {
                    return "Error"
                } else {
                    return "Warning"
                }
            }
        },
        formatDate: function (sDate) {
            if (sDate) {
                if (sDate.length === 8) {
                    var sYear = sDate.substring(0, 4);
                    var sMonth = sDate.substring(4, 6);
                    var sDay = sDate.substring(6, 8);
                    return sDay + "." + sMonth + "." + sYear;
                } else {
                    return sDate;
                }
            }
            return "";
        },
        formatTime: function (sTime) {
            if (sTime) {
                if (sTime.length === 6) {
                    var sHours = sTime.substring(0, 2);
                    var sMinutes = sTime.substring(2, 4);
                    var sSeconds = sTime.substring(4, 6);
                    return sHours + ":" + sMinutes + ":" + sSeconds;
                } else {
                    return sTime;
                }
            }
            return "";
        },
        formatBlankValue: function (value) {
            if (!value) {
                return "-";
            } else {
                return value;
            }
        },
        formatterText: function (sText) {
            if (!sText) {
                return "";
            }

            return sText
                .split("\n")
                .map(function (line, index) {
                    return line;
                })
                .join("<br>");
        },
        formatterUndertakingText: function (sText) {
            if (!sText) {
                return "";
            }

            return sText
                .split("\n")
                .filter(function (line) {
                    return !/^\d+\)/.test(line.trim());
                })
                .join("<br>");
        },
        getTableTitle: function (sTitle, aData) {
            return sTitle + " (" + (aData ? aData.length : 0) + ")";
        },
        formatTitleCase:function(status){
            if (status) {
                status = status.toLowerCase().replace(/\b\w/g, function (c) {
                    return c.toUpperCase();
                });
            }
            return status;
        },
        formatAmountToINR: function (sValue) {
            if (!sValue) return "";
            // Convert string to number and format as INR
            var oLocale = new sap.ui.core.Locale("en-IN");
            var oCurrencyFormat = NumberFormat.getCurrencyInstance({
                decimals: 2
            }, oLocale);

            return oCurrencyFormat.format(parseFloat(sValue), "INR");
        },
        formatNumbers: function(sNumber){
            return Number(sNumber)?.toString();
        },
        formatHistoryDateTime: function (oDate, oTime) {

            if (!oDate || !oTime) {
                return "";
            }

            var year = oDate.substring(0, 4);
            var month = oDate.substring(4, 6);
            var day = oDate.substring(6, 8);

            var sDate = day + "." + month + "." + year;

            var iHours = 0,
                iMinutes = 0,
                iSeconds = 0;

            if (typeof oTime === "string") {

                if (/^\d{6}$/.test(oTime)) {
                    iHours = parseInt(oTime.substring(0, 2), 10);
                    iMinutes = parseInt(oTime.substring(2, 4), 10);
                    iSeconds = parseInt(oTime.substring(4, 6), 10);
                }

                else {
                    var match = oTime.match(/PT(\d+)H(\d+)M(\d+)S/);

                    if (match) {
                        iHours = parseInt(match[1], 10);
                        iMinutes = parseInt(match[2], 10);
                        iSeconds = parseInt(match[3], 10);
                    }
                }
            }

            var sTime =
                String(iHours).padStart(2, "0") + ":" +
                String(iMinutes).padStart(2, "0") + ":" +
                String(iSeconds).padStart(2, "0");

            return sDate + " " + sTime;
        },

    }
});