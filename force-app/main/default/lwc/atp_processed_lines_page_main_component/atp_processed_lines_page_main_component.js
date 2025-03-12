import {LightningElement,wire} from 'lwc';
import {CurrentPageReference,NavigationMixin} from 'lightning/navigation';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import PARTS_REQUEST_LINE_OBJECT from "@salesforce/schema/SVMXC__Parts_Request_Line__c";
//import custom label
import ATP_ATPCheckLineRecTypeName_Label from '@salesforce/label/c.ATP_ATPCheckLineRecTypeName_Label'



export default class Atp_processed_lines_page_main_component extends NavigationMixin(LightningElement) {
    //Variable to store the current parts request record id 
    recordId;
    //variable to store parts request line atp check line record type id
    partsReqLineAtpCheckLineRecordTypeId

    /**
     * to get record type id
    */
    @wire(getObjectInfo, { objectApiName: PARTS_REQUEST_LINE_OBJECT })
    Function({error,data}){
       if(data){
        let objArray  = data.recordTypeInfos;
        for (let i in objArray){
            if(objArray[i].name ==ATP_ATPCheckLineRecTypeName_Label){
            this.partsReqLineAtpCheckLineRecordTypeId = objArray[i].recordTypeId 
            if (this.isQueryEventRecieved) {
                this.template.querySelector('c-atp_processed_lines_page_datatable_component').handleQueryRecords(this.recordId,this.partsReqLineAtpCheckLineRecordTypeId);
            }
            break; 
            }
        }
       }else if(error){
        //console.log(JSON.stringify(error))
        }
     };


    /**
     * to fetch the parts request record id from url
     */
    @wire(CurrentPageReference)
    setCurrentPageReference(currentPageReference) {
        this.recordId = currentPageReference.state.c__recordId;
        if (this.isQueryEventRecieved) {
            this.template.querySelector('c-atp_processed_lines_page_datatable_component').handleQueryRecords(this.recordId,this.partsReqLineAtpCheckLineRecordTypeId);
        }
    }

    /**
     * to query records for the parts request line datatable
     */
    handleQueryProcessedLinesEvent(event) {
        this.isQueryEventRecieved = true;
        if(this.partsReqLineAtpCheckLineRecordTypeId){
        this.template.querySelector('c-atp_processed_lines_page_datatable_component').handleQueryRecords(this.recordId,this.partsReqLineAtpCheckLineRecordTypeId);
        }
    }
    /**
     * to refresh the processed atp lines records
     * */
    handleRefreshEvent() {
        this.template.querySelector('c-atp_processed_lines_page_datatable_component').handleRefresh();
    }

    /**
     * to handle search processed lines event
     * to call the method in processed lines page datatable component with seatch term
     * */
    handleSearchProcessedLinesEvent(event) {
        this.template.querySelector('c-atp_processed_lines_page_datatable_component').handleSearchRecords(event.detail.value);
    }

    /**
     * to handle searchbysourceprocessedlinesevent
     * to call the method in processed lines datatable component with source values
     * */
    handleSearchBySourceProcessedLinesEvent(event) {
        this.template.querySelector('c-atp_processed_lines_page_datatable_component').handleSearchBySourceProcessedLines(event.detail);
    }
    /**
     * to handle resubmit order event
     * to call the method in processed lines datatable component 
     * */
    handleResubmitOrderEvent() {
        this.template.querySelector('c-atp_processed_lines_page_datatable_component').handleResubmit();
    }

    /**
     * to handle disable resumbit event
     * to call the method in processed lines button panel component to enable/disable resubmit button
     * */
    handleDisableResubmitEvent(event) {
        this.template.querySelector('c-atp_processed_lines_page_button_panel_component').disableResubmit(event.detail.disable);

    }
}