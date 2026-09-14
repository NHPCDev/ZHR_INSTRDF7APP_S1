sap.ui.define([
    "com/nhpc/zhrinstrdf7apps1/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    "com/nhpc/zhrinstrdf7apps1/utils/formatter",
    "com/nhpc/zhrinstrdf7apps1/utils/messenger",
    "sap/ui/core/BusyIndicator"
], (BaseController, Filter, FilterOperator, Spreadsheet, Fragment, ValueState, formatter, messenger, BusyIndicator) => {
    "use strict";

    return BaseController.extend("com.nhpc.zhrinstrdf7apps1.controller.Detail", {
        formatter: formatter,
        onInit() {
            this.getRouter().getRoute("RouteDetail").attachPatternMatched(this._onRoutePatternMatched, this);
        },

        _onRoutePatternMatched: async function (oEvent) {
            let oArgs = oEvent.getParameter("arguments");
            let sApplicationNo = oArgs.ApplicationNo;
            this.sApplicationNo = sApplicationNo;
            let sYear = oArgs.Year;
            let sPernr = oArgs.Pernr;
            let oViewModel = this.getModel("viewModel");
            BusyIndicator.show(0);
            try {
                if (sApplicationNo === "New") {
                    oViewModel.setProperty("/formDetails/Status", "New");
                    this.byId("objPageHeader").setText(this.getResourceBundle().getText("createDialogTitle", this.getModel("viewModel").getProperty("/selectedYear")));
                    this.byId("objPageHeader1").setText(this.getResourceBundle().getText("createDialogTitle", this.getModel("viewModel").getProperty("/selectedYear")));
                } else {
                    await this.setFormDetails(sApplicationNo);
                    this.byId("objPageHeader").setText(this.getResourceBundle().getText("editDialogTitle", sApplicationNo));
                    this.byId("objPageHeader1").setText(this.getResourceBundle().getText("editDialogTitle", sApplicationNo));
                }
                oViewModel.setProperty("/selectedYear", sYear);
                await this.resetValueStates();
                await this.getDefaultEmployeeDetails(sPernr);
            } catch (oError) {
                messenger.error(oError);
            } finally {
                BusyIndicator.hide();
            }
        },

        setFormDetails: async function (sApplicationNo) {
            let oModel = this.getModel();
            let oViewModel = this.getModel("viewModel");
            let aFilters = new Filter("ApplicationNo", FilterOperator.EQ, sApplicationNo);
            await new Promise((resolve, reject) => {
                oModel.read("/PreapprovedSet", {
                    filters: [aFilters],
                    urlParameters: {
                        "$expand": "PREAPPROVED_TO_SECURITY"
                    },
                    success: function (oData) {
                        if (oData.results.length === 0) {
                            messenger.error("No Data Found");
                            return;
                        }
                        oViewModel.setProperty(
                            "/applicatinNoSet",
                            oData.results.map(i => i.ApplicationNo)
                        );
                        oViewModel.setProperty("/formDetails", {
                            ...oViewModel.getProperty("/formDetails"),
                            ...oData.results[0]
                        });
                        oViewModel.setProperty("/tableData", oData.results[0].PREAPPROVED_TO_SECURITY.results)
                        let sText = oData.results[0].UndertakingText;

                        let aLines = sText.split("\n");
                        let aDocs = [];
                        let aIntro = [];
                        let aDeclaration = [];


                        let aFlags = [
                            "ContractNoteFlg",
                            "PaymentProofFlg",
                            "BankStatementFlg",
                            "DeliverySlipFlg"
                        ];

                        let iDocIndex = 0;
                        let bDocSection = false;
                        let bDeclarationSection = false;

                        aLines.forEach(function (line) {

                            if (/^\d+\)/.test(line.trim())) {
                                bDocSection = true;

                                aDocs.push({
                                    text: line.replace(/^\d+\)\s*/, ""),
                                    selected: true
                                });

                                iDocIndex++;
                                return;
                            }

                            if (bDocSection) {
                                bDeclarationSection = true;
                            }

                            if (!bDocSection) {
                                aIntro.push(line);
                            } else if (bDeclarationSection) {
                                aDeclaration.push(line);
                            }
                        });

                        oViewModel.setProperty("/undertakingIntro", aIntro.join("\n"));
                        oViewModel.setProperty("/undertakingDocs", aDocs);
                        oViewModel.setProperty("/undertakingDeclaration", aDeclaration.join("\n"));
                        resolve();
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },

        resetValueStates: function () {
            let oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/valueState/selectedYear", "None");
            oViewModel.setProperty("/valueState/nameOfTheHolder", "None");
            oViewModel.setProperty("/valueState/firstOrJointHolder", "None");
            oViewModel.setProperty("/valueState/numberOfSecurities", "None");
            oViewModel.setProperty("/valueState/boughtSoldSubscribed", "None");
            oViewModel.setProperty("/valueState/dpIdClientId", "None");
            oViewModel.setProperty("/valueState/price", "None");

            oViewModel.setProperty("/valueStateText/selectedYear", null);
            oViewModel.setProperty("/valueStateText/nameOfTheHolder", null);
            oViewModel.setProperty("/valueStateText/firstOrJointHolder", null);
            oViewModel.setProperty("/valueStateText/numberOfSecurities", null);
            oViewModel.setProperty("/valueStateText/boughtSoldSubscribed", null);
            oViewModel.setProperty("/valueStateText/dpIdClientId", null);
            oViewModel.setProperty("/valueStateText/price", null);
        },

        getDefaultEmployeeDetails: function (sPernr) {
            return new Promise((resolve, reject) => {
                let oModel = this.getModel(),
                    oViewModel = this.getModel("viewModel");
                let aFilters = [
                    new Filter(
                        "PERNR",
                        FilterOperator.EQ,
                        sPernr
                    )
                ];
                oModel.read("/ZFI_GH_USER_F4", {
                    filters: aFilters,
                    success:async function (oResp) {
                        if (oResp.results && oResp.results.length > 0) {
                            oViewModel.setProperty("/formDetails/EmployeeId", oResp.results[0].PERNR);
                            oViewModel.setProperty("/formDetails/EmployeeName", oResp.results[0].ENAME);
                            oViewModel.setProperty("/formDetails/CompanyCode", oResp.results[0].BUKRS);
                            oViewModel.setProperty("/formDetails/EmployeeGrade", oResp.results[0].GRADE);
                            oViewModel.setProperty("/formDetails/EmployeeSubgrp", oResp.results[0].SUB_GROUP);
                            oViewModel.setProperty("/formDetails/EmployeeSubgrpText", oResp.results[0].GRADE);
                            oViewModel.setProperty("/formDetails/PersonnelSubArea", oResp.results[0].WERKS);
                            oViewModel.setProperty("/formDetails/PersonnelSubAreaText", oResp.results[0].PLANT);
                            oViewModel.setProperty("/formDetails/EmployeeDepartment", `${oResp.results[0].DEP_CODE} - ${oResp.results[0].DEP}`);
                            oViewModel.setProperty("/formDetails/PositionText", oResp.results[0].DESIG);
                            oViewModel.setProperty("/formDetails/USRID", oResp.results[0].USRID);
                            oViewModel.setProperty("/formDetails/MOBILE", oResp.results[0].MOBILE);
                            oViewModel.setProperty("/formDetails/EMAIL", oResp.results[0].EMAIL);
                            oViewModel.setProperty("/formDetails/DATE_JOIN", oResp.results[0].DATE_JOIN);
                        }
                        await this._getHistoryWithRemarksData(oResp.results[0].PERNR);
                        resolve();
                    }.bind(this),
                    error: function (oError) {
                        messenger.error(JSON.parse(oError.responseText).error.message.value, function () {
                            this.getRouter().navTo("RouteDashboard", {}, {}, true);
                        }.bind(this));
                        reject(oError);
                    }.bind(this)
                });
            });
        },

        onTableUpdateFinish: function () {
            let oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/tableLength", oViewModel.getProperty("/tableData").length ?? 0);
        },

        checkSecurityDetailsValidation: function (oSecurityDetails) {
            let oViewModel = this.getModel("viewModel");
            let errors = [];
            if (!oSecurityDetails.HolderName) {
                oViewModel.setProperty("/valueState/HolderName", ValueState.Error);
                oViewModel.setProperty("/valueStateText/HolderName", this.getResourceBundle().getText("nameOfTheHolderRequired"));
                errors.push(this.getResourceBundle().getText("nameOfTheHolderRequired"));
            } else {
                oViewModel.setProperty("/valueState/HolderName", ValueState.None);
                oViewModel.setProperty("/valueStateText/HolderName", null);
            }
            if (!oSecurityDetails.HolderType) {
                oViewModel.setProperty("/valueState/HolderType", ValueState.Error);
                oViewModel.setProperty("/valueStateText/HolderType", this.getResourceBundle().getText("firstOrJointHolderRequired"));
                errors.push(this.getResourceBundle().getText("firstOrJointHolderRequired"));
            } else {
                oViewModel.setProperty("/valueState/HolderType", ValueState.None);
                oViewModel.setProperty("/valueStateText/HolderType", null);
            }
            if (!oSecurityDetails.NoOfSecurities) {
                oViewModel.setProperty("/valueState/NoOfSecurities", ValueState.Error);
                oViewModel.setProperty("/valueStateText/NoOfSecurities", this.getResourceBundle().getText("numberOfSecuritiesRequired"));
                errors.push(this.getResourceBundle().getText("numberOfSecuritiesRequired"));
            } else {
                oViewModel.setProperty("/valueState/NoOfSecurities", ValueState.None);
                oViewModel.setProperty("/valueStateText/NoOfSecurities", null);
            }
            if (!oSecurityDetails.TransactionType) {
                oViewModel.setProperty("/valueState/TransactionType", ValueState.Error);
                oViewModel.setProperty("/valueStateText/TransactionType", this.getResourceBundle().getText("boughtSoldSubscribedRequired"));
                errors.push(this.getResourceBundle().getText("boughtSoldSubscribedRequired"));
            } else {
                oViewModel.setProperty("/valueState/TransactionType", ValueState.None);
                oViewModel.setProperty("/valueStateText/TransactionType", null);
            }
            if (!oSecurityDetails.DpClientId) {
                oViewModel.setProperty("/valueState/DpClientId", ValueState.Error);
                oViewModel.setProperty("/valueStateText/DpClientId", this.getResourceBundle().getText("dpIdClientIdRequired"));
                errors.push(this.getResourceBundle().getText("dpIdClientIdRequired"));
            } else {
                oViewModel.setProperty("/valueState/DpClientId", ValueState.None);
                oViewModel.setProperty("/valueStateText/DpClientId", null);
            }
            if (!oSecurityDetails.Price) {
                oViewModel.setProperty("/valueState/Price", ValueState.Error);
                oViewModel.setProperty("/valueStateText/Price", this.getResourceBundle().getText("priceRequired"));
                errors.push(this.getResourceBundle().getText("priceRequired"));
            } else {
                oViewModel.setProperty("/valueState/Price", ValueState.None);
                oViewModel.setProperty("/valueStateText/Price", null);
            }
            return errors.length === 0;
        },

        onAddSecurityDetails: async function () {
            await this.resetValueStates();
            let oView = this.getView();
            let oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/selectedSecurityDetails", {});
            oViewModel.setProperty("/selectedSecurityIndex", null);
            this.getModel("viewModel").setProperty("/dialogTitle", this.getResourceBundle().getText("addSecurityDetails"));
            if (!this.oAddDialog) {
                this.oAddDialog = Fragment.load({
                    name: "com.nhpc.zhrinstrdf7apps1.fragment.SecurityDetails",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                    return oDialog;
                });
            } else {
                this.oAddDialog.then(function (oDialog) {
                    oDialog.open();
                });
            }
        },

        onSaveSecurityDetails: function () {
            let oViewModel = this.getModel("viewModel");
            let oSecurityDetails = oViewModel.getProperty("/selectedSecurityDetails");
            let oTableData = oViewModel.getProperty("/tableData") || [];
            let isEdit = oViewModel.getProperty("/selectedSecurityIndex") !== null;
            let isValid = this.checkSecurityDetailsValidation(oSecurityDetails);
            if (!isValid) {
                messenger.error(this.getResourceBundle().getText("fillAllRequiredFields"));
                return;
            }
            if (isEdit) {
                let index = oViewModel.getProperty("/selectedSecurityIndex");
                oTableData[index] = oSecurityDetails;
            } else {
                oTableData.push(oSecurityDetails);
            }
            oViewModel.setProperty("/tableData", oTableData);
            oViewModel.setProperty("/selectedSecurityDetails", {});
            this.oAddDialog.then(function (oDialog) {
                oDialog.close();
            });
            messenger.success(this.getResourceBundle().getText("securityDetailsSaved"));
        },

        onEditSecurityDetails: async function () {
            await this.resetValueStates();
            const oTable = this.byId("idSecurityTable");
            const oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                messenger.error(this.getResourceBundle().getText("selectRowToEdit"));
                return;
            }
            this.getModel("viewModel").setProperty("/dialogTitle", this.getResourceBundle().getText("editSecurityDetails"));
            const oContext = oSelectedItem.getBindingContext("viewModel");
            const oSelectedObject = oContext.getObject();
            this.getModel("viewModel").setProperty(
                "/selectedSecurityDetails",
                Object.assign({}, oSelectedObject)
            );
            this.getModel("viewModel").setProperty("/selectedSecurityIndex", oContext.getPath().split("/").pop());
            if (!this.oAddDialog) {
                Fragment.load({
                    name: "com.nhpc.zhrinstrdf7apps1.fragment.SecurityDetails",
                    controller: this
                }).then((oDialog) => {
                    this.getView().addDependent(oDialog);
                    this.oAddDialog = oDialog;
                    oDialog.open();
                });
            } else {
                this.oAddDialog.then(function (oDialog) {
                    oDialog.open();
                });
            }
        },

        onDeleteSecurityDetails: function (oEvent) {
            const oTable = this.byId("idSecurityTable");
            const oResourceBundle = this.getResourceBundle();
            const oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                messenger.error(oResourceBundle.getText("selectRowToDelete"));
                return;
            }
            const oContext = oSelectedItem.getBindingContext("viewModel");
            let sIndex = oContext.getPath().split("/").pop();
            let oTableData = this.getModel("viewModel").getProperty("/tableData");
            oTableData.splice(sIndex, 1);
            this.getModel("viewModel").setProperty("/tableData", oTableData);
            messenger.success(oResourceBundle.getText("securityDetailsDeleted"));
        },

        onCancelSecurityDetails: function () {
            this.oAddDialog.then(function (oDialog) {
                oDialog.close();
            });
        },

        onDecisionSubmitApprove: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                sText = oResourceBundle.getText("CONFIRM_TEXT_APPROVE_REQUEST"),
                bProceed = true;
            var oModel = this.getModel();
            if (bProceed) {
                messenger.confirm(sTitle, sText, "Confirm", null, function () {
                    BusyIndicator.show(0);
                    this.sActionFlag = "Approved";
                    let oPayload = this.createRequestPayload();
                    oModel.create("/PreapprovedSet", oPayload, {
                        success: function (oResp) {
                            BusyIndicator.hide();
                            messenger.success(oResourceBundle.getText("FinalApproveMsg", oResp.ApplicationNo), () => {
                                this.getRouter().navTo("RouteDashboard", {}, {}, true);
                            });
                        }.bind(this),
                        error: function (oError) {
                            BusyIndicator.hide();
                            messenger.error(JSON.parse(oError.responseText).error.message.value);
                        }.bind(this)
                    });
                }.bind(this));
            }
        },
        onDecisionSubmitReturn: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                sTitle = oResourceBundle.getText("CONFIRM_TITLE"),
                sText = oResourceBundle.getText("CONFIRM_TEXT_RETURN_REQUEST");
            var oModel = this.getModel();
            let oViewModel = this.getModel("viewModel");
            let isMandatoryFilled = oViewModel.getProperty("/formDetails/Remarks");
            if (!isMandatoryFilled || isMandatoryFilled?.trim() === "") {
                oViewModel.setProperty("/valueState/Remarks", "Error");
                oViewModel.setProperty("/valueStateText/Remarks", oResourceBundle.getText("remarkErrorMsg"));
                return;
            } else {
                oViewModel.setProperty("/valueState/Remarks", "None");
                oViewModel.setProperty("/valueStateText/Remarks", oResourceBundle.getText("remarkErrorMsg"));
            }
            messenger.confirm(sTitle, sText, "Confirm", null, function () {
                BusyIndicator.show(0);
                this.sActionFlag = "Returned";
                let oPayload = this.createRequestPayload();
                oModel.create("/PreapprovedSet", oPayload, {
                    success: function (oResp) {
                        BusyIndicator.hide();
                        messenger.success(oResourceBundle.getText("FinalReturnMsg", oResp.ApplicationNo), () => {
                            this.getRouter().navTo("RouteDashboard", {}, {}, true);
                        });
                    }.bind(this),
                    error: function (oError) {
                        BusyIndicator.hide();
                        messenger.error(JSON.parse(oError.responseText).error.message.value);
                    }.bind(this)
                });
            }.bind(this));

        },
        onDecisionSubmit: function (oEvent) {
            const sDecision = this.getModel("viewModel").getProperty("/decision");
            const fnHandler = sDecision === "Approve"
                ? this.onDecisionSubmitApprove
                : this.onDecisionSubmitReturn;

            fnHandler.call(this, oEvent);
        },
        handleReturnBtnPress: async function () {
            this.getModel("viewModel").setProperty("/decision","Return");
            if (!this._oRemarksDialog) {
                this._oRemarksDialog = await sap.ui.core.Fragment.load({
                    id: this.getView().getId(),
                    name: "com.nhpc.zhrinstrdf7apps1.fragment.Remarks",
                    controller: this
                });

                this.getView().addDependent(this._oRemarksDialog);
            }

            this._oRemarksDialog.open();
        },
        handleApproveBtnPress: async function () {
            this.getModel("viewModel").setProperty("/decision","Approve");
            if (!this._oRemarksDialog) {
                this._oRemarksDialog = await sap.ui.core.Fragment.load({
                    id: this.getView().getId(),
                    name: "com.nhpc.zhrinstrdf7apps1.fragment.Remarks",
                    controller: this
                });

                this.getView().addDependent(this._oRemarksDialog);
            }

            this._oRemarksDialog.open();
        },
        onDecisionCancel: function () {
            this._oRemarksDialog.close();
        },
        createRequestPayload: function () {
            var oViewModel = this.getModel("viewModel"),
                oFormDetails = oViewModel.getProperty("/formDetails"),
                oTableData = oViewModel.getProperty("/tableData/0");
            var aDocs = this.getModel("viewModel").getProperty("/undertakingDocs");
            var oPayload = {
                Status: this.sActionFlag,
                ApplicationNo: oFormDetails.ApplicationNo,
                Pernr: oFormDetails.EmployeeId
            };
            if (oFormDetails.Remarks) {
                oPayload.RejectionRemarks = oFormDetails.Remarks
            }
            return oPayload;
        },
        _getHistoryWithRemarksData: function (Pernr) {
            var oModel = this.getModel();
            var oVM = this.getModel("viewModel");

            var aFilters = [
                new Filter("Pernr", FilterOperator.EQ, Pernr),
                new Filter("FormNo", FilterOperator.EQ, "FORM7"),
                new Filter("ApplicationNo", FilterOperator.EQ, this.sApplicationNo)
            ];

            oModel.read("/RemarkHistorySet", {
                filters: aFilters,
                success: function (oData) {
                    oVM.setProperty("/History", oData.results);
                    console.log("History Data", oData.results);
                }.bind(this),

                error: function () {
                    MessageBox.error("unableToFetchApplicationDetails");
                }
            });
        },

    });
});