sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/nhpc/zhrinstrdf7apps1/model/models",
    "com/nhpc/zhrinstrdf7apps1/utils/messenger",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
], (UIComponent, models, messenger,Filter,FilterOperator) => {
    "use strict";

    return UIComponent.extend("com.nhpc.zhrinstrdf7apps1.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init:async function() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");
            this.setModel(models.createViewModel(), "viewModel");
            // enable routing
            this.getRouter().initialize();            
            await this._checkEligibility();
            messenger.init(this);
        },
        _checkEligibility:async function () {
            var oModel = this.getModel();
            var aFilters = [
                new Filter("ApprovalFlag", FilterOperator.EQ, "7")
            ];
            await oModel.read("/CheckAuthSet", {
                filters: aFilters,
                success: function (oResponse) {
                    if (oResponse.results && oResponse.results.length > 0 && oResponse.results[0].AuthResponse === "No") {
                        this.getRouter().navTo("RouteErrorPage",{},true); 
                    }
                }.bind(this),
                 error: function () {
                 }.bind(this)
            });
 
        }
    });
});