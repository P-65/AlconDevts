import { LightningElement, api } from 'lwc';

export default class Atp_open_lines_tab_component extends LightningElement {
    //variable for parts request record id
    @api partsRequestId
    //variable for record type id
    @api partsReqLineAtpCheckLineRecordTypeId
    //varaible for partsrequest line products id string
    @api productIdsString
    //varaible for search key
    searchKey;
    //variable for selected source values
    selectedSourceValues;
    //variable to check if processed line datatable loaded
    isLoaded = false;
    //for group shipment value
    @api groupShipVal
    //for work order value
    @api workOrderVal
    //for active tab value
    activeTabValue

    /**
     * to handle queryrecordsevent
     * to call the method in open lines datatable
     * */
    handleQueryRecordsEvent() {
        this.template.querySelector('c-atp_open_lines_data_table_component').handleQueryRecords();
    }

    /**
     * to handle queryprocessedlinesrecordsevent
     * to call the method in processed lines datatable
     * */
    handleQueryProcessedLinesRecordsEvent() {
        this.isLoaded = true;
        this.template.querySelector('c-atp_processed_lines_data_table_component').handleQueryRecords();
        window.clearTimeout(this.delayTimeOut);
        this.delayTimeOut = setTimeout(async () => {
            if (this.selectedSourceValues) {
                this.template.querySelector('c-atp_processed_lines_data_table_component').handleSearchBySourceOpenLines(this.selectedSourceValues);
            }
            if (this.searchKey) {
                this.template.querySelector('c-atp_processed_lines_data_table_component').handleSearchRecords(this.searchKey);
            }
        }, 100);
    }

    /**
     * to handle filter the open lines and processed lines records by search term
     * to call the method in open lines datatable and processed lines datatable
     * */
    @api handleSearchOpenLines(searchKey) {
        this.searchKey = searchKey
        this.template.querySelector('c-atp_open_lines_data_table_component').handleSearchRecords(this.searchKey);
        if (this.isLoaded) {
            this.template.querySelector('c-atp_processed_lines_data_table_component').handleSearchRecords(this.searchKey);
        }
    }

    /**
      * to handle filter the open lines and processed lines records by source values
      * to call the method in open lines datatable and processed lines datatable
      * */
    @api handleSearchBySourceOpenLines(selectedValues) {
        this.selectedSourceValues = selectedValues
        this.template.querySelector('c-atp_open_lines_data_table_component').handleSearchBySourceOpenLines(this.selectedSourceValues);
        if (this.isLoaded) {
            this.template.querySelector('c-atp_processed_lines_data_table_component').handleSearchBySourceOpenLines(this.selectedSourceValues);
        }
    }

    /**
      * to refresh the open atp lines records
      * */
    @api handleRefresh(sourceValues) {
        this.template.querySelector('c-atp_open_lines_data_table_component').handleRefresh();
        if (this.isLoaded) {
            this.template.querySelector('c-atp_processed_lines_data_table_component').handleRefresh(sourceValues);
        }
    }

    /**
      * to handle place order
      * this method called from parent
      * to call the method in openlinesdatatable
         * */
    @api handlePlaceOrder() {
        if(this.activeTabValue==1){
        this.template.querySelector('c-atp_open_lines_data_table_component').handlePlaceOrder();
        }else if(this.activeTabValue==2){
            this.template.querySelector('c-atp_processed_lines_data_table_component').handleResubmit();
        }
    }

    /**
     * to handle updatepartsrequestevent
     * to dispatch event to parent
     * */
    handleUpdatePartsRequestEvent() {
        this.dispatchEvent(new CustomEvent('updatepartsrequestevent'));
    }
    /**
      * to handle sourcevalueeventevent
      * to dispatch event to parent
      * */
    handleSourceValuesEvent(event) {
        this.dispatchEvent(new CustomEvent('sourcevaluesevent', { detail: event.detail }));
    }
    /**
     * to disable/enable place order button
    */
    handleDisablePlaceOrderEvent(event) {
        this.dispatchEvent(new CustomEvent('disableplaceorderevent', { detail: event.detail }));
    }
    /**
     * to disable/enable resubmit button
     * */
    handleDisableResubmitEvent(event) {
        this.dispatchEvent(new CustomEvent('disableresumbitevent', { detail: event.detail }));
    }
    /**
     * to disable/enable place order button
     * */
    handleActiveTab(event) {
        this.activeTabValue=event.target.value
        this.dispatchEvent(new CustomEvent('tabchangeevent', {
            detail: {  tabValue: event.target.value }
        }));
    }
    /**
     * to handle parts req updated event
     * this method called from parent
     * */
    @api handlePartsReqUpdated(){
        this.template.querySelector('c-atp_open_lines_data_table_component').handlePartsReqUpdated();
    }
}