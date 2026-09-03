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
                status = status.toLowerCase().replace(/\b\w/g, function (c) {
                    return c.toUpperCase();
                });
            }
            if (status) {
                if (status === "02" || status === "Submitted" || status === "Approved") {
                    return "Success";
                } else if (status === "New" || status === "Confirmed") {
                    return "Information";
                } else if (status === "01" || status === "Pending") {
                    return "Warning";
                } else if (status === "Returned") {
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
        }
    }
});