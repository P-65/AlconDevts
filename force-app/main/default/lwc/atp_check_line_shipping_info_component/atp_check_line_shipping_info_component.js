import { LightningElement, wire, api } from 'lwc';
//import to get record,get field value,updaterecord
import { getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
//import to getpicklist values
import { getObjectInfo,getPicklistValues} from 'lightning/uiObjectInfoApi';
//import for show toast
import { ShowToastEvent } from "lightning/platformShowToastEvent";
//apex method to get location record 
import getLocRec from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getLocData'
//apex method to get count of parts request lines
import getCountOfPartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getCountOfPartsReqLines';
//apex method to get picklist values
import fetchPicklistValues from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.fetchPicklistValues';
//import for parts request object
import PARTS_REQUEST_OBJECT from "@salesforce/schema/SVMXC__Parts_Request__c";
//import for parts request fields
import SHIPPING_COND_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Shipping_Condition_AC__c';
import COUNTRY_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Address_Country_AC__c';
import REGION_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Address_Region_AC__c';
import GROUP_SHIP_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Group_Shipment_AC__c';
import HEADER_NOTE_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Header_Note_AC__c';
import REQUIRED_AT_LOC_NAME_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.SVMXC__Required_At_Location__r.Name';
import REQUIRED_AT_LOC_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.SVMXC__Required_At_Location__c';
import REQUESTED_FROM_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.SVMXC__Requested_From__c';
import SHIP_TO_CUS_LOC_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Ship_To_Customer_Location_AC__c';
import ADD_NAME_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Address_Name_AC__c';
import ADD_NAME2_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Address_Name2_AC__c';
import ADD_STREET_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Address_Street_AC__c';
import WORK_ORDER_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Work_Order_AC__r.Name';
import CITY_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Address_City_AC__c';
import POSTAL_CODE_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Address_Postal_Code_AC__c';
import SALES_ORG_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Sales_Org__c';
import WORKORDER_CUSTOMER_LOC_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Work_Order_AC__r.SVMXC__Site__c';
import DISTRICT_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Address_District_AC__c';

//parts request fields
const FIELDS = [SHIPPING_COND_FIELD, COUNTRY_FIELD, REGION_FIELD, GROUP_SHIP_FIELD, HEADER_NOTE_FIELD,REQUIRED_AT_LOC_NAME_FIELD,REQUIRED_AT_LOC_FIELD,REQUESTED_FROM_FIELD,SHIP_TO_CUS_LOC_FIELD, ADD_NAME_FIELD, ADD_NAME2_FIELD, ADD_STREET_FIELD, CITY_FIELD, WORK_ORDER_FIELD,POSTAL_CODE_FIELD,SALES_ORG_FIELD,WORKORDER_CUSTOMER_LOC_FIELD,DISTRICT_FIELD];
export default class Atp_check_line_shipping_info_component extends LightningElement {
    //variable for pars request record id
    @api partsRequestId
    //variable for record type id
    @api partsReqLineAtpCheckLineRecordTypeId
    //variable for group shipment radio group options
    groupShipOptions = [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' },
    ];
    //variable for ship to customer location radio group options
    shipToCusLocOptions = [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' },
    ];
    //variable for group shipment value
    groupShipVal = ' ';
    //variable for ship to customer loc value
    shipToCusLocVal = ' ';
    //variable for shipping cond picklist data
    shippingCondOptionsData
    //variable for shipping cond picklist values
    shippingCondOptions;
    //variable for country  picklist values
    countryOptions
    //variable for region Options Data
    regionOptionsData
    //variable for region  picklist values
    regionOptions
    //variable for required at location value
    reqAtLocVal
    //variable for requested from value
    reqFromVal
    //variable for loc id from required at location record picker
    reqAtLocId
    //variable for shipping condition value
    shipConVal = ' '
    //variable for header note value
    headerNoteVal
    //variable for address name value
    addNameVal
    //variable for address name2 value
    addName2Val = '';
    //variable for address street value
    addStreetVal
    //variable for region value
    regionVal
    //variable for city value
    cityVal
    //variable for country value
    countryValue
    //variable for postal code value
    postalCodeVal
    //variable for workorder value
    workOrderValue
    //requested from record picker filter 
    RequestedFromFilter
    //variable for parts request record type id
    partsRequestRecordTypeId;
    //variable for current user sales org
    currentUserSalesOrg;
    //variable for district value
    districtVal = '';

    
    /**
    * to fetch parts request record
    * */
    @wire(getRecord, { recordId: '$partsRequestId', fields: FIELDS })
    partsReqRecord({ error, data }) {
        if (data) {
            this.currentUserSalesOrg = getFieldValue(data, SALES_ORG_FIELD);
            this.groupShipVal = getFieldValue(data, GROUP_SHIP_FIELD) ? 'Yes' : 'No';
            this.reqAtLocVal = getFieldValue(data, REQUIRED_AT_LOC_NAME_FIELD);
            this.reqAtLocId = getFieldValue(data, REQUIRED_AT_LOC_FIELD);
            this.shipConVal = getFieldValue(data, SHIPPING_COND_FIELD);
            this.workOrderValue = getFieldValue(data, WORK_ORDER_FIELD);
            this.headerNoteVal = getFieldValue(data, HEADER_NOTE_FIELD);
            if (this.workOrderValue != null || this.groupShipVal === 'Yes') {
                this.dispatchEvent(new CustomEvent('partsrequestdataevent', {
                    detail: {
                        workOrder: this.workOrderValue,
                        groupShip: this.groupShipVal
                    }
                }));
            }

            getCountOfPartsReqLines({ sCountQuery: `SELECT count() FROM SVMXC__Parts_Request_Line__c WHERE RecordTypeId='${this.partsReqLineAtpCheckLineRecordTypeId}' AND SVMXC__Parts_Request__c = '${this.partsRequestId}' AND SVMXC__Line_Status__c NOT IN ('Open')` })
            .then((count) => {
                if(count >0){
                    this.template.querySelectorAll('lightning-input,lightning-combobox,lightning-radio-group,lightning-textarea,lightning-record-picker').forEach(item=>{
                        item.disabled=true
                        })  
                        this.addNameVal = getFieldValue(data, ADD_NAME_FIELD);
                        this.addName2Val = getFieldValue(data, ADD_NAME2_FIELD);
                        this.addStreetVal = getFieldValue(data, ADD_STREET_FIELD);
                        this.regionVal = getFieldValue(data, REGION_FIELD);
                        this.cityVal = getFieldValue(data, CITY_FIELD);
                        this.countryValue = getFieldValue(data, COUNTRY_FIELD);
                        this.postalCodeVal=getFieldValue(data, POSTAL_CODE_FIELD);
                        this.getPickListOptions('Address_Country_AC__c');
                        this.shipToCusLocVal = getFieldValue(data, SHIP_TO_CUS_LOC_FIELD) ? 'Yes' : 'No';
                        this.reqFromVal = getFieldValue(data, REQUESTED_FROM_FIELD);
                        if(this.currentUserSalesOrg === 'BR'){
                            this.districtVal = getFieldValue(data, DISTRICT_FIELD);
                            this.template.querySelectorAll('.nameComp,.name2Comp,.regionComp,.districtComp').forEach(item=>{
                                item.required=true
                                })
                        }
                }else{
                        if(this.currentUserSalesOrg === 'BR'){
                            this.shipToCusLocVal = 'Yes';
                            this.template.querySelector(".shipToCusLoc").disabled = true;
                            this.reqFromVal = getFieldValue(data, REQUESTED_FROM_FIELD) ? getFieldValue(data, REQUESTED_FROM_FIELD) : this.reqAtLocId;
                            this.template.querySelectorAll('.nameComp,.name2Comp,.regionComp,.districtComp').forEach(item=>{
                                item.required=true
                                })
                        }else{
                            this.prepareFilterMethod();
                            if(this.workOrderValue){
                                let woSite = getFieldValue(data, WORKORDER_CUSTOMER_LOC_FIELD);
                                this.shipToCusLocVal = 'Yes';
                                this.reqFromVal = getFieldValue(data, REQUESTED_FROM_FIELD) ? getFieldValue(data, REQUESTED_FROM_FIELD) : woSite;
                            }else{
                                this.shipToCusLocVal = getFieldValue(data, SHIP_TO_CUS_LOC_FIELD) ? 'Yes' : 'No';
                                this.reqFromVal = getFieldValue(data, REQUESTED_FROM_FIELD);
                            }
                        }
                        this.getPickListOptions('Address_Country_AC__c');
                        if(this.reqFromVal){
                            this.getLocData(this.reqFromVal);
                        }else{
                            this.getLocData(this.reqAtLocId);
                        }
                }
            }).catch((error) => {
              //  console.log(error);
            });   
        } else if (error) {
           // console.error('Error While Fetching Parts Req Record', error);
        }
    }
    
    /**
    * to add filter to requested from record picker
    * */
    prepareFilterMethod(){
        this.RequestedFromFilter = {
            criteria: [
                {
                    fieldPath: 'Id',
                    operator: 'ne',
                    value: this.reqAtLocId
                }
            ]
        };
    }
    
    /**
    * to fetch default reordtype id
    * */
    @wire(getObjectInfo, { objectApiName: PARTS_REQUEST_OBJECT })
  results({ error, data }) {
        if (data) {
      this.partsRequestRecordTypeId = data.defaultRecordTypeId;
        } else if (error) {
          //console.log('Error is',JSON.stringify(error))
        }
    }


    /**
    * to fetch region picklist values
    * */
    @wire(getPicklistValues, { recordTypeId:"$partsRequestRecordTypeId", fieldApiName: REGION_FIELD })
    regionPicklistValues({ error, data }) {
        if (data) {
            this.regionOptionsData = data;
        } else if (error) {
           //console.error(error);
        }
    }

    /**
    * to fetch region picklist values
    * */
    @wire(getPicklistValues, { recordTypeId: "$partsRequestRecordTypeId", fieldApiName: SHIPPING_COND_FIELD })
    shippingCondPicklistValues({ error, data }) {
        if (data) {
            this.shippingCondOptionsData = data;
           // console.log('shipConddata',JSON.stringify(data))
        } else if (error) {
           //console.error(error);
        }
    }

    /**
    * to fetch country picklist values
    * */
    @wire(getPicklistValues, { recordTypeId: "$partsRequestRecordTypeId", fieldApiName: COUNTRY_FIELD })
    countryPicklistValues({ error, data }) {
        if (data) {
        this.countryOptions = data.values;
        } else if (error) {
           //console.error(error);
        }
    }
    
    /**
    * to fetch picklist values of shipping condition and country
    * */
    getPickListOptions(value) {
        fetchPicklistValues({
            fieldName: value, objectName: 'SVMXC__Parts_Request__c'
        })
            .then((data) => {
                let picklistVal = [
                    {
                        label: '', value: ''
                    }
                ];
                for (let x in data) {
                    picklistVal.push({ label: x, value: data[x] });
                }
                if (value === 'Address_Country_AC__c') {
                    this.countryOptions = picklistVal;                
                    if (this.countryValue) {
                        if(!this.workOrderValue){
                        const selectedOption = this.countryOptions.find(option => option.label ===this.countryValue);
                        if (selectedOption) {
                            this.countryValue = selectedOption.value;
                        }
                        }
                        let key = this.regionOptionsData.controllerValues[this.countryValue];
                        this.regionOptions = this.regionOptionsData.values.filter(opt => opt.validFor.includes(key));
                        if(!this.workOrderValue){
                            const selectedOption = this.regionOptions.find(option => option.label ===this.regionVal);
                            if (selectedOption) {
                                this.regionVal = selectedOption.value;
                            }
                            }
                        
                        let key2 = this.shippingCondOptionsData.controllerValues[this.countryValue];
                        this.shippingCondOptions = this.shippingCondOptionsData.values.filter(opt => opt.validFor.includes(key2));
                    }
                }
            })
            .catch((error) => {
               // console.log('error while fetching picklistvalues', error);
            });
    }
    
    /**
     * to fetch location data
     * */
    getLocData(locationRecordId) {
        let sQuery = `Select Name,SVMXC__Street__c,SVMXC__City__c,SVMXC__Country__c,SVMXC__Zip__c,CPF_Number__c,District__c FROM SVMXC__Site__c WHERE Id='${locationRecordId}' Limit 1`
            getLocRec({
                sQuery: sQuery
            })
                .then((data) => {
                    if (data.length > 0) {
                        const record = data[0];
                        this.addNameVal = record.Name;
                        this.addStreetVal = record.SVMXC__Street__c
                        this.cityVal = record.SVMXC__City__c
                        this.addName2Val = this.currentUserSalesOrg === 'BR' ? record.CPF_Number__c : '';
                        this.postalCodeVal = record.SVMXC__Zip__c
                        const country = record.SVMXC__Country__c
                        const selectedOption = this.countryOptions.find(option => option.label ===country);
                        this.districtVal = this.currentUserSalesOrg === 'BR' ? record.District__c : '';
                        if (selectedOption) {
                            this.countryValue = selectedOption.value;

                        }
                       if (this.countryValue) {
                        let key = this.regionOptionsData.controllerValues[this.countryValue];
                        this.regionOptions = this.regionOptionsData.values.filter(opt => opt.validFor.includes(key));
                        let key2 = this.shippingCondOptionsData.controllerValues[this.countryValue];
                        this.shippingCondOptions = this.shippingCondOptionsData.values.filter(opt => opt.validFor.includes(key2));
                       }
                    } else {
                    }
                })
                .catch((error) => {
                   // console.log(error);
                });
    }

    /**
     * to show region picklist values based on country 
     * */
    handleCountryChange(event) {
        this.countryValue = event.detail.value
        let key = this.regionOptionsData.controllerValues[this.countryValue];
        this.regionOptions = this.regionOptionsData.values.filter(opt => opt.validFor.includes(key));
        let key2 = this.shippingCondOptionsData.controllerValues[this.countryValue];
        this.shippingCondOptions = this.shippingCondOptionsData.values.filter(opt => opt.validFor.includes(key2));
    }

    /**
     * to handle change in field input values in the ui
     * */
    handleChange(event) {
        const field = event.target.name;
        if (field === 'groupShip') {
            this.groupShipVal = event.detail.value;
            this.dispatchEvent(new CustomEvent('partsrequestdataevent', {
                detail: {
                    workOrder: this.workOrderValue,
                    groupShip: this.groupShipVal
                }
            }));
        } else if (field === 'shipToCusLoc') {
            this.shipToCusLocVal = event.detail.value;
            if(this.shipToCusLocVal === 'Yes'){
                this.addNameVal = ''
                this.addName2Val = ''
                this.addStreetVal = ''
                this.countryValue = ''
                this.cityVal = ''
                this.regionVal = ''
                this.regionOptions = []
                this.postalCodeVal=''
                this.shipConVal=''
                this.shippingCondOptions=[]
            }else if(this.shipToCusLocVal === 'No'){
                this.template.querySelector('lightning-record-picker').clearSelection();
                this.reqFromVal=null;
                this.regionVal = '';
                this.addName2Val = '';
                this.getLocData(this.reqAtLocId);
            }
        } else if (field === 'ShipCon') {
            this.shipConVal = event.detail.value;
        } else if (field === 'HeaderNote') {
            this.headerNoteVal = event.detail.value;
        } else if (field === 'Name') {
            this.addNameVal = event.detail.value;
        } else if (field === 'Name2') {
            this.addName2Val = event.detail.value;
        } else if (field === 'HouseAndStreet') {
            this.addStreetVal = event.detail.value;
        } else if (field === 'City') {
            this.cityVal = event.detail.value;
        } else if (field === 'Region') {
            this.regionVal = event.detail.value;
        } else if (field === 'PostalCode') {
            this.postalCodeVal = event.detail.value;
        } else if (field === 'district') {
            this.districtVal = event.detail.value;
        }
    }

    /**
        * to handle requested from value change
        * */
    handleReqFrom(event) {
        this.reqFromVal = event.detail.recordId;
        this.getLocData(this.reqFromVal);
    }

    /**
        * to validate address fields filled or not
        * */
    @api addressCheck(){
        let errorsFound=0;
        let houseStreetComp=this.template.querySelector(".houseStreetComp")
        let houseStreetValue=houseStreetComp.value
        if(!houseStreetValue){
            houseStreetComp.setCustomValidity("Complete this field");
            errorsFound+=1
        }else{
            houseStreetComp.setCustomValidity("");
        }
        houseStreetComp.reportValidity();
  
        let postalCodeComp=this.template.querySelector(".postalCodeComp")
        let postalCodeValue=postalCodeComp.value
        if(!postalCodeValue){
            postalCodeComp.setCustomValidity("Complete this field");
            errorsFound+=1
        }else{
            postalCodeComp.setCustomValidity("");
        }
        postalCodeComp.reportValidity();

        let cityComp=this.template.querySelector(".cityComp")
        let cityValue=cityComp.value
        if(!cityValue){
            cityComp.setCustomValidity("Complete this field");
            errorsFound+=1
        }else{
            cityComp.setCustomValidity("");
        }
        cityComp.reportValidity();

        let countryComp=this.template.querySelector(".countryComp")
        let countryValue=countryComp.value
        if(!countryValue){
            countryComp.setCustomValidity("Complete this field");
            errorsFound+=1
        }else{
            countryComp.setCustomValidity("");
        }
        countryComp.reportValidity();

        let shipConComp=this.template.querySelector(".shipConComp")
        let shipConValue=shipConComp.value
        if(!shipConValue){
            shipConComp.setCustomValidity("Complete this field");
            errorsFound+=1
        }else{
            shipConComp.setCustomValidity("");
        }
        shipConComp.reportValidity();

        if(this.currentUserSalesOrg === 'BR'){
            let districtComp=this.template.querySelector(".districtComp");
            let districtValue=districtComp.value;
            let districtRequired = districtComp.required;
            if(districtRequired){
                if(!districtValue){
                    districtComp.setCustomValidity("Complete this field");
                    errorsFound+=1
                }else{
                    districtComp.setCustomValidity("");
                }
                districtComp.reportValidity();
            }
        }
         
        let nameComp=this.template.querySelector(".nameComp");
        let nameValue=nameComp.value;
        let nameRequired = nameComp.required;
        if(nameRequired){
            if(!nameValue){
                nameComp.setCustomValidity("Complete this field");
                errorsFound+=1
            }else{
                nameComp.setCustomValidity("");
            }
            nameComp.reportValidity();
        }

        let name2Comp=this.template.querySelector(".name2Comp");
        let name2Value=name2Comp.value;
        let name2Required = name2Comp.required;
        if(name2Required){
            if(!name2Value){
                name2Comp.setCustomValidity("Complete this field");
                errorsFound+=1
            }else{
                name2Comp.setCustomValidity("");
            }
            name2Comp.reportValidity();
        }
        
        let regionComp=this.template.querySelector(".regionComp");
        let regionValue=regionComp.value;
        let regionRequired = regionComp.required;
        if(regionRequired){
            if(!regionValue){
                regionComp.setCustomValidity("Complete this field");
                errorsFound+=1
            }else{
                regionComp.setCustomValidity("");
            }
            regionComp.reportValidity();
        }
        
        if(errorsFound>0){
            return false
        }else{
            return  true
        }
    }

    /**
         * to update parts request
         * */
    @api updatePartsRequest() {
        const fields = {
            Id: this.partsRequestId,
            Group_Shipment_AC__c: this.groupShipVal === 'Yes' ? true : false,
            Shipping_Condition_AC__c: this.shipConVal,
            Address_Country_AC__c: this.countryValue,
            Address_Region_AC__c: this.regionVal,
            Header_Note_AC__c: this.headerNoteVal,
            SVMXC__Requested_From__c: this.reqFromVal,
            Ship_To_Customer_Location_AC__c: this.shipToCusLocVal === 'Yes' ? true : false,
            Address_Name_AC__c: this.addNameVal,
            Address_Name2_AC__c: this.addName2Val,
            Address_Street_AC__c: this.addStreetVal,
            Address_City_AC__c: this.cityVal,
            Address_Postal_Code_AC__c: this.postalCodeVal,
            Address_District_AC__c: this.districtVal
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
                this.dispatchEvent(new CustomEvent('partsrequpdatedevent'));
            })
            .catch((error) => {
                //console.log('error on update',JSON.stringify(error))
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: JSON.stringify(error),
                        message:JSON.stringify(error),
                        variant: "error",
                        mode: 'sticky',
                    }),
                );
            });
    }

    get isBrazilSalesOrg() {
        if(this.currentUserSalesOrg === 'BR'){
            return true;
        } else{
            return false;
        }
    }
}