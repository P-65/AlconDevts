import { LightningElement, wire } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
//import for parrts request line object
import PARTS_REQUEST_LINE_OBJECT from "@salesforce/schema/SVMXC__Parts_Request_Line__c";
//apex method to delete open atp lines before atp check
import deleteATPPartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.deleteATPPartsReqLines';
//apex method to fetch columns for lwc datatable
import getColumns from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getCustomMetadata';
//import custom label
import ATP_ATPCheckLineRecTypeName_Label from '@salesforce/label/c.ATP_ATPCheckLineRecTypeName_Label'
import ATP_ProductLineRecTypeName_Label from '@salesforce/label/c.ATP_ProductLineRecTypeName_Label'

export default class Atp_start_screen_main_component extends NavigationMixin(LightningElement) {
    //variable to store the current parts request record id 
    recordId;
    //variable indicate query event recived or not
    isQueryEventRecieved;
    //variable to store availability check delay value
    availabilityCheckDelay;
    //variable to store parts request line product line record type id
    partsReqLineProdLineRecordTypeId
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
            if(objArray[i].name ==ATP_ProductLineRecTypeName_Label){
            this.partsReqLineProdLineRecordTypeId = objArray[i].recordTypeId
            if (this.isQueryEventRecieved) {
                this.template.querySelector('c-atp_parts_request_line_datatable_component').handleQueryRecords(this.recordId,this.partsReqLineProdLineRecordTypeId);
            }
            }else if(objArray[i].name ==ATP_ATPCheckLineRecTypeName_Label){
            this.partsReqLineAtpCheckLineRecordTypeId = objArray[i].recordTypeId
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
            this.template.querySelector('c-atp_parts_request_line_datatable_component').handleQueryRecords(this.recordId,this.partsReqLineProdLineRecordTypeId);
        }
    }


    /**
     * to fetch Perform availability check delay value from custom metadata
    */
    @wire(getColumns)
    getColumns({ error, data }) {
        if (data) {
            //Get all columns which are for context "Perform Availability Check Delay"
            let delayData = data.filter(col => col.Context__c == 'Perform Availability Check Delay');
            if(delayData){
            this.availabilityCheckDelay = delayData[0].Perform_Availability_Check_Delay__c
            }
        } else if (error) {
         //   console.log(error);
        }
    }

    /**
     * to query records for the parts request line datatable
    */
    handleQueryrRcordsEvent() {
        this.isQueryEventRecieved = true;
        if(this.partsReqLineProdLineRecordTypeId){
        this.template.querySelector('c-atp_parts_request_line_datatable_component').handleQueryRecords(this.recordId,this.partsReqLineProdLineRecordTypeId);
        }
    }

    /**
     * to delete selected parts request line records from the parts request line datatable
    */
    handleDelSelRecordsEvent() {
        this.template.querySelector('c-atp_parts_request_line_datatable_component').handleDelSelRecords();
    }

    /**
     * to query the records based on the search term for parts request line datatable
    */
    handleSearchRecordsEvent(event) {
        this.template.querySelector('c-atp_parts_request_line_datatable_component').handleSearchRecords(event.detail.value);
    }

    /**
     * to show the add part screen
    */
    handleShowModalEvent() {
        this.template.querySelector('c-atp_add_part_main_component').show();
    }

    /**
     * to show availability check screen
    */
    handleShowCheckLinesEvent() {
        const productIdsString = this.template.querySelector('c-atp_parts_request_line_datatable_component').getSelectedPartsReqLines();
        deleteATPPartsReqLines({ partsReqId: this.recordId })
            .then(() => {
                //console.log('delayis',this.availabilityCheckDelay)
                window.clearTimeout(this.delayTimeOut);
                this.delayTimeOut = setTimeout(async () => {
                    this.template.querySelector('c-atp_check_lines_main_component').show(productIdsString);
                }, this.availabilityCheckDelay);
            })
            .catch(error => {
                // console.log('Error deleting records:', error)
            })
    }

    /**
      * to disable/enable add products button
      */
    handleDisableAddProductsEvent(event) {
        const disable = event.detail.disable;
        this.template.querySelector('c-Atp_parts_request_line_buttonpanel_component').disableAddProducts(disable);
    }

    /**
      * to disable/enable Perform Availability Check button
      */
    handleDisableATPCheckEvent(event) {
        const disable = event.detail.disable;
        this.template.querySelector('c-Atp_parts_request_line_buttonpanel_component').disableATPCheck(disable);
    }

}