import { LightningElement, wire,api, track } from 'lwc';
//apex method to fetch picklist values
import fetchPicklistValues from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.fetchPicklistValues';
//import for custom labels
import ATP_AddPartAddProductsButton_Label from '@salesforce/label/c.ATP_AddPartAddProductsButton_Label'

export default class Atp_add_part_button_panel_component extends LightningElement {
    //variable for value in product family combobox
    value;
    //varaible for family picklist options 
    options;
    //variable for lightning pill values
    @track allValues = [];
    //varaible for family picklist options master
    optionsMaster
    //variable for disabling add prod button
    disableAddProdButton=false
    //variable for add products label value
    addProductsLabel=ATP_AddPartAddProductsButton_Label
    

    /**
         * to fetch picklist values for family field
         * */
    @wire(fetchPicklistValues, { fieldName: 'Family', objectName: 'Product2' })
    picklistValues({ error, data }) {
        if (data) {
            let prodFamPickVal = [
                {
                    label: '', value: ''
                }
            ];
            for (let x in data) {
                if(x !=='Instrument'&&x !=='Service Product'&&x !=='Test Equipment'){
                prodFamPickVal.push({ label: x, value: data[x] });
                }
            }
            this.options = prodFamPickVal;
            this.optionsMaster = [...this.options]
        } else if (error) {
         //   console.log(error);
        }
    }

    /**
         * to handle the serchterm entry
         * to dispatch the event to filter the products using the searchterm
         * */
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
     * to handle search by product family
     * to dispatch event to filter the products by product family
     * */
    handleSearchRecByProdFam(event) {
        this.value = event.target.value;
        if (!this.allValues.includes(this.value)) {
            this.allValues.push(this.value);
            this.modifyOptions()
        }
    }

    /**
     * to modify options in search by product family picklist
     * */
    modifyOptions() {
        this.options = this.optionsMaster.filter(elem => {
            if (!this.allValues.includes(elem.value))
                return elem;
        })
        window.clearTimeout(this.delayTimeOut);
        this.delayTimeOut = setTimeout(async () => {
            this.dispatchEvent(new CustomEvent('searchrecbyfamevent', {
                detail: { value: this.allValues }
            }));
        }, 500);
    }

    /**
     * to handle the removal of values from lighting pill
     * */
    handleRemove(event) {
        this.value = '';
        const valueRemoved = event.target.name;
        this.allValues.splice(this.allValues.indexOf(valueRemoved), 1);
        this.modifyOptions();
    }

    /**
         * to handle add products button click
         * to dispatch event to parent to add selected products to parts request
         * */
    handleAddProducts() {
        this.disableAddProdButton=true;
        this.dispatchEvent(new CustomEvent('addselrecordsevent'));
    }

    
    /**
     * to enable/disable add products button
     * this method exposed to parent to disable add products button
    */
    @api disableAddProducts(disable) {
    this.disableAddProdButton=disable
    }

    /**
         * to handle cancel button click
         * to close add products screen
         * */
    handleCancel() {
        this.dispatchEvent(new CustomEvent('closemodalevent'));

    }
}