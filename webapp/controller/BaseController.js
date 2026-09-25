sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "com/nhpc/zhrinstrdf7apps1/utils/messenger",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/ValueState",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment",
    "sap/m/SearchField",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "sap/ui/table/Column",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/MessageBox"
],
    /**
       * @param {typeof sap.ui.core.mvc.Controller} Controller
       */
    function (
        Controller,
        messenger,
        BusyIndicator,
        Filter,
        FilterOperator,
        ValueState,
        DateFormat,
        Fragment,
        SearchField,
        SelectDialog,
        StandardListItem,
        Column,
        MColumn,
        ColumnListItem,
        Label,
        Text,
        MessageBox
    ) {
        "use strict";

        return Controller.extend("com.nhpc.zhrinstprcls1.controller.BaseController", {

            /**
             * Convenience method for accessing the router.
             * @public
             * @returns {sap.ui.core.routing.Router} the router for this component
             */
            getRouter: function () {
                return this.getOwnerComponent().getRouter();
            },

            /* =========================================================== */
            /* Model Methods                                              */
            /* =========================================================== */

            /**
             * Convenience method for getting the view model by name.
             * @public
             * @param {string} [sName] the model name
             * @returns {sap.ui.model.Model} the model instance
             */
            getModel: function (sName) {

                if (this.getView()) {
                    var oModel = this.getView().getModel(sName);
                    if (oModel) {
                        return oModel;
                    }
                }

                return this.getOwnerComponent().getModel(sName);
            },

            /**
             * Convenience method for setting the view model.
             * @public
             * @param {sap.ui.model.Model} oModel the model instance
             * @param {string} sName the model name
             * @returns {sap.ui.mvc.View} the view instance
             */
            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
            },

            /**
             * Clears model and specific property if provided
             * @param {string} sModelName Model name
             * @param {string} sProperty Property
             * @public
             */
            clearModel: function (sModelName, sProperty) { },

            /**
             * Getter for the resource bundle.
             * @public
             * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
             */
            getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },

            fileNameLengthExceeded: function () {
                var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                messenger.error(oResourceBundle.getText("FileLengthExceededErrMsg"), () => { });
            },

            onFileSizeExceed: function (oEvent) {
                var oResourceBundle = this.getResourceBundle();
                messenger.error(oResourceBundle.getText("fileSizeExceedErrorMsg"), () => { });
            },
            getText: function (sKey, aArgs) {
                return this.getResourceBundle().getText(sKey, aArgs);
            },
            navTo: function (sRoute, oParameters) {
                this.getRouter().navTo(sRoute, oParameters);
            },
            onFileTypeMismatch: function (oEvent) {
                var oResourceBundle = this.getResourceBundle();
                messenger.error(oResourceBundle.getText("fileTypeMisMatchErrorMsg"), () => { });
            },

            formatDate: function (oDate) {
                var oDateFormat = DateFormat.getDateInstance({
                    pattern: "dd.MM.yyyyy"
                });
                return oDateFormat.format(oDate);
            },

            showSuccess: function (oResp) {
                var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                var sSuccessTxt = oResourceBundle.getText("SuccessTxt", [oResp.REQ_NO]);
                BusyIndicator.hide();
                messenger.success(sSuccessTxt, function () {
                    this.getRouter().navTo("RouteDashboard");
                    // this.setDefaults();
                }.bind(this));
            },

            showError: function (oError, navBack) {
                const sErrorMsg = JSON.parse(oError.responseText).error.message.value;
                BusyIndicator.hide();
                messenger.error(sErrorMsg, function () {
                    if (navBack) {
                        this.getRouter().navTo("RouteDashboard");
                        // this.setDefaults();
                    }
                }.bind(this));
            },
            onStatusChange: function (oEvent) {

                var oCombo = oEvent.getSource();
                var sKey = oCombo.getSelectedKey();
                var sValue = oCombo.getValue();

                if (sValue && !sKey) {

                    oCombo.setValue("");

                    this.getModel("filterModel").setProperty(
                        "/Status",
                        ""
                    );

                    this.getModel("filterModel").setProperty(
                        "/valueState/Status",
                        "Error"
                    );

                    this.getModel("filterModel").setProperty(
                        "/valueStateText/Status",
                        "Please select a valid status."
                    );

                    return;
                }

                this.getModel("filterModel").setProperty(
                    "/valueState/Status",
                    "None"
                );

                this.getModel("filterModel").setProperty(
                    "/valueStateText/Status",
                    ""
                );
            }, onDateChange: function (oEvent) {
                let oResourceBundle = this.getResourceBundle();
                var oDatePicker = oEvent.getSource();

                if (oEvent.getParameter("valid")) {

                    oDatePicker.setValueState(ValueState.None);
                    oDatePicker.setValueStateText("");

                } else {

                    oDatePicker.setValue("");
                    messenger.error(oResourceBundle.getText("dateFormatError"));
                    oDatePicker.setValueState(ValueState.Error);
                    oDatePicker.setValueStateText(
                        this.getResourceBundle().getText("dateFormatError")
                    );
                }

            },
            onFinancialYearValueHelp: function () {

                console.log(
                    "FinancialyearF4HSet :",
                    this.getModel().getProperty("/FinancialyearF4HSet")
                );

                if (!this._pFinancialYearVH) {

                    this._pFinancialYearVH = Fragment.load({
                        id: this.getView().getId(),
                        name: "com.nhpc.zhrinstprcls1.fragments.FinancialYearVH",
                        controller: this
                    }).then(function (oDialog) {

                        this.getView().addDependent(oDialog);
                        return oDialog;

                    }.bind(this));
                }

                this._pFinancialYearVH.then(function (oDialog) {
                    oDialog.open();
                });
            },
            onFinancialYearSearch: function (oEvent) {

                var sValue =
                    oEvent.getParameter("value") ||
                    oEvent.getParameter("newValue");

                var oBinding =
                    oEvent.getSource().getBinding("items");

                if (!oBinding) {
                    return;
                }

                if (!sValue) {
                    oBinding.filter([]);
                    return;
                }

                var aFilters = [
                    new Filter(
                        "Year",
                        FilterOperator.Contains,
                        sValue
                    )
                ];

                oBinding.filter(aFilters, "Application");
            },
            onFinancialYearConfirm: function (oEvent) {

                var oItem = oEvent.getParameter("selectedItem");

                if (oItem) {

                    this.getModel("filterModel")
                        .setProperty("/Year", oItem.getTitle());

                    var oInput = this.byId("idFinancialYearInput");

                    oInput.setValueState(ValueState.None);
                    oInput.setValueStateText("");
                }
            },
            onFinancialYearCancel: function () {

                this._pFinancialYearVH.then(function (oDialog) {
                    oDialog.close();
                });
            },
            onFinancialYearChange: function (oEvent) {

                var oInput = oEvent.getSource();
                var sValue = oInput.getValue();

                var aData = this.getModel()
                    .getProperty("/FinancialyearF4HSet") || [];

                var bFound = aData.some(function (oItem) {
                    return oItem.Year === sValue;
                });

                if (sValue && !bFound) {

                    oInput.setValue("");
                    this.getModel("filterModel")
                        .setProperty("/Year", "");

                    oInput.setValueState(ValueState.Error);
                    oInput.setValueStateText(
                        this.getResourceBundle()
                            .getText("financialYearValueStateText")
                    );
                } else {
                    oInput.setValueState(ValueState.None);
                    oInput.setValueStateText("");
                }
            },
            onFilterClear: function () {

                this.getModel("filterModel").setData({
                    Year: "",


                    valueState: {
                        Year: ValueState.None,

                    },

                    valueStateText: {
                        Year: "",

                    }
                });
            },
            _getEmployeeDetails: function () {
                var oModel = this.getOwnerComponent().getModel();
                var oVM = this.getModel("viewModel");

                var aFilters = [
                    new Filter(
                        "DFLT",
                        FilterOperator.EQ,
                        "X"
                    )
                ];

                oModel.read("/ZFI_GH_USER_F4", {
                    filters: aFilters,
                    success: function (oData) {

                        if (oData.results.length > 0) {

                            var oEmp = oData.results[0];

                            oVM.setProperty("/EmpDetails", oEmp);

                            var oPreClear =
                                oVM.getProperty("/PreClearDetails") || {};

                            oPreClear.EmployeeName =
                                oPreClear.EmployeeName || oEmp.ENAME;

                            oPreClear.Pernr =
                                oPreClear.Pernr || oEmp.PERNR;

                            oPreClear.Designation =
                                oPreClear.Designation || oEmp.DESIG;

                            oPreClear.DateOfJoiningDP =
                                oPreClear.DateOfJoiningDP ||
                                oEmp.DateOfJoining;

                            oVM.setProperty(
                                "/PreClearDetails",
                                oPreClear
                            );
                        }
                    }.bind(this),

                    error: function (oError) {
                        console.log("Employee Details Error", oError);
                    }
                });
            },
            _validateInput: function (
                oEvent,
                sProperty,
                sModelPath
            ) {
                var sValue = oEvent.getParameter("value");
                var oInput = oEvent.getSource();
                var oModel = this.getOwnerComponent().getModel();
                var oFilterModel = this.getModel("filterModel");

                if (!sValue) {
                    oFilterModel.setProperty(sModelPath, "");
                    return;
                }

                var aFilters = [
                    new Filter(
                        sProperty,
                        FilterOperator.EQ,
                        sValue
                    )
                ];

                oModel.read("/PreClearSet", {
                    filters: aFilters,

                    success: function (oData) {

                        if (oData.results.length === 0) {
                            oInput.setValue("");
                            oFilterModel.setProperty(
                                sModelPath,
                                ""
                            );
                        }

                    }.bind(this),

                    error: function () {
                        oInput.setValue("");
                        oFilterModel.setProperty(
                            sModelPath,
                            ""
                        );
                    }.bind(this)
                });
            },
            onDateOfJoiningChange: function (oEvent) {

                var oDatePicker = oEvent.getSource();

                if (oEvent.getParameter("valid")) {

                    oDatePicker.setValueState(ValueState.None);
                    oDatePicker.setValueStateText("");

                } else {

                    oDatePicker.setValue("");

                    oDatePicker.setValueState(ValueState.Error);
                    oDatePicker.setValueStateText(
                        this.getResourceBundle().getText("invalidDate")
                    );
                }

            },
            _validatePreClearDialog: function () {

                var bValid = true;
                var oBundle = this.getResourceBundle();

                var aControls = [
                    {
                        id: "idNoOfSecurities",
                        label: oBundle.getText("noOfSecurities")
                    },
                    {
                        id: "idFolioNo",
                        label: oBundle.getText("folioNo")
                    },
                    {
                        id: "idNatureOfApproval",
                        label: oBundle.getText("natureOfApproval")
                    },
                    {
                        id: "idEstimatedNo",
                        label: oBundle.getText("estimatedNo")
                    },
                    {
                        id: "idEstimatedValue",
                        label: oBundle.getText("estimatedValue")
                    },
                    {
                        id: "idWhetherProposed",
                        label: oBundle.getText("whetherProposed")
                    },
                    {
                        id: "idImmediateRelativeName",
                        label: oBundle.getText("nameOfImmediateRelatives")
                    },
                    {
                        id: "idDateOfPurchase",
                        label: oBundle.getText("dateOfPurchase")
                    },
                    {
                        id: "idPreviousApprovalDate",
                        label: oBundle.getText("previousApproval")
                    },
                    {
                        id: "idOfficialAddress",
                        label: oBundle.getText("officialAddress")
                    },
                    {
                        id: "idTelephone",
                        label: oBundle.getText("telephone")
                    },
                    {
                        id: "idEmail",
                        label: oBundle.getText("email")
                    },
                    {
                        id: "idInterCom",
                        label: oBundle.getText("interCom")
                    },
                    {
                        id: "idMobile",
                        label: oBundle.getText("mobile")
                    }
                ];

                aControls.forEach(function (oItem) {

                    var oControl = this.byId(oItem.id);

                    if (!oControl) {
                        return;
                    }

                    var vValue;

                    if (oControl.isA("sap.m.DatePicker")) {
                        vValue = oControl.getDateValue();
                    } else if (oControl.isA("sap.m.ComboBox")) {
                        vValue = oControl.getSelectedKey();
                    } else {
                        vValue = oControl.getValue();
                    }

                    if (!vValue) {

                        oControl.setValueState("Error");
                        oControl.setValueStateText(
                            oBundle.getText(
                                "mandatoryField",
                                [oItem.label]
                            )
                        );

                        bValid = false;

                    } else {
                        oControl.setValueState("None");
                    }

                }.bind(this));

                return bValid;
            },
            onComboboxChange: function (oEvent) {
                var oSrc = oEvent.getSource(),
                    sValue = oSrc.getSelectedKey();
                if (!sValue) {
                    oSrc.setValue(null);
                } else {
                    oSrc.setValueState(ValueState.None);
                    oSrc.setValueStateText(null);
                }
            },
            onMandatoryChange: function (oEvent) {

                var oControl = oEvent.getSource();
                var vValue;

                if (oControl.isA("sap.m.DatePicker")) {
                    vValue = oControl.getDateValue();
                } else if (oControl.isA("sap.m.ComboBox")) {
                    vValue = oControl.getSelectedKey();
                } else {
                    vValue = oControl.getValue();
                }

                if (!vValue) {
                    // oControl.setValueState("Error");
                    // oControl.setValueStateText(
                    //     this.getResourceBundle().getText("mandatoryField")
                    // );
                } else {
                    oControl.setValueState("None");
                    oControl.setValueStateText("");
                }
            },
            //for notification
            createNotificationPayload: function (sNotificationId, sRecipientUserId, sRequestNumber, sRequesterName) {
                return {
                    recipients: sRecipientUserId,
                    notificationId: sNotificationId, // UUID generated in UI5
                    businessProcessId: "ZPreAppDis",
                    businessProcessVersion: "1.0",

                    // business parameters
                    businessParameter1: sRequestNumber,    // Request Number
                    businessParameter2: sRequesterName, // Employee/Requester Name

                    // navigation context
                    semanticObject: "PreAppDis",
                    semanticAction: "approve"
                };
            },
            dismissNotification: function (sNotificationId, oNotifyPayload) {
                var payload = {
                    notificationId: sNotificationId
                }
                var oResourceBundle = this.getResourceBundle();
                var sUrl = this.getBaseURL() + "/notify_api/customNotification/removeNotificationItem";
                BusyIndicator.show();
                jQuery.ajax({
                    url: sUrl,
                    type: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(payload),
                    success: function (oResp) {
                        BusyIndicator.hide();
                        if (oNotifyPayload.recipients.length !== 0) {
                            this.sendNotification(oNotifyPayload);
                        }
                    }.bind(this),
                    error: function (error) {
                        BusyIndicator.hide();
                    }.bind(this)
                });
            },
            sendNotification: function (payload) {
                var oResourceBundle = this.getResourceBundle();
                var sUrl = this.getBaseURL() + "/notify_api/customNotification/sendNotificationItem";
                BusyIndicator.show();
                jQuery.ajax({
                    url: sUrl,
                    type: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(payload),
                    success: function (oResp) {
                        BusyIndicator.hide();
                        console.log(oResp);
                    }.bind(this),
                    error: function (error) {
                        BusyIndicator.hide();
                        console.log(error);
                    }.bind(this)
                });
            },
            getBaseURL: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                return appModulePath;
            },
        });
    });