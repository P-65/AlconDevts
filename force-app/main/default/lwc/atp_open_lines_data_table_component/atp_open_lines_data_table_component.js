import { LightningElement, wire, api, track } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
//apex method to get columns from metadata
import getColumns from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getCustomMetadata';
//apex method to get count of parts request lines
import getCountOfPartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getCountOfPartsReqLines';
//apex method to get parts request lines
import getPartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getPartsReqLines';
//apex method to get parts request lines
import updatePartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.updatePartsReqLines';
//import for urgency code field
import URGENCY_CODE_FIELD from '@salesforce/schema/SVMXC__Parts_Request_Line__c.Urgency_Code__c';
//apex method to delete not selected atp lines from atp result and update selected atp lines
import deleteUpdateOpenPartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.deleteUpdateOpenPartsReqLines';
//apex method to get service center metadata
import getSCMetadata from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getSCMetadata';
//apex method to get custom setting value 
import getCustomSettingValue from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getCustomSettingValue';
//import for parts req fields
import SALES_ORG_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Sales_Org__c';
import REQUIRED_AT_LOCATION_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.SVMXC__Required_At_Location__c';
//import for getrecord and get field value
import { getRecord, getFieldValue} from 'lightning/uiRecordApi';
//import for show toast
import { ShowToastEvent } from "lightning/platformShowToastEvent";
//import for naviating to record
import { NavigationMixin } from 'lightning/navigation';
//import lightning confirm
import LightningConfirm from 'lightning/confirm';
//import custom labels
import ATP_Non_WO_PartsRequest_Validation from '@salesforce/label/c.ATP_Non_WO_PartsRequest_Validation'
import ATP_UDCR_ReqQtyLessThanAvailQty_Validation from '@salesforce/label/c.ATP_UDCR_ReqQtyLessThanAvailQty_Validation'
import ATP_QtyRequiredNull_Validation from '@salesforce/label/c.ATP_QtyRequiredNull_Validation'
import ATP_AllowOrderFromSC_Validation from '@salesforce/label/c.ATP_AllowOrderFromSC_Validation'
import ATP_UDCR_Source_Validation from '@salesforce/label/c.ATP_UDCR_Source_Validation'
import ATP_Line_Error_PlaceOrder_Validation from '@salesforce/label/c.ATP_Line_Error_PlaceOrder_Validation'
import ATP_Line_Error_Edit_Validation from '@salesforce/label/c.ATP_Line_Error_Edit_Validation'
import ATP_PlaceOrder_WarningMessage from '@salesforce/label/c.ATP_PlaceOrder_WarningMessage'
import ATP_PlaceOrderConfirmationMessage from '@salesforce/label/c.ATP_PlaceOrderConfirmationMessage'
import ATP_Source_Trunk_Validation from '@salesforce/label/c.ATP_Source_Trunk_Validation'
import ATP_UDCRBackOrderForLocal_Validation from '@salesforce/label/c.ATP_UDCRBackOrderForLocal_Validation'
import ATP_UDCRBackOrderForSC_Validation from '@salesforce/label/c.ATP_UDCRBackOrderForSC_Validation'
import ATP_NonUDCRBackOrderForLocal_Validation from '@salesforce/label/c.ATP_NonUDCRBackOrderForLocal_Validation'
import ATP_NonUDCRBackOrderForSC_Validation from '@salesforce/label/c.ATP_NonUDCRBackOrderForSC_Validation'
import ATP_UDCRBackOrderFalseForLocal_Validation from '@salesforce/label/c.ATP_UDCRBackOrderFalseForLocal_Validation'
import ATP_UDCRBackOrderFalseForSC_Validation from '@salesforce/label/c.ATP_UDCRBackOrderFalseForSC_Validation'
import ATP_ExpensedForTrunk_Validation from '@salesforce/label/c.ATP_ExpensedForTrunk_Validation'
import ATP_Prophet_Parts_Order_From_Service_Center_Validation from '@salesforce/label/c.ATP_Prophet_Parts_Order_From_Service_Center_Validation'
import ATP_ExpensedForBrazil_Validation from '@salesforce/label/c.ATP_ExpensedForBrazil_Validation'
import ATP_UDCR_Label from '@salesforce/label/c.ATP_UDCR_Label'
import ATP_TRUNK_Label from '@salesforce/label/c.ATP_TRUNK_Label'
import ATP_LOCAL_Label from '@salesforce/label/c.ATP_LOCAL_Label'
import ATP_SC_Label from '@salesforce/label/c.ATP_SC_Label'
import ATP_PartsReqLineUpdated_Message from '@salesforce/label/c.ATP_PartsReqLineUpdated_Message'
import ATP_PartsReqLineUpdateError_Message from '@salesforce/label/c.ATP_PartsReqLineUpdateError_Message'
import ATP_SelectALine_Message from '@salesforce/label/c.ATP_SelectALine_Message'
import ATP_BusinessPriority_Label from '@salesforce/label/c.ATP_BusinessPriority_Label'
import ATP_UDCR_BP_Mix_Validation from '@salesforce/label/c.ATP_UDCR_BP_Mix_Validation'
import ATP_BP_Label from '@salesforce/label/c.ATP_BP_Label'


//parts request fields
const FIELDS = [SALES_ORG_FIELD,REQUIRED_AT_LOCATION_FIELD];
export default class Atp_open_lines_datatable_component extends NavigationMixin(LightningElement) {
    //variable for parts request record id
    @api partsRequestId
    //variable for record type id
    @api partsReqLineAtpCheckLineRecordTypeId
    //variable for parts request line product ids string
    @api productIdsString
    //variable for group shipment value
    @api groupShipVal
    //variable for work order value
    @api workOrderVal
    //variable for record to display
    @track recordsToDisplay = [];
    //variable for the Columns 
    columns = [];
    //variable for current sort direction
    sortDirection = 'asc';
    //variable for current sorted by column
    sortedBy = 'Requested Part';
    //variable for storing lookup field definations to be used to convert it to URL.
    lookupFieldsName = [];
    //variable to store default value fields
    defaultValuefields = [];
    //variable to store forward offset parts request line Ids
    forwardOffsetPartReqLineIds = [];
    //variable to store backward offset parts request line Ids
    backwardOffsetPartReqLineIds = [];
    //variable fields to be queried
    fieldsToQuery;
    //variable to store the Selected Fields
    selectedFieldsForSearch = [];
    //variable for search key entered by User
    searchKey;
    //variable for total No of Records
    totalRecords = 0;
    //variable for no.of records to be displayed per page
    pageSize;
    //variable for total no.of pages
    totalPages = 0;
    //variable for Page number    
    pageNumber = 1;
    //variable for count of records on the last page
    lastPageCount;
    //variable for spinner
    isLoading = false;
    //variable for selected Source Values
    selectedSourceValues;
    //variable for storing errors to display on datatable
    errors = {};
    //variable for storing row ids with errors 
    errorRowIds = [];
    //variable for urgency code picklist options
    urgencyCodePickOptions
    //variable for source valurs
    sourceValues
    //variable for current user sales org
    currentUserSalesOrg
    //variable for required at location
    requiredAtLocation
    //variable to determine order from Service Center allowed or blocked
    allowOrderFromSC=false
    //variable to determine udcr backorder for local permission
    udcrBackOrderForLocal
    //variable to determine udcr backorder for sc permission
    udcrBackOrderForSC
    //variable to determine non udcr backorder for local permission
    nonUDCRBackOrderForLocal
    //variable to determine non udcr backorder for sc permission
    nonUDCRBackOrderForSC
    //variable for pre selected rows
    preSelectedRows=[]
    //variable for BR expense order
    expenseOrderBR=''
    //variable for old urgency code from processsed lines
    oldUrgencyCode
    //variable for page size options
    pageSizeOptions = [
        { label: 1000, value: 1000 },
        { label: 500, value: 500 },
        { label: 100, value: 100 },
        { label: 50, value: 50},
        { label: 25, value:25 },
    ];

    /**
     * to fetch sales org from parts request
     * to fetch SC Metadata
     */
    @wire(getRecord, { recordId: '$partsRequestId', fields: FIELDS })
    currentUserInfo({ error, data }) {
        if (data) {
            this.currentUserSalesOrg = getFieldValue(data, SALES_ORG_FIELD);
            this.requiredAtLocation=getFieldValue(data, REQUIRED_AT_LOCATION_FIELD);
            if (this.currentUserSalesOrg != null) {
                getSCMetadata({ salesOrg: this.currentUserSalesOrg })
                    .then((data) => {

                        if (!data||data.length==0) {
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: `${ATP_Prophet_Parts_Order_From_Service_Center_Validation}`,
                                    variant: "error",
                                    mode: 'sticky'
                                }),
                            );  
                        }else{
                             this.allowOrderFromSC = data[0].Allow_Order_From_SC__c;
                             this.udcrBackOrderForLocal=data[0].UDCR_Back_Order_for_Local__c;
                             this.udcrBackOrderForSC=data[0].UDCR_Back_Order_for_SC__c;
                             this.nonUDCRBackOrderForLocal=data[0].NON_UDCR_Back_Order_for_Local__c;
                             this.nonUDCRBackOrderForSC=data[0].NON_UDCR_Back_Order_for_SC__c;
                        }
                        this.sourceValues = this.allowOrderFromSC ? [ATP_LOCAL_Label, ATP_SC_Label] : [ATP_LOCAL_Label];
                        this.dispatchEvent(new CustomEvent('sourcevaluesevent', { detail: this.sourceValues }));
                    })
                    .catch(error => {
                        // console.log(error)
                    })
                    getCustomSettingValue()
                       .then((data) => {
                           this.expenseOrderBR=data
                           //console.log('BR',JSON.stringify(this.expenseOrderBR))
                       })
                       .catch(error=>{
                        // console.log(error)
                       })
            }
        } else if (error) {
            //console.log(error)
        }
    }

    /**
      * to get the Open lines Table Columns
      * this will be fired on load
        */
    @wire(getColumns)
    getColumns({ error, data }) {
        if (data) {
            //get all columns which are for context "Open Lines Datatable"
            let itemSearchCols = data.filter(col => col.Context__c == 'Open Lines Datatable'&& !col.Hidden__c);
            //get default page size for datatable
            let pageSizeData=data.filter(col => col.Context__c == 'Datatable Page Size');
            if(pageSizeData){
            this.pageSize = pageSizeData[0].Default_Datatable_Page_Size__c
            }
            //sort all columns by Order field
            itemSearchCols.sort((a, b) => a.Order__c - b.Order__c);
            let isfirst = true;
            //add these columns in the columns array
            itemSearchCols.forEach(col => {
                let colItem = {};
                colItem.hideDefaultActions = true;
                colItem.sortable = col.Is_Sortable__c;
                colItem.wrapText = true;
                colItem.label = col.MasterLabel;

                if (col.API_Name__c != null) {
                    colItem.fieldName = col.API_Name__c;
                } else {
                    colItem.fieldName = col.MasterLabel;
                }

                if (col.Type__c == "Boolean") {
                    colItem.type = "boolean"
                   }

                if (col.Type__c == "Number") {
                    colItem.type = "number"
                   }

                if (col.Type__c == "Picklist" && col.Is_Editable__c) {
                    colItem.type = "customPicklist"
                    colItem.typeAttributes = {
                        options: { fieldName: "pickListOptions" },
                        value: { fieldName: col.API_Name__c },
                        context: { fieldName: "Id" }
                    }
                } else if (col.Type__c == "Picklist") {
                    colItem.type = "text"
                }
                if (col.Type__c == 'Lookup' && col.API_Name__c != null) {
                    colItem.type = "url";
                    colItem.fieldName = col.API_Name__c.substring(0, col.API_Name__c.indexOf('_r')) + '_c';
                    colItem.typeAttributes = {
                        label: { fieldName: col.MasterLabel },
                        target: '_self'
                    }
                }

                if (col.Fixed_Width__c) {
                    colItem.initialWidth = col.Fixed_Width__c;
                }
                if (col.Is_Editable__c) {
                    colItem.editable = true


                } else {
                    colItem.cellAttributes = {
                        class: { fieldName: 'columnColor' }
                    }

                }

                this.columns = [...this.columns, colItem];
                //add the column for querying data
                if (col.API_Name__c != null && col.API_Name__c != 'Name') {
                    if (isfirst) {
                        if (col.Type__c == "Picklist") {
                            this.fieldsToQuery = 'toLabel(' + col.API_Name__c + '),';
                        } else {
                            this.fieldsToQuery = col.API_Name__c + ',';
                        }
                        isfirst = false;
                    } else {
                        if (col.Type__c == "Picklist") {
                            this.fieldsToQuery += 'toLabel(' + col.API_Name__c + '),';
                        } else {
                            this.fieldsToQuery += col.API_Name__c + ',';
                        }
                    }
                }
                if (col.API_Name__c == null && col.Default_Value__c != null) {
                    let defaultValueRec = {
                        "colName": col.MasterLabel,
                        "defaultValue": col.Default_Value__c
                    };
                    this.defaultValuefields.push(defaultValueRec);
                }

                if (col.Type__c == 'Lookup' && col.API_Name__c != null) {
                    let relativeName = col.API_Name__c.substring(0, col.API_Name__c.indexOf('_r')) + '_r';
                    let relativeFieldName = col.API_Name__c.substring((col.API_Name__c.indexOf('_r') + 3), col.API_Name__c.length);
                    let relativeFieldActualName = col.API_Name__c.substring(0, col.API_Name__c.indexOf('_r')) + '_c';
                    let colName = col.MasterLabel;
                    let colApiName = col.API_Name__c;

                    let lookupDefination = {
                        "relativeName": relativeName,
                        "relativeFieldName": relativeFieldName,
                        "relativeFieldActualName": relativeFieldActualName,
                        "colName": colName,
                        "colApiName": colApiName
                    };
                    this.lookupFieldsName.push(lookupDefination);
                }

                if (col.Type__c != 'Number'&&col.Type__c != 'Date' && col.Type__c != 'Boolean' && col.Type__c != 'Text Area' && col.API_Name__c != null) {
                    this.selectedFieldsForSearch = [...this.selectedFieldsForSearch, col.API_Name__c];
                }
            });
            this.getProceLinesData();
            if (this.fieldsToQuery) {
                //this.dispatchEvent(new CustomEvent('queryrecordsevent'));
            }
        } else if (error) {
            //  console.log(error);
        }
    }

    /**
      * to fetch urgency code picklist values
    */
    @wire(getPicklistValues, { recordTypeId: "$partsReqLineAtpCheckLineRecordTypeId", fieldApiName: URGENCY_CODE_FIELD })
    urgencyCodePicklistValues({ error, data }) {
        if (data) {
            this.urgencyCodePickOptions = data.values;
            //console.log('urgencycodeoptions',JSON.stringify(this.urgencyCodePickOptions))

        } else if (error) {
            // console.error('error while fetching urgency code picklist options', error);
        }
    }

    /**
      * to fetch atp lines records and its count
      * called from parent
      */
    @api handleQueryRecords() {
        this.getPartsReqLineCount();
        this.getActualLinesData();
        //this.getProceLinesData();
    }

    /**
      * to fetch atp lines records count
      */
    async getPartsReqLineCount() {
        let sQuery = this.prepareSOQLQuery(true);
        if (sQuery) {
            try {
                this.totalRecords = await getCountOfPartsReqLines({ sCountQuery: sQuery });
                this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
                this.pageNumber = 1;
                this.lastPageCount = (this.totalRecords % this.pageSize) === 0 ? this.pageSize : this.totalRecords % this.pageSize;
                if (this.totalPages == 1) {
                    this.dispatchEvent(new CustomEvent('disableselectall'));
                }
                else {
                    this.dispatchEvent(new CustomEvent('enableselectall'));
                }
            }
            catch (error) {
                // console.log(error);
            }
        } else {
            //  console.log('Query is Blank');
        }
    }

    /**
      * to fetch atp lines records 
      */
    getActualLinesData() {
        let sQuery = this.prepareSOQLQuery(false);
        if (sQuery) {
            this.isLoading = true;
            getPartsReqLines({
                sQuery: sQuery
            })
                .then((data) => {
                    if (data.length > 0) {
                        let tempRecs = [];
                        data.forEach((record) => {
                            let tempRec = JSON.parse(JSON.stringify(record));
                            this.lookupFieldsName.forEach(lookupField => {
                                let relativeName = lookupField.relativeName;
                                let relativeFieldName = lookupField.relativeFieldName;
                                let relativeFieldActualName = lookupField.relativeFieldActualName;
                                let colName = lookupField.colName;
                                if (tempRec[relativeFieldActualName] != null) {
                                    tempRec[colName] = JSON.stringify(tempRec[relativeName][relativeFieldName]).replaceAll('"', '');
                                    tempRec[relativeFieldActualName] = '/' + tempRec[relativeName].Id;
                                }
                            });
                            this.defaultValuefields.forEach(defaultValueRec => {
                                let colName = defaultValueRec.colName;
                                let defaultValue = defaultValueRec.defaultValue;
                                if (defaultValue != null) {
                                    let rec = JSON.stringify(tempRec);
                                    rec = rec.substring(0, rec.length - 1).concat(',"', colName, '":"', defaultValue, '"}')
                                    tempRec = JSON.parse(rec);
                                }
                            });
                            tempRecs.push(tempRec);
                        });

                        const records = tempRecs.map(item => {
                            return {
                                ...item,
                                "columnColor": "slds-box slds-theme_shade"
                            }
                        });
                        if (this.urgencyCodePickOptions) {
                            this.recordsToDisplay = records.map((currItem) => {
                                let pickListOptions = this.urgencyCodePickOptions;
                                return {
                                    ...currItem,
                                    pickListOptions: pickListOptions
                                };
                            });
                        } else {
                            this.recordsToDisplay = records;
                        }
                        //sort by requested Part
                        const cloneData = [...this.recordsToDisplay];
                        cloneData.sort(this.sortBy(this.sortedBy, this.sortDirection === 'asc' ? 1 : -1));
                        this.recordsToDisplay = cloneData;
                        //console.log('openlinesdata',JSON.stringify( this.recordsToDisplay))
                        this.isLoading = false;
                        this.forwardOffsetPartReqLineIds[this.pageNumber - 1] = tempRecs[tempRecs.length - 1].Id;
                        this.backwardOffsetPartReqLineIds[this.pageNumber - 1] = tempRecs[0].Id;
                    } else {
                        this.recordsToDisplay = [];
                        this.isLoading = false;
                    }
                })
                .catch((error) => {
                    // console.log(error);
                });
        } else {
            //  console.log('No Query is selected');
        }
    }

      /**
     * to fetch processed lines data to validate mix of UDCR and BP urgency codes
     * */
      getProceLinesData() {
        let sQuery = `SELECT Id,toLabel(Urgency_Code__c) From SVMXC__Parts_Request_Line__c WHERE SVMXC__Parts_Request__c = '${this.partsRequestId}' AND Requested_Part__c IN (${this.productIdsString}) AND RecordTypeId='${this.partsReqLineAtpCheckLineRecordTypeId}' AND SVMXC__Line_Status__c!='Open' AND (Urgency_Code__c ='${ATP_BP_Label}' OR Urgency_Code__c ='${ATP_UDCR_Label}')  Limit 1`;
        //console.log(sQuery)
        getPartsReqLines({
                sQuery: sQuery
            })
                .then((data) => {
                    if (data.length > 0) {
                        const record = data[0];
                        this.oldUrgencyCode=record.Urgency_Code__c;
                    } else {
                    }
                })
                .catch((error) => {
                   // console.log(error);
                });
    }

    /**
      * to prepare SOQL Query based on user selected filters
      */
    prepareSOQLQuery(isCountQuery) {
        //variable to store complete query
        let sQuery;
        //variable to store the Select Clause
        let selectClause = 'SELECT Id, ';
        //variable to store the From Clause
        let fromClause = 'From SVMXC__Parts_Request_Line__c WHERE ';
        //variable to store the Where Clause
        let whereClause = `SVMXC__Parts_Request__c = '${this.partsRequestId}' AND Requested_Part__c IN (${this.productIdsString}) AND RecordTypeId='${this.partsReqLineAtpCheckLineRecordTypeId}' AND SVMXC__Line_Status__c='Open' AND FSE_Trunk_Location__c!='${this.requiredAtLocation}'`;
        //variable to store the Limit Clause
        let limitClause = '';
        //variable to store the Order clause
        let orderClause = '';

        //create the Select Clause
        if (isCountQuery) {
            selectClause = 'SELECT count() FROM SVMXC__Parts_Request_Line__c WHERE ';
        } else {
            if (this.fieldsToQuery) {
                selectClause = selectClause + this.fieldsToQuery.slice(0, -1) + ' ' + fromClause + '';

            } else {
                selectClause = selectClause + fromClause;
            }
        }

        //create the Where clause from Search Key
        if (this.searchKey) {
            let searchKeyStrings = [];
            if (this.searchKey.includes(',')) {
                searchKeyStrings = this.searchKey.split(',');
            } else {
                searchKeyStrings = [this.searchKey];
            }

            let searchKeyWhereClause = 'AND (';

            let isFirst = true;
            searchKeyStrings.forEach(searchstring => {
                if (this.selectedFieldsForSearch.length > 0) {
                    this.selectedFieldsForSearch.forEach(searchField => {
                        if (isFirst) {
                            searchKeyWhereClause += searchField + ' LIKE \'%' + searchstring + '%\' ';
                            isFirst = false;
                        } else {
                            searchKeyWhereClause += ' OR ' + searchField + ' LIKE \'%' + searchstring + '%\' ';
                        }
                    });
                }
            });
            searchKeyWhereClause += ')';
            whereClause = whereClause + searchKeyWhereClause;
        }

        if (this.selectedSourceValues && this.selectedSourceValues.length > 0) {
            const formattedValues = this.selectedSourceValues.map(value => `'${value}'`).join(', ');
            let sourceWhereClause = `AND Source__c IN (${formattedValues})`;
            whereClause = whereClause + sourceWhereClause;
        }

        if (!isCountQuery && this.pageNumber > 1 && this.pageNumber < this.totalPages) {
            if (this.forwardOffsetPartReqLineIds[this.pageNumber - 2])
                whereClause = '(' + whereClause + ') AND ID > \'' + this.forwardOffsetPartReqLineIds[this.pageNumber - 2] + '\'';
            else
                whereClause = '(' + whereClause + ') AND ID < \'' + this.backwardOffsetPartReqLineIds[this.pageNumber] + '\'';
        }

        if (!isCountQuery) {
            if (this.pageNumber == 1 || (this.pageNumber < this.totalPages && this.forwardOffsetPartReqLineIds[this.pageNumber - 2]))
                orderClause = ' ORDER BY ID ASC';
            else
                orderClause = ' ORDER BY ID DESC';
        }

        if (!isCountQuery && this.pageSize != null) {
            if (this.pageNumber == 1 || this.pageNumber < this.totalPages) {
                limitClause = ' LIMIT ' + this.pageSize;

            } else {
                limitClause = ' LIMIT ' + this.lastPageCount;
            }
        }

        sQuery = selectClause + whereClause + orderClause + limitClause;
        return sQuery;
    }

    /**
    * to handle quantity required and urgency code and validations
    */
    handleOnCellChange(event) {
        const draftValues=this.template.querySelector('c-atp_custom_datatable_datatype').draftValues
        let hasErrors = false;
        let rowErrors = {};
        draftValues.forEach(draftRow => {
            let messages = [];
            let fieldNames = [];
            let urgencyCodeBP=(draftRow.Urgency_Code__c == ATP_BP_Label) ? ATP_BP_Label : null;
            let recordToDisplay = this.recordsToDisplay.find(record => record.Id === draftRow.Id);

            if (recordToDisplay) {
                if (recordToDisplay.Source__c === ATP_TRUNK_Label && !recordToDisplay.Expensed_Result_Flag_AC__c) {

                    if ((draftRow.Urgency_Code__c === ATP_UDCR_Label||draftRow.Urgency_Code__c === urgencyCodeBP) && (recordToDisplay.Source__c != ATP_LOCAL_Label && recordToDisplay.Source__c != ATP_SC_Label)) {
                        messages.push(`${ATP_UDCR_Source_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }

                    if (recordToDisplay.Source__c === ATP_TRUNK_Label && parseFloat(draftRow.SVMXC__Quantity_Required2__c) > recordToDisplay.Available_Qty_AC__c) {
                        messages.push(`${ATP_Source_Trunk_Validation}`);
                        fieldNames.push('SVMXC__Quantity_Required2__c');

                    }
                }else if(recordToDisplay.Source__c === ATP_TRUNK_Label && recordToDisplay.Expensed_Result_Flag_AC__c){
                        messages.push(`${ATP_ExpensedForTrunk_Validation}`);
                        fieldNames.push('Source__c');
                }else if (this.currentUserSalesOrg === this.expenseOrderBR && recordToDisplay.Expensed_Result_Flag_AC__c) {
                        messages.push(`${ATP_ExpensedForBrazil_Validation}`);
                        fieldNames.push('Source__c');
                    }else{
                 if ((!this.allowOrderFromSC && recordToDisplay.Source__c != ATP_SC_Label)||(this.allowOrderFromSC && recordToDisplay.Source__c != ATP_SC_Label)||(this.allowOrderFromSC && recordToDisplay.Source__c === ATP_SC_Label)) {
                if (!recordToDisplay.Error__c) {
                    if (((draftRow.Urgency_Code__c != ATP_UDCR_Label&&draftRow.Urgency_Code__c != urgencyCodeBP)||((recordToDisplay.Urgency_Code__c!=ATP_UDCR_Label&&recordToDisplay.Urgency_Code__c != ATP_BusinessPriority_Label) &&!('Urgency_Code__c' in draftRow)))||((draftRow.Urgency_Code__c === ATP_UDCR_Label||draftRow.Urgency_Code__c === urgencyCodeBP)||((recordToDisplay.Urgency_Code__c===ATP_UDCR_Label||recordToDisplay.Urgency_Code__c === ATP_BusinessPriority_Label) &&!('Urgency_Code__c' in draftRow))) && this.workOrderVal) {
                    if ((draftRow.Urgency_Code__c === ATP_UDCR_Label||draftRow.Urgency_Code__c === urgencyCodeBP) && !recordToDisplay.SVMXC__Quantity_Required2__c) {
                        messages.push(`${ATP_QtyRequiredNull_Validation}`);
                        fieldNames.push('SVMXC__Quantity_Required2__c');
                    }

                    if (('SVMXC__Quantity_Required2__c' in draftRow && !draftRow.SVMXC__Quantity_Required2__c) || (draftRow.SVMXC__Quantity_Required2__c && (parseFloat(draftRow.SVMXC__Quantity_Required2__c) < 1 || isNaN(draftRow.SVMXC__Quantity_Required2__c)))) {
                        messages.push(`${ATP_QtyRequiredNull_Validation}`);
                        fieldNames.push('SVMXC__Quantity_Required2__c');
                    }

                    if (((draftRow.Urgency_Code__c === ATP_UDCR_Label||draftRow.Urgency_Code__c === urgencyCodeBP)||((recordToDisplay.Urgency_Code__c===ATP_UDCR_Label||recordToDisplay.Urgency_Code__c === ATP_BusinessPriority_Label)&&!('Urgency_Code__c' in draftRow))) && ((recordToDisplay.SVMXC__Quantity_Required2__c <= recordToDisplay.Available_Qty_AC__c&&!('SVMXC__Quantity_Required2__c' in draftRow))||(parseFloat(draftRow.SVMXC__Quantity_Required2__c)<=recordToDisplay.Available_Qty_AC__c))) {
                        messages.push(`${ATP_UDCR_ReqQtyLessThanAvailQty_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                        fieldNames.push('SVMXC__Quantity_Required2__c');
                    }

                    if (this.workOrderVal&&this.udcrBackOrderForLocal&&((draftRow.Urgency_Code__c != ATP_UDCR_Label&&draftRow.Urgency_Code__c != urgencyCodeBP) ||((recordToDisplay.Urgency_Code__c!=ATP_UDCR_Label&&recordToDisplay.Urgency_Code__c != ATP_BusinessPriority_Label) &&!('Urgency_Code__c' in draftRow)))&& recordToDisplay.Source__c === ATP_LOCAL_Label && ((recordToDisplay.SVMXC__Quantity_Required2__c > recordToDisplay.Available_Qty_AC__c&&!('SVMXC__Quantity_Required2__c' in draftRow)||parseFloat(draftRow.SVMXC__Quantity_Required2__c) > recordToDisplay.Available_Qty_AC__c))) {
                        messages.push(`${ATP_UDCRBackOrderForLocal_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }else if((!this.udcrBackOrderForLocal||(this.udcrBackOrderForLocal&&!this.workOrderVal))&&(!this.nonUDCRBackOrderForLocal)&& recordToDisplay.Source__c === ATP_LOCAL_Label && ((recordToDisplay.SVMXC__Quantity_Required2__c > recordToDisplay.Available_Qty_AC__c&&!('SVMXC__Quantity_Required2__c' in draftRow)||parseFloat(draftRow.SVMXC__Quantity_Required2__c) > recordToDisplay.Available_Qty_AC__c))) {
                        messages.push(`${ATP_NonUDCRBackOrderForLocal_Validation}`);
                        fieldNames.push('SVMXC__Quantity_Required2__c');
                    }else if (!this.udcrBackOrderForLocal&&((draftRow.Urgency_Code__c === ATP_UDCR_Label||draftRow.Urgency_Code__c === urgencyCodeBP)||((recordToDisplay.Urgency_Code__c===ATP_UDCR_Label||recordToDisplay.Urgency_Code__c === ATP_BusinessPriority_Label) &&!('Urgency_Code__c' in draftRow)))&& recordToDisplay.Source__c === ATP_LOCAL_Label && ((recordToDisplay.SVMXC__Quantity_Required2__c > recordToDisplay.Available_Qty_AC__c&&!('SVMXC__Quantity_Required2__c' in draftRow)||parseFloat(draftRow.SVMXC__Quantity_Required2__c) > recordToDisplay.Available_Qty_AC__c))) {
                        messages.push(`${ATP_UDCRBackOrderFalseForLocal_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }

                    if (this.workOrderVal&&this.udcrBackOrderForSC&&((draftRow.Urgency_Code__c != ATP_UDCR_Label&&draftRow.Urgency_Code__c != urgencyCodeBP)||((recordToDisplay.Urgency_Code__c!=ATP_UDCR_Label&&recordToDisplay.Urgency_Code__c != ATP_BusinessPriority_Label) &&!('Urgency_Code__c' in draftRow)))&& recordToDisplay.Source__c === ATP_SC_Label&& ((recordToDisplay.SVMXC__Quantity_Required2__c > recordToDisplay.Available_Qty_AC__c&&!('SVMXC__Quantity_Required2__c' in draftRow)||parseFloat(draftRow.SVMXC__Quantity_Required2__c) > recordToDisplay.Available_Qty_AC__c))) {
                        messages.push(`${ATP_UDCRBackOrderForSC_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }else if ((!this.udcrBackOrderForSC||(this.udcrBackOrderForSC&&!this.workOrderVal))&&!this.nonUDCRBackOrderForSC&& recordToDisplay.Source__c === ATP_SC_Label&& ((recordToDisplay.SVMXC__Quantity_Required2__c > recordToDisplay.Available_Qty_AC__c&&!('SVMXC__Quantity_Required2__c' in draftRow)||parseFloat(draftRow.SVMXC__Quantity_Required2__c) > recordToDisplay.Available_Qty_AC__c))) {
                        messages.push(`${ATP_NonUDCRBackOrderForSC_Validation}`);
                        fieldNames.push('SVMXC__Quantity_Required2__c');
                    }else if (!this.udcrBackOrderForSC&&((draftRow.Urgency_Code__c === ATP_UDCR_Label||draftRow.Urgency_Code__c === urgencyCodeBP) ||((recordToDisplay.Urgency_Code__c===ATP_UDCR_Label||recordToDisplay.Urgency_Code__c === ATP_BusinessPriority_Label) &&!('Urgency_Code__c' in draftRow)))&& recordToDisplay.Source__c === ATP_SC_Label&& ((recordToDisplay.SVMXC__Quantity_Required2__c > recordToDisplay.Available_Qty_AC__c&&!('SVMXC__Quantity_Required2__c' in draftRow)||parseFloat(draftRow.SVMXC__Quantity_Required2__c) > recordToDisplay.Available_Qty_AC__c))) {
                        messages.push(`${ATP_UDCRBackOrderFalseForSC_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }

                  }else {
                            messages.push(`${ATP_Non_WO_PartsRequest_Validation}`);
                            fieldNames.push('Urgency_Code__c');
                        }
                } else {
                    messages.push(`${ATP_Line_Error_Edit_Validation}`);
                    fieldNames.push('Urgency_Code__c');
                    fieldNames.push('SVMXC__Quantity_Required2__c');
                }
            } else{
                messages.push(`${ATP_AllowOrderFromSC_Validation}`);
                fieldNames.push('Source__c');
            }
        }
            }

            if (messages.length > 0) {
                hasErrors = true;
                rowErrors[draftRow.Id] = {
                    title: `We found ${messages.length} error(s).`,
                    messages: messages,
                    fieldNames: fieldNames
                };
                this.errorRowIds.push(draftRow.Id);
                
            }
        });

        if (hasErrors) {
            this.errors = {
                rows: rowErrors,
                table: {
                    title: 'record cannot be saved. Fix the errors and try again.',
                    messages: Object.values(rowErrors).flatMap(error => error.messages)
                }
            };
            this.dispatchEvent(new CustomEvent('disableplaceorderevent', {
                detail: { disable: true}
            })); 
        } else {
            this.errors = null;
            this.errorRowIds=[]
            this.dispatchEvent(new CustomEvent('disableplaceorderevent', {
                detail: { disable: false}
            })); 
            updatePartsReqLines({ recordsToUpdate: draftValues })
                .then(() => {
                    this.dispatchEvent(new CustomEvent('queryrecordsevent'));
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "Success",
                            message:ATP_PartsReqLineUpdated_Message,
                            variant: "success",
                        }),
                    );
                    window.clearTimeout(this.delayTimeOut);
                    this.delayTimeOut = setTimeout(async () => {
                        this.template.querySelector('lightning-datatable').draftValues = [];
                    }, 500);
                })
                .catch(error => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: ATP_PartsReqLineUpdateError_Message,
                            message: error.body.message,
                            variant: "error",
                        }),
                    );
                })
        }
    }

    /**
      * to filter the atp lines based on searchKey 
      */
    @api handleSearchRecords(searchKey) {
        this.searchKey = searchKey;
        this.getPartsReqLineCount();
        this.getActualLinesData();
    }

    /**
      * to filter the atp lines based on source values 
      */
    @api handleSearchBySourceOpenLines(selectedValues) {
        this.selectedSourceValues = selectedValues;
        this.getPartsReqLineCount();
        this.getActualLinesData();
    }

    /**
      * to handle place order and validations
      */
    @api async handlePlaceOrder() {
        let selectedRecords = this.template.querySelector('c-atp_custom_datatable_datatype').getSelectedRows();
        if (selectedRecords.length > 0) {

            let hasErrors = false;
            let rowErrors = {};
            let firstUrgencyCode=null;
            //console.log(JSON.stringify(selectedRecords));
            selectedRecords.forEach(row => {

                let messages = [];
                let fieldNames = [];
                if (row.Source__c === ATP_TRUNK_Label && !row.Expensed_Result_Flag_AC__c) {
                    if (row.Source__c === ATP_TRUNK_Label && row.SVMXC__Quantity_Required2__c > row.Available_Qty_AC__c) {
                        messages.push(`${ATP_Source_Trunk_Validation}`);
                        fieldNames.push('SVMXC__Quantity_Required2__c');
                    }

                    if ((row.Urgency_Code__c === ATP_UDCR_Label||row.Urgency_Code__c === ATP_BusinessPriority_Label) && (row.Source__c != ATP_LOCAL_Label && row.Source__c != ATP_SC_Label)) {
                        messages.push(`${ATP_UDCR_Source_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }

                    }else if (row.Source__c === ATP_TRUNK_Label && row.Expensed_Result_Flag_AC__c) {
                        messages.push(`${ATP_ExpensedForTrunk_Validation}`);
                        fieldNames.push('Source__c');
                    }else if (this.currentUserSalesOrg === this.expenseOrderBR && row.Expensed_Result_Flag_AC__c) {
                        messages.push(`${ATP_ExpensedForBrazil_Validation}`);
                        fieldNames.push('Source__c');
                    }else{

                if ((!this.allowOrderFromSC && row.Source__c != ATP_SC_Label)||(this.allowOrderFromSC && row.Source__c != ATP_SC_Label)||(this.allowOrderFromSC && row.Source__c === ATP_SC_Label)) {
                if (!row.Error__c) {
                    
                    if ((row.Urgency_Code__c != ATP_UDCR_Label&&row.Urgency_Code__c != ATP_BusinessPriority_Label)||((row.Urgency_Code__c === ATP_UDCR_Label||row.Urgency_Code__c === ATP_BusinessPriority_Label) && this.workOrderVal)) {

                    if ((!row.SVMXC__Quantity_Required2__c || parseFloat(row.SVMXC__Quantity_Required2__c) < 1 || isNaN(row.SVMXC__Quantity_Required2__c))) {
                        messages.push(`${ATP_QtyRequiredNull_Validation}`);
                        fieldNames.push('SVMXC__Quantity_Required2__c');
                    }

                    if ((row.Urgency_Code__c === ATP_UDCR_Label||row.Urgency_Code__c === ATP_BusinessPriority_Label) && row.SVMXC__Quantity_Required2__c <= row.Available_Qty_AC__c) {
                        messages.push(`${ATP_UDCR_ReqQtyLessThanAvailQty_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }

                    if(this.workOrderVal&&(row.Urgency_Code__c == ATP_UDCR_Label||row.Urgency_Code__c == ATP_BusinessPriority_Label)){
                    if(firstUrgencyCode===null){
                        firstUrgencyCode=row.Urgency_Code__c
                    }else if(firstUrgencyCode!=row.Urgency_Code__c){
                        messages.push(`${ATP_UDCR_BP_Mix_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }

                    }

                    if((row.Urgency_Code__c == ATP_UDCR_Label||row.Urgency_Code__c == ATP_BusinessPriority_Label)&&(this.oldUrgencyCode == ATP_UDCR_Label||this.oldUrgencyCode== ATP_BusinessPriority_Label)&&(this.oldUrgencyCode!=row.Urgency_Code__c)){
                        messages.push(`${ATP_UDCR_BP_Mix_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }

                    if (this.workOrderVal&&this.udcrBackOrderForLocal&&(row.Urgency_Code__c != ATP_UDCR_Label&&row.Urgency_Code__c != ATP_BusinessPriority_Label) && row.Source__c === ATP_LOCAL_Label && row.SVMXC__Quantity_Required2__c > row.Available_Qty_AC__c) {
                        messages.push(`${ATP_UDCRBackOrderForLocal_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }else if ((!this.udcrBackOrderForLocal||(this.udcrBackOrderForLocal&&!this.workOrderVal))&&!this.nonUDCRBackOrderForLocal&& row.Source__c === ATP_LOCAL_Label && row.SVMXC__Quantity_Required2__c > row.Available_Qty_AC__c) {
                        messages.push(`${ATP_NonUDCRBackOrderForLocal_Validation}`);
                        fieldNames.push('SVMXC__Quantity_Required2__c');
                    }else if (!this.udcrBackOrderForLocal&&(row.Urgency_Code__c === ATP_UDCR_Label||row.Urgency_Code__c === ATP_BusinessPriority_Label) && row.Source__c === ATP_LOCAL_Label && row.SVMXC__Quantity_Required2__c > row.Available_Qty_AC__c) {
                        messages.push(`${ATP_UDCRBackOrderFalseForLocal_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }

                    if (this.workOrderVal&&this.udcrBackOrderForSC&&(row.Urgency_Code__c != ATP_UDCR_Label&&row.Urgency_Code__c != ATP_BusinessPriority_Label )&& row.Source__c === ATP_SC_Label&& row.SVMXC__Quantity_Required2__c > row.Available_Qty_AC__c) {
                        messages.push(`${ATP_UDCRBackOrderForSC_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }else if ((!this.udcrBackOrderForSC||(this.udcrBackOrderForSC&&!this.workOrderVal))&&!this.nonUDCRBackOrderForSC&& row.Source__c === ATP_SC_Label&& row.SVMXC__Quantity_Required2__c > row.Available_Qty_AC__c) {
                        messages.push(`${ATP_NonUDCRBackOrderForSC_Validation}`);
                        fieldNames.push('SVMXC__Quantity_Required2__c');
                    }else if (!this.udcrBackOrderForSC&&(row.Urgency_Code__c === ATP_UDCR_Label||row.Urgency_Code__c === ATP_BusinessPriority_Label) && row.Source__c === ATP_SC_Label && row.SVMXC__Quantity_Required2__c > row.Available_Qty_AC__c) {
                        messages.push(`${ATP_UDCRBackOrderFalseForSC_Validation}`);
                        fieldNames.push('Urgency_Code__c');
                    }
                  }else  {
                            messages.push(`${ATP_Non_WO_PartsRequest_Validation}`);
                            fieldNames.push('Urgency_Code__c');
                        }
                } else {
                    messages.push(`${ATP_Line_Error_PlaceOrder_Validation}`);
                    fieldNames.push('Error__c');
                }
                } else{
                    messages.push(`${ATP_AllowOrderFromSC_Validation}`);
                    fieldNames.push('Source__c');
                }
            }
                if (messages.length > 0) {
                    hasErrors = true;
                    rowErrors[row.Id] = {
                        title: `We found ${messages.length} errors.`,
                        messages: messages,
                        fieldNames: fieldNames
                    };
                    this.errorRowIds.push(row.Id);
                }
            });

            if (hasErrors) {
                this.errors = {
                    rows: rowErrors,
                    table: {
                        title: 'Error while placing order. Fix the errors and try again.',
                        messages: Object.values(rowErrors).flatMap(error => error.messages)
                    }
                };
                this.dispatchEvent(new CustomEvent('disableplaceorderevent', {
                    detail: { disable: true}
                })); 
            } else {
                const result = await LightningConfirm.open({
                    message: this.groupShipVal === 'Yes' ? `${ATP_PlaceOrder_WarningMessage} \n ${ATP_PlaceOrderConfirmationMessage}` : `${ATP_PlaceOrderConfirmationMessage}`,
                    //  variant: 'headerless',
                    theme: 'warning',
                    label: 'warning',
                });
                if (result) {
                    this.errors = null;
                    this.errorRowIds=[]
                    let ids = '';
                    selectedRecords.forEach(currentItem => {
                        ids = ids + ',' + currentItem.Id;
                    });
                    this.selectedIds = ids.replace(/^,/, '');
                    this.dispatchEvent(new CustomEvent('updatepartsrequestevent'));
                }
            }
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: ATP_SelectALine_Message,
                    //message: error.body.message,
                    // variant: "error",
                }),
            );
        }
    }

    /**
     * to handle row selection
     */
    handleRowSelection(event){
        const selectedRows = event.detail.selectedRows;
        let selectedRowIds = selectedRows.map(row => row.Id);
        this.preSelectedRows=selectedRowIds;
        let matchingIds = selectedRowIds.filter(id => this.errorRowIds.includes(id));
        this.dispatchEvent(new CustomEvent('disableplaceorderevent', {
            detail: { disable: matchingIds.length > 0? true : false }
        })); 
    }

    /**
     * to sort the column clicked by user
     * depending on the column selected and sorting direction, data will be sorted
     */
    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.recordsToDisplay];
        cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
        this.recordsToDisplay = cloneData;
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
    }

    /**
     * to sort the column 
     * */
    sortBy(field, reverse, primer) {
        const key = primer
            ? function (x) {
                return primer(x[field]);
            }
            : function (x) {
                return x[field];
            };

        return function (a, b) {
            a = key(a);
            b = key(b);
            return reverse * ((a > b) - (b > a));
        };
    }

    /**
        * to handle the change in combo box of Record Per Page
        * to get the parts request line data as per new Page Size
        */
    handleRecordsPerPage(event) {
        this.pageSize = Number(event.target.value);
        this.pageNumber = 1;
        this.totalPages = Math.ceil(this.totalRecords / event.target.value);
        this.lastPageCount = (this.totalRecords % this.pageSize) === 0 ? this.pageSize : this.totalRecords % this.pageSize;
        this.getActualLinesData();
        if (this.totalPages == 1) {
            this.dispatchEvent(new CustomEvent('disableselectall'));
        }
        else {
            this.dispatchEvent(new CustomEvent('enableselectall'));
        }
    }

    /**
       * to refresh open atp line records
     */
    @api handleRefresh() {
        this.errors = null;
        this.searchKey = '';
        this.selectedSourceValues = this.sourceValues;
        this.getPartsReqLineCount();
        this.getActualLinesData();
        this.errorRowIds=[]
        this.dispatchEvent(new CustomEvent('disableplaceorderevent', {
            detail: { disable: false }
        }));
    }

    /**
     * to handle parts req updated event
     * to delete not selected and update selected atp lines
     * this method called from parent
     * */
    @api handlePartsReqUpdated(){
        deleteUpdateOpenPartsReqLines({ partsReqId: this.partsRequestId, partsReqLineIds: this.selectedIds })
                        .then(() => {
                            //window.close();
                            this[NavigationMixin.Navigate]({
                                type: 'standard__recordPage',
                                attributes: {
                                    recordId: this.partsRequestId,
                                    objectApiName: 'SVMXC__Parts_Request__c',
                                    actionName: 'view'
                                }
                            });

                        })
                        .catch(error => {
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: ATP_PartsReqLineUpdateError_Message,
                                    message: error.body.message,
                                    variant: "error",
                                    mode: 'sticky'
                                }),
                            );
                        })
    }

    /**
     * to handle previous button click
     * this will take to previous page
     */
    goToPreviousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.getActualLinesData();
    }

    /**
     * to handle next button click
     * This will take to next page
     */
    goToNextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.getActualLinesData();
    }

    /**
     * to handle girst button click
     * this will take to first page 
     */
    goToFirstPage() {
        this.pageNumber = 1;
        this.getActualLinesData();
    }

    /**
     * to handle last button click
     * this will take to last Page 
     */
    goToLastPage() {
        this.pageNumber = this.totalPages;
        this.getActualLinesData();
    }

    //variable to indicate if first and previous button to be disabled or enabled
    get disableFirst() {
        return this.pageNumber == 1;
    }

    //variable to indicate if last and next button to be disabled or enabled
    get disableLast() {
        return this.pageNumber == this.totalPages;
    }

    //variable to check if display pagination Options or not
    get disablePagination() {
        return this.totalRecords > 0;
    }
}