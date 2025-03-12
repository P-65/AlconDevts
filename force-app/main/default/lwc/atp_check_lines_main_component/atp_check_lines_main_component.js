import { LightningElement, api,wire} from 'lwc';

export default class Atp_check_lines_main_component extends LightningElement {
    //variable for parts request record id
    @api partsRequestId
    //variable for record type id
    @api partsReqLineAtpCheckLineRecordTypeId
    //variable for parts request group shipment value
    groupShipVal
    //variable for parts request work order value
    workOrderVal
    //variable for parts request line product ids string
    productIdsString
    //variable for showing atp check screen
    showModal = false
    //variable for source values
    sourceValues

    /**
     * to show atp check screen
     * */
    @api show(productIdsString) {
        this.productIdsString = productIdsString;
        this.showModal = true;
    }

    /**
     * to close atp check screen
     * */
    handleDialogClose() {
        this.showModal = false;
    }

    /**
     * to handle searchopernlinesevent
     * to call the method in openlinestab component with seatch term
     * */
    handleSearchOpenLinesEvent(event) {
        this.template.querySelector('c-atp_open_lines_tab_component').handleSearchOpenLines(event.detail.value);
    }

    /**
    * to handle searchbysourceopenlinesevent
    * to call the method in openlinestab component with source values
    * */
    handleSearchBySourceOpenLinesEvent(event) {
        this.template.querySelector('c-atp_open_lines_tab_component').handleSearchBySourceOpenLines(event.detail);
    }

    /**
     * to handle placeorderevent
     * to call the method in openlinestab component 
     * */
    handlePlaceOrderEvent() {
        let addressCheck=this.template.querySelector('c-atp_check_line_shipping_info_component').addressCheck()
        if(addressCheck){
        this.template.querySelector('c-atp_open_lines_tab_component').handlePlaceOrder();
        }
    }

    /**
     * to handle updatepartsrequestevent
     * to call the method in check line shipping info component 
     * */
    handleUpdatePartsRequestEvent() {
        this.template.querySelector('c-atp_check_line_shipping_info_component').updatePartsRequest();
    }

    /**
     * to handle partsrequestdataevent
     * to set the values for groupShipVal and workOrderVal variables
     * */
    handlePartsReqestDataEvent(event) {
        const partsReqData = event.detail;
        this.groupShipVal = partsReqData.groupShip;
        this.workOrderVal = partsReqData.workOrder;
    }

    /**
     * to handle sourcevaluesevent
     * to call the method in openlinesbuttonpanel component
     * */
    handleSourceValuesEvent(event) {
        this.sourceValues=event.detail
        this.template.querySelector('c-atp_open_lines_button_panel_component').addFilterBySourceValues(this.sourceValues);
        
    }

    /**
     * to handle refreshevent
     * to call the method in openlinestab component
     * */
    handleRefreshEvent() {
        this.template.querySelector('c-atp_open_lines_tab_component').handleRefresh(this.sourceValues);
    }

    /**
     * to disable/enable place order button
    */
    handleDisablePlaceOrderEvent(event){
        const disable = event.detail.disable;
        this.template.querySelector('c-atp_open_lines_button_panel_component').disablePlaceOrder(disable);   
    }
    
    /**
     * to disable/enable resubmit button
    */
    handleDisableResubmitEvent(event){
        const disable = event.detail.disable;
        this.template.querySelector('c-atp_open_lines_button_panel_component').disableResubmit(disable);   
    }

    /**
     * to handle tab change
     * */
     handleTabChangeEvent(event){
        const tabValue = event.detail.tabValue;
        this.template.querySelector('c-atp_open_lines_button_panel_component').handleTabChange(tabValue);
    }
    
    /**
     * to handle updated parts req event
     * */
    handlePartsReqUpdatedEvent(){
        this.template.querySelector('c-atp_open_lines_tab_component').handlePartsReqUpdated();
    }
}