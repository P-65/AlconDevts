import { LightningElement, api, wire } from 'lwc';
//apex method to display part recommendation message
import getPartRecommendation from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getPartRecommendation';
//import for show toast event
import { ShowToastEvent } from "lightning/platformShowToastEvent";
//import for custom labels
import ATP_NewPartRecommendationMessage from '@salesforce/label/c.ATP_NewPartRecommendationMessage'
import ATP_EpartRecommendationMessage from '@salesforce/label/c.ATP_EpartRecommendationMessage'

export default class Atp_add_part_main_component extends LightningElement {
    //variable for parts request id
    @api partsRequestId
    //variable for record type id
    @api partsReqLineProdLineRecordTypeId
    //variable to show modal
    showModal = false

    /**
        * to show the Add part screen
        * to show part recommendation message
        * */
    @api show() {
        this.showModal = true;
        this.getPartRecommendation();
    }

    /**
         * to close the Add part screen
         * */
    handleDialogClose() {
        this.showModal = false;
    }

    /**
         * to handle the event recieved from the add part button panel
         * to call the method from add part datatable component and pass the search term recieved from add part button panel
         * */
    handleSearchRecordsEvent(event) {
        this.template.querySelector('c-atp_add_part_datatable_component').handleSearchRecords(event.detail.value);


    }

    /**
         * to handle the event recieved from the add part button panel
         * to call the method from add part datatable component and pass the search by family term recieved from add part button panel
         * */
    handleSearchRecByFamEvent(event) {
        this.template.querySelector('c-atp_add_part_datatable_component').handleSearchRecByFam(event.detail.value);
    }

    /**
         * to handle the event recieved from the add part button panel
         * to call the method from add part datatable component to add selected products to the parts request
         * */
    handleAddSelRecordsEvent() {
        this.template.querySelector('c-atp_add_part_datatable_component').handleAddSelRecords();
    }

    /**
         * to handle the event recieved from the add part datatable component
         * to query the parts request line record after adding new products
         * */
    handleAddedProductsEvent() {
        this.dispatchEvent(new CustomEvent('queryrecords'));

    }

    
     /**
     * to disable/enable add produts button
    */
     handleDisableAddProductEvent(event){
        const disable = event.detail.disable;
        this.template.querySelector('c-atp_add_part_button_panel_component').disableAddProducts(disable);   
    }

    /**
         * to display part recommendation message
          */
    getPartRecommendation() {
        getPartRecommendation({
            partsReqId: this.partsRequestId
        }).then((data) => {

            if (data === 'new') {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title:  `${ATP_NewPartRecommendationMessage}`,
                        message: " ",
                        variant: "warning",
                        mode: 'sticky',
                    }),
                );
            } else if (data === 'epart') {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title:  `${ATP_EpartRecommendationMessage}`,
                        message: "",
                        variant: "warning",
                        mode: 'sticky',
                    }),
                );
            }

        }).catch((error) => {
          //  console.log(error);
        });
    }
}