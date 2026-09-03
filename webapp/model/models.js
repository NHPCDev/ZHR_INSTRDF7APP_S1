sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
function (JSONModel, Device) {
    "use strict";

    return {
        /**
         * Provides runtime information for the device the UI5 app is running on as a JSONModel.
         * @returns {sap.ui.model.json.JSONModel} The device model.
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createViewModel: function () {
            var oViewModel = new JSONModel({
                filterData: {
                    ApplicationNo: "",
                    ConfirmedOn:"",
                    Status: "",
                    Pernr: ""
                },
                dialogTitle: "",
                selectedYear: null,
                valueState: {
                    selectedYear: "None",
                    HolderName: "None",
                    HolderType: "None",
                    NoOfSecurities: "None",
                    TransactionType: "None",
                    DpClientId: "None",
                    Price: "None",
                    Remarks: "None"
                },
                valueStateText: {
                    selectedYear: null,
                    HolderName: null,
                    HolderType: null,
                    NoOfSecurities: null,
                    TransactionType: null,
                    DpClientId: null,
                    Price: null,
                    Remarks: null
                },
                formDetails: {
                    Status: ""
                },
                selectedSecurityDetails: {},
                tableData: [],
                tableLength: 0
            });
            oViewModel.setDefaultBindingMode("TwoWay"); 
            return oViewModel;
        }
    };

});