sap.ui.define([
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function(MessageBox, MessageToast) {
	"use strict";

	return {
		init: function(oComponent) {
			this._oComponent = oComponent;
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
		},

		error: function(sText, fnCallback) {
			var oMsgSettings = {
				icon: MessageBox.Icon.ERROR,
				title: this._oResourceBundle.getText("ERROR_TITLE"),
				actions: [MessageBox.Action.OK]
			};
			if (fnCallback && jQuery.isFunction(fnCallback)) {
				oMsgSettings.onClose = function(oAction) {
					// this.setErrorOpen(false);
					if (oAction === "OK") {
						fnCallback();
					}
				}.bind(this);
			}
			MessageBox.error(sText, oMsgSettings);
		},

		showError: function (oError, navBack) {
			var sMessage = "";
			if (oError.statusCode === "400") {
				sMessage = JSON.parse(oError.responseText).error.message.value;
			} else if (oError.statusCode === "500") {
				var oParser = new DOMParser();
				var oResponse = oParser.parseFromString(
					oError.responseText,
					"text/xml"
				);
				var aMessages = oResponse.getElementsByTagName("message");
				if (aMessages && aMessages.length > 0) {
					sMessage = aMessages[0].innerHTML;
				}
			} else {
				sMessage = oError.responseText;
			}
			BusyIndicator.hide();
			messenger.error(
				sMessage,
				function () {
					if (navBack) {
						this.getRouter().navTo("RouteDashboard");
						this.setDefaults();
					}
				}.bind(this)
			);
		},
		
		confirm: function(sTitle, sText, sConfirmCustomAction, sCancelCustomAction, fnCallback, fnCancelCb) {
			var sConfirmAction, sCancelAction;
			if (sConfirmCustomAction) {
				sConfirmAction = sConfirmCustomAction;
			} else {
				sConfirmAction = "Proceed";
			}
			if (sCancelCustomAction) {
				sCancelAction = sCancelCustomAction;
			} else {
				sCancelAction = MessageBox.Action.CANCEL;
			}
			MessageBox.show(sText, {
				icon: MessageBox.Icon.QUESTION,
				title: sTitle,
				actions: [sConfirmAction, sCancelAction],
				onClose: function(oAction) {
					if (oAction === sConfirmAction) {
						fnCallback();
					} else if (oAction === sCancelAction) {
						if (fnCancelCb) {
							fnCancelCb();
						}
					}
				}
			});
		},

		success: function(sText, fnCallback) {
			MessageBox.show(sText, {
				icon: MessageBox.Icon.SUCCESS,
				title: this._oResourceBundle.getText("SUCCESS_TITLE"),
				actions: [MessageBox.Action.OK],
				onClose: fnCallback
			});
		},
	};
});