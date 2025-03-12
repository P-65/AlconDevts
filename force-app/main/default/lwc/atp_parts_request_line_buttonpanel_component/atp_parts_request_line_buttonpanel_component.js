import { LightningElement, wire, api, track } from 'lwc';
//import NavigationMixin
import { NavigationMixin } from 'lightning/navigation';
//import for getRecord,getFieldValue,updateRecord
import { getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
//import for showToastEvent
import { ShowToastEvent } from "lightning/platformShowToastEvent";
//import for parts request fields
import SALES_ORG_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Sales_Org__c';
import OWNER_PLANT_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Owner_Plant_AC__c';
import WORK_ORDER_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Work_Order_AC__c';
//import for custom labels
import ATP_SalesOrgPlantWorkOrder_Validation from '@salesforce/label/c.ATP_SalesOrgPlantWorkOrder_Validation'
import ATP_SalesOrgPlantLocation_Validation from '@salesforce/label/c.ATP_SalesOrgPlantLocation_Validation'
import ATP_DeleteSelectedProductsButton_Label from '@salesforce/label/c.ATP_DeleteSelectedProductsButton_Label'
import ATP_AddProductsButton_Label from '@salesforce/label/c.ATP_AddProductsButton_Label'
import ATP_PerformAvailabilityCheckButton_Label from '@salesforce/label/c.ATP_PerformAvailabilityCheckButton_Label'
import ATP_PartsReqUpdateError_Message from '@salesforce/label/c.ATP_PartsReqUpdateError_Message'
//parts request fiels	
const FIELDS = [ SALES_ORG_FIELD,OWNER_PLANT_FIELD,WORK_ORDER_FIELD];

export default class Atp_parts_request_line_buttonpanel_component extends NavigationMixin(LightningElement) {
    @api partsRequestId
    //variable for enable or disable add products button
    enableAddProductsButton = false;
    //variable for enable or disable atp check button
    enableATPCheckButton
    //variable for showing spinner on click of Perform Availability Check button
    showSpinner = false;
    //variable for current user sales org value
    currentUserSalesOrg
    //variable for current user plant value
    currentUserPlant
    //variable for work order value
    workOrder
    //variable for deletesSelected products button label
    deleteSelectedProductsButtonLabel=ATP_DeleteSelectedProductsButton_Label
    //variable for add products button label
    addProductsButtonLabel=ATP_AddProductsButton_Label
    //variable for perform availability check button label
    performAvailabilityCheckButtonLabel=ATP_PerformAvailabilityCheckButton_Label

    /**
     * to get the users sales org,owner plant
     * this will be fired on load
     */
    @wire(getRecord, { recordId: '$partsRequestId', fields: FIELDS })
    currentUserInfo({ error, data }) {
        if (data) {
           // console.log('parts request data',JSON.stringify(data))
            this.currentUserSalesOrg = getFieldValue(data, SALES_ORG_FIELD);
            this.currentUserPlant= getFieldValue(data, OWNER_PLANT_FIELD);
            this.workOrder=getFieldValue(data, WORK_ORDER_FIELD);
           
        } else if (error) {
            this.error = error;
        }
    }

    /**
     * to delete parts request line record(s)
    */
    handleDeleteRecords() {
        this.dispatchEvent(new CustomEvent('deleteselrecords'));
    }

    /**
     * to navigate to parts request record page
    */
    handleCancel() {
        //window.close();
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.partsRequestId,
                objectApiName: 'SVMXC__Parts_Request__c',
                actionName: 'view'
            }
        });
    }

    /**
     * to Filter the the records using search term
    */
    handleSearchRecords(event) {
        const searchTerm = event.target.value;
        window.clearTimeout(this.delayTimeOut);
        this.delayTimeOut = setTimeout(async () => {
            this.dispatchEvent(new CustomEvent('searchrecordsevent', {
                detail: { value: searchTerm }
            }));

        }, 500);

    }

    /**
     * to show add products screen
    */
    handleShowAddProducts() {
        if(this.currentUserSalesOrg&&this.currentUserPlant){
            this.dispatchEvent(new CustomEvent('showmodalevent'));
           }else{
               if(this.workOrder){
               this.dispatchEvent(
                   new ShowToastEvent({
                       title:  `${ATP_SalesOrgPlantWorkOrder_Validation}`,
                       message: '',
                       variant: "error",
                       mode: 'sticky'
                   }),
               );
           }else {
               this.dispatchEvent(
                   new ShowToastEvent({
                       title: `${ATP_SalesOrgPlantLocation_Validation}`,
                       message: '',
                       variant: "error",
                       mode: 'sticky'
                   }),
               );
           }
           }
    }

    /**
    * to handle perform availability check button click and show atp check results
    * */
    handleShowCheckLines() {
        this.showSpinner = true;
        this.dispatchEvent(new CustomEvent('showchecklinesvent'));
        const fields = {
            Id: this.partsRequestId,
            ATP_Check_TimeStamp__c: new Date().toISOString()
        }
        const recordInput = { fields };
        updateRecord(recordInput)
            .then(() => {
                //   this.dispatchEvent(
                //     new ShowToastEvent({
                //       title: "Success",
                //       message: "Parts Request updated",
                //       variant: "success",

                //     }),
                //   );
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: ATP_PartsReqUpdateError_Message,
                        message: error.body.message,
                        variant: "error",
                    }),
                );
            });

    }

    /**
     * to disable add products button
     * this method called from parent 
    */
    @api disableAddProducts(disable) {
        this.enableAddProductsButton = disable
    }

    /**
     * to disable add products button
     * this method called from parent 
    */
    @api disableATPCheck(disable) {
        this.enableATPCheckButton = disable
    }

}