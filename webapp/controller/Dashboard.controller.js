sap.ui.define([
    "com/nhpc/zhrinstrdf7apps1/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/Fragment",
    "sap/ui/core/ValueState",
    "com/nhpc/zhrinstrdf7apps1/utils/formatter",
    "com/nhpc/zhrinstrdf7apps1/utils/messenger",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/json/JSONModel",
    "sap/m/SearchField",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/Column",
    "sap/m/Text"
], (BaseController, Filter, FilterOperator, Spreadsheet, Fragment, ValueState, formatter, messenger, BusyIndicator, JSONModel, SearchField, UIColumn, Label, MColumn, Text) => {
    "use strict";

    return BaseController.extend("com.nhpc.zhrinstrdf7apps1.controller.Dashboard", {
        formatter: formatter,
        onInit() {
            this.getRouter().getRoute("RouteDashboard").attachPatternMatched(this._onRoutePatternMatched, this);
        },

        _onRoutePatternMatched: function (oEvent) {
            this.getModel().refresh();
            this.oEmployeeModel = new JSONModel(sap.ui.require.toUrl("com/nhpc/zhrinstrdf7apps1/model") + "/employee.json");
        },

        onDashboardTableUpdateFinish: function (oEvent) {
            var oResourceBundle = this.getResourceBundle(),
                iCount = oEvent.getParameter("total");
            var sTitle = oResourceBundle.getText("dashboardTableTitle") + " (" + iCount + ")";
            this.byId("dashBoardTitle").setText(sTitle);
        },

        onCreate: function () {
            let oView = this.getView();
            let oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/valueState/selectedYear", ValueState.None);
            oViewModel.setProperty("/valueStateText/selectedYear", null);
            oViewModel.setProperty("/selectedYear", null);

            if (!this.oCreateDialog) {
                this.oCreateDialog = Fragment.load({
                    name: "com.nhpc.zhrinstrdf7apps1.fragment.Create",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                    return oDialog;
                });
            } else {
                this.oCreateDialog.then(function (oDialog) {
                    oDialog.open();
                });
            }
        },
        onYearSelect: async function () {
            BusyIndicator.show(0);
            let oViewModel = this.getModel("viewModel");
            let oResourceBundle = this.getResourceBundle();
            let selectedYear = oViewModel.getProperty("/selectedYear");
            if (!selectedYear) {
                oViewModel.setProperty("/valueState/selectedYear", ValueState.Error);
                oViewModel.setProperty("/valueStateText/selectedYear", this.getResourceBundle().getText("yearRequiredError"));
                BusyIndicator.hide();
                return;
            }
            oViewModel.setProperty("/valueState/selectedYear", ValueState.None);
            oViewModel.setProperty("/valueStateText/selectedYear", null);
            this.oCreateDialog.then(function (oDialog) {
                oDialog.close();
            });
            let oModel = this.getModel();
            let aFilters = [];
            aFilters.push(new Filter("Year", FilterOperator.EQ, selectedYear));
            aFilters.push(new Filter("Status", FilterOperator.EQ, ""));
            await this.resetModel();
            await new Promise((resolve, reject) => {
                oModel.read("/PreapprovedSet", {
                    filters: aFilters,
                    success: function (oData) {
                        let applicationSet = oData.results.filter(i => i.Status === "NEW").map(i => i.ApplicationNo);
                        oViewModel.setProperty(
                            "/applicatinNoSet",
                            applicationSet
                        );
                        if (applicationSet.length === 0) {
                            BusyIndicator.hide();
                            messenger.error(oResourceBundle.getText("noDataErrorMsg"));
                            return;
                        }
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
                                    flagPath: "/formDetails/" + aFlags[iDocIndex]
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
                        oViewModel.setProperty("/formDetails/HeaderText", oData.results[0].HeaderText);
                        oViewModel.setProperty("/undertakingIntro", aIntro.join("\n"));
                        oViewModel.setProperty("/undertakingDocs", aDocs);
                        oViewModel.setProperty("/undertakingDeclaration", aDeclaration.join("\n"));
                        BusyIndicator.hide();
                        resolve();
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        messenger.error(oError);
                        reject(oError);
                    }
                });
            });

            this.getRouter().navTo("RouteDetail", {
                Year: selectedYear,
                ApplicationNo: "New"
            });
        },
        resetModel: function () {
            let oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/tableData", []);
            oViewModel.setProperty("/formDetails", {});
            oViewModel.setProperty("/selectedSecurityDetails", {});
        },
        onCloseDialog: function () {
            this.oCreateDialog.then(function (oDialog) {
                oDialog.close();
            });
        },

        onListItemPress: async function (oEvent) {
            await this.resetModel();
            var oObject = oEvent.getSource()
                .getBindingContext()
                .getObject();

            this.getRouter().navTo("RouteDetail", {
                Year: "No",
                ApplicationNo: oObject.ApplicationNo,
                Pernr: oObject.Pernr
            });
        },

        onSearchBtn: function (oEvent) {
            var oTable = this.byId("idDashboardTable");
            let oFilterData = this._getTableFilters();
            oTable.getBinding("items").filter(oFilterData.aFilters);
        },

        _getTableFilters: function (oEvent) {
            var oViewModel = this.getView().getModel("viewModel"),
                oFilterData = oViewModel.getProperty("/filterData"),
                aSearchFilter = [];
            if (oFilterData.ApplicationNo) {
                let aFilters = [];
                aFilters.push(new Filter("ApplicationNo", FilterOperator.Contains, oFilterData.ApplicationNo));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }
            if (oFilterData.ConfirmedOn) {
                let aFilters = [];
                aFilters.push(new Filter("ConfirmedOn", FilterOperator.EQ, oFilterData.ConfirmedOn));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }
            if (oFilterData.Status) {
                let aFilters = [];
                aFilters.push(new Filter("Status", FilterOperator.EQ, oFilterData.Status));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }
            if (oFilterData.Pernr) {
                let aFilters = [];
                aFilters.push(new Filter("Pernr", FilterOperator.Contains, oFilterData.Pernr));
                aSearchFilter.push(new Filter({
                    filters: aFilters,
                    and: false
                }));
            }

            return {
                aFilters: aSearchFilter.length
                    ? [new Filter({
                        filters: aSearchFilter,
                            and: true
                     })]
                : []
            }
        },

        onDownload: function (oEvent) {
            var aRows = this.byId("idDashboardTable").getBinding("items"),
                oSettings, oSheet, sFileName = this.getResourceBundle().getText("title"),
                aCols = this.createColumnConfig();

            oSettings = {
                workbook: {
                    columns: aCols
                },
                dataSource: aRows,
                fileType: 'Excel',
                fileName: sFileName
            };
            oSheet = new Spreadsheet(oSettings);
            //oSheet = controls.createSpreadsheet(oSettings);
            oSheet.build().then(function () { }).finally(oSheet.destroy);
        },

        createColumnConfig: function () {
            var aCols = [];
            aCols.push({
                label: this.getResourceBundle().getText("applicationNo"),
                property: "ApplicationNo"
            });
            aCols.push({
                label: this.getResourceBundle().getText("employeeIdLabel"),
                property: "Pernr"
            });
            aCols.push({
                label: this.getResourceBundle().getText("employeeNameLabel"),
                property: "EmpName"
            });
            aCols.push({
                label: this.getResourceBundle().getText("confirmedOn"),
                property: "ConfirmedOn",
                type: "date",
                inputFormat: "yyyymmdd",
                format: "dd.MM.yyyy"
            });
            aCols.push({
                label:this.getResourceBundle().getText("confirmedBy"),
                property: "ConfirmBy"
            });
            aCols.push({
                label: this.getResourceBundle().getText("status"),
                property: "Status"
            });
            return aCols;
        },
        onValueHelpOkPress: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            var sValueHelpName = oEvent.getSource().sValueHelpName;
            var oValueHelp = this.fnGetValueHelpDetails(sValueHelpName);
            var oViewModel = this.getModel("viewModel");

            if (aTokens) {
                if (sValueHelpName == "EmployeeNumber") {
                    let Empid = aTokens[0].getCustomData()[0].getValue().Empid;
                    oViewModel.setProperty("/filterData/Pernr", Empid);
                }
            }
            this._oValueHelpDialog.close();
        },
        onValueHelpCancelPress: function () {
            this._oValueHelpDialog.close();
        },
        onValueHelpAfterClose: function () {
            this._oValueHelpDialog.destroy();
        },
        onValueHelpRequest: function (oEvent) {
            var oController = this;
            let oSource = oEvent.getSource();
            oController._currInputId = oSource.getId();
            oController._currSource = oSource;
            var sValueHelpName = oSource.data("valuehelp");
            var oValueHelp = this.fnGetValueHelpDetails(sValueHelpName);
            var aCols = oValueHelp.model.getData().cols;
            this._oBasicSearchField = new SearchField();
            this.loadFragment({
                name: oValueHelp.ValueHelpFragmentPath,
            }).then(function (oDialog) {

                this._oValueHelpDialog = oDialog;
                this.getView().addDependent(this._oValueHelpDialog);

                var oFilterBar = this._oValueHelpDialog.getFilterBar();
                // Set Basic Search for FilterBar
                oFilterBar.setFilterBarExpanded(false);
                oFilterBar.setBasicSearch(this._oBasicSearchField);

                // Trigger filter bar search when the basic search is fired
                this._oBasicSearchField.attachSearch(function (oEvent) {
                    oController.onFilterSearch(oEvent, sValueHelpName);
                });
                this._oBasicSearchField.setMaxLength(oValueHelp.maxLength);
                //this._oBasicSearchField.setPlaceholder("Please Provide "+sValueHelpName);
                this._configureProperties(this._oValueHelpDialog, sValueHelpName);

                this._oValueHelpDialog.getTableAsync().then(function (oTable) {
                    oTable.setModel(this.getModel());
                    if (oTable.bindRows) {
                        oTable.bindAggregation("rows", {
                            path: oValueHelp.bindingpath,
                            events: {
                                dataReceived: function () {
                                    oController._oValueHelpDialog.update();
                                }
                            }
                        });
                        for (var i = 0; i < aCols.length; i++) {
                            var oCol = aCols[i];
                            var oText = new Text({
                                text: {
                                    path: oCol.template
                                },
                                wrapping: false
                            });
                            var oColumn = new UIColumn({
                                label: new Label({
                                    text: oCol.label
                                }),
                                template: oText
                            });
                            oTable.addColumn(oColumn);
                        }
                    }

                    // For Mobile the default table is sap.m.Table

                    if (oTable.bindItems) {
                        // Bind items to the ODataModel and add columns
                        oTable.bindAggregation("items", {
                            path: oValueHelp.bindingpath,
                            template: new ColumnListItem({
                                //cells: [new Label({text: "{ProductCode}"}), new Label({text: "{ProductName}"})]
                                cells: [aCols.map(function (column) { return new Label({ text: "{" + column.template + "}" }) })]
                            }),
                            events: {
                                dataReceived: function () {
                                    oController._oValueHelpDialog.update();
                                }
                            }
                        });
                        for (var i = 0; i < aCols.length; i++) {
                            let labelText = aCols[i].label;
                            let tableColumn = new MColumn({ header: new Label({ text: labelText }) });
                            oTable.addColumn(tableColumn);
                        }
                    }
                    this._oValueHelpDialog.update();
                }.bind(this));


                //this._oValueHelpDialog.setTokens(oValueHelp.input.getTokens());
                this._oValueHelpDialog.open();

            }.bind(this));

        },
        fnGetValueHelpDetails: function (sValueHelp) {
            var oValueHelp = {};
            var sPath = "com.nhpc.zhrinstrdf7apps1.";
            var sMultiInputValueHelpFragmentPath = "fragment.MultiInputValueHelp";
            var oLocationPath = '/ZHR_CDS_IT_EMPLOYEE_F4H';
            if (sValueHelp === "EmployeeNumber") {
                oValueHelp = {
                    "model": this.oEmployeeModel,
                    "ValueHelpFragmentPath": sPath + sMultiInputValueHelpFragmentPath,
                    "bindingpath": oLocationPath,
                    "input": this._currSource,
                    "maxLength": 100
                }
            }
            return oValueHelp;
        },
        _configureProperties: function (oValueHelp, sValueHelp) {
            oValueHelp.sValueHelpName = sValueHelp;
            if (sValueHelp === 'EmployeeNumber') {
                oValueHelp.setTitle("EmployeeNumber");
                oValueHelp.setKey("Empid");
                oValueHelp.setDescriptionKey("FullName");
                oValueHelp.setSupportMultiselect(false);
                oValueHelp.setSupportRanges(false);
            }
        },
        //Event triggerd on click of Go in Value help Search Filters              
        onFilterBarSearch: function (oEvent) {
            var sValueHelpName = oEvent.getSource().getParent().getParent().getParent().getParent().sValueHelpName;
            var sSearchQuery = this._oBasicSearchField.getValue()
            this._performVHSearch(sSearchQuery, sValueHelpName);
        },

        //Event triggered for Search bar in valuehelp of Filters                
        onFilterSearch: function (oEvent, valuehelpname) {
            let sValue = oEvent.getSource().getValue();
            this._performVHSearch(sValue, valuehelpname)
        },
        _performVHSearch: function (sValue, sValueHelpName) {
            if (sValueHelpName === "EmployeeNumber") {

                var oFilter = new Filter({
                    filters: [
                        new Filter({
                            path: "Empid",
                            operator: FilterOperator.Contains,
                            value1: sValue
                        }),
                        new Filter({
                            path: "FullName",
                            operator: FilterOperator.Contains,
                            value1: sValue
                        })
                    ],
                    and: false
                });

                this._filterTable(oFilter);
            }
        },
        _filterTable: function (oFilter) {
            var oValueHelpDialog = this._oValueHelpDialog;
            oValueHelpDialog.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }

                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                oValueHelpDialog.update();
            });
        },
        onValueHelpChange: function (oEvent) {
             var sEmpId = oEvent.getParameter("value");
            var oInput = oEvent.getSource();
             if (!sEmpId) {
                this.getModel("filterModel").setProperty("/EmpId", "");
                return;
            }
            if (!/^\d+$/.test(sEmpId)) {
                oInput.setValue("");
                this.getModel("filterModel").setProperty("/EmpId", "");
                return;
            }
            this.getModel().read("/ZHR_CDS_IT_EMPLOYEE_F4H", {
                filters: [
                    new Filter(
                        "Empid",
                        FilterOperator.EQ,
                        sEmpId
                    )
                ],
                success: function (oData) { 
                    if (oData.results.length > 0) {
                        this.getModel("viewModel")
                            .setProperty("/filterData/Pernr", oData.results[0].Empid);
                    } else {
                        oInput.setValue("");
                        this.getModel("viewModel")
                            .setProperty("/filterData/Pernr", "");
                    }
                }.bind(this),
                error: function () {
                    oInput.setValue("");
                    this.getModel("viewModel")
                        .setProperty("/filterData/Pernr", "");
                }.bind(this)
            });
        },

    });
});