import { LightningElement, wire, api, track } from 'lwc';
//apex method to get the columns from metadata 
import getColumns from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getCustomMetadata';
//apex method to get count of parts request lines 
import getCountOfPartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getCountOfPartsReqLines';
//apex method to get parts request Lines 
import getPartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getPartsReqLines';
//apex method to delete parts request line record 
import deletePartsRequestLineRec from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.deletePartsReqLines';
//apex method to update parts request line record
import updatePartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.updatePartsReqLines';
//apex method to publist Platform Event 
import publishPlatformEvent from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.publishPlatformEvent';
//import for show toast event
import { ShowToastEvent } from "lightning/platformShowToastEvent";
//import lightning confirm
import LightningConfirm from 'lightning/confirm';
//import for custom labels
import ATP_QtyRequiredNull_Validation from '@salesforce/label/c.ATP_QtyRequiredNull_Validation'
import ATP_DeleteConfirmation_Message from '@salesforce/label/c.ATP_DeleteConfirmation_Message'
import ATP_DeletedLines_Message from '@salesforce/label/c.ATP_DeletedLines_Message'
import ATP_DeleteLinesFailed_Message from '@salesforce/label/c.ATP_DeleteLinesFailed_Message'
import ATP_AddProdLimit_Message from '@salesforce/label/c.ATP_AddProdLimit_Message'
import ATP_SelectProduct_Message from '@salesforce/label/c.ATP_SelectProduct_Message'
import ATP_PartsReqLineUpdated_Message from '@salesforce/label/c.ATP_PartsReqLineUpdated_Message'
import ATP_PartsReqLineUpdateError_Message from '@salesforce/label/c.ATP_PartsReqLineUpdateError_Message'

export default class Atp_parts_request_line_datatable_component extends LightningElement {
    //variable to store parts request record id
    partsRequestId
    //variable for record type id
    partsReqLineProdLineRecordTypeId
    //variable for records to display
    @track recordsToDisplay = [];
    //variable for datatable columns
    columns = [];
    //variable current sort direction
    sortDirection = 'asc';
    //variable for current sorted by column
    sortedBy = 'Product';
    //Variable for storing lookup field definations to be used to convert it to URL.
    lookupFieldsName = [];
    //variable to store default value fields
    defaultValuefields = [];
    //variable to store forward offset parts request line Ids
    forwardOffsetPartReqLineIds = [];
    //variable to store backward offset parts request line Ids
    backwardOffsetPartReqLineIds = [];
    //variable fields to be queried for parts request line
    fieldsToQuery;
    //variable to store the Selected Fields
    selectedFieldsForSearch = [];
    //variable for search key entered by User
    searchKey;
    //variable for total no of Records
    totalRecords = 0;
    //variable for no.of records to be displayed per page
    pageSize;
    //variable for total no.of pages
    totalPages = 0;
    //variable for page number    
    pageNumber = 1;
    //variable for count of records on the last page
    lastPageCount;
    //variable for spinner
    isLoading = false;
    //variable for selected records from datatable
    selectedIds
    //variable for displaying errors in datatable
    errors = {};
    //variable for page size options
    pageSizeOptions = [
        { label: 1000, value: 1000 },
        { label: 500, value: 500 },
        { label: 100, value: 100 },
        { label: 50, value: 50},
        { label: 25, value:25 },
    ];

    /**
     * to get the parts request line data table columns
     * this will be fired on load
     */
    @wire(getColumns)
    getColumns({ error, data }) {
        if (data) {
            //get all columns which are for context 'Start Screen'
            let itemSearchCols = data.filter(col => (col.Context__c == 'Start Screen' && !col.Hidden__c));
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

                if (col.Type__c === "Image") {
                    colItem.type = "customImage"
                    colItem.typeAttributes = {
                        pictureUrl: { fieldName: col.MasterLabel },
                    }
                    colItem.cellAttributes = {
                        alignment: "center"
                    }

                    let relativeName = col.API_Name__c.substring(0, col.API_Name__c.indexOf('_r')) + '_r';
                    let relativeFieldName = col.API_Name__c.substring((col.API_Name__c.indexOf('_r') + 3), col.API_Name__c.length);
                    let relativeFieldActualName = col.API_Name__c.substring(0, col.API_Name__c.indexOf('_r')) + '_c';
                    let colName = col.MasterLabel;
                    let lookupDefination = {
                        "relativeName": relativeName,
                        "relativeFieldName": relativeFieldName,
                        "relativeFieldActualName": relativeFieldActualName,
                        "colName": colName,
                        "type": 'Image'
                    }
                    this.lookupFieldsName.push(lookupDefination);
                }
                if (col.Type__c == "Picklist") {
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
                    let lookupDefination = {
                        "relativeName": relativeName,
                        "relativeFieldName": relativeFieldName,
                        "relativeFieldActualName": relativeFieldActualName,
                        "colName": colName
                    };
                    this.lookupFieldsName.push(lookupDefination);
                }

                if (col.Type__c != 'Image'&& col.Type__c != 'Number'&&col.Type__c != 'Date' && col.Type__c != 'Boolean' && col.Type__c != 'Text Area' && col.API_Name__c != null) {
                    this.selectedFieldsForSearch = [...this.selectedFieldsForSearch, col.API_Name__c];
                }
            });
            this.columns = [...this.columns, {
                label: '', fieldName: 'dummy', type: 'text', fixedWidth: 20, hideDefaultActions: true, cellAttributes: {
                    class: { fieldName: 'columnColor' }
                }
            }];
            if (this.fieldsToQuery) {
                this.dispatchEvent(new CustomEvent('queryrecords'));
            }
        } else if (error) {

         //   console.log(error);
        }
    }

    /**
         * to get the parts request line records count and parts request line data on load called from parent
         * this will be fired on load
         */
    @api handleQueryRecords(recordId,recordTypeId) {
        this.partsRequestId = recordId;
        this.partsReqLineProdLineRecordTypeId=recordTypeId
        this.getPartsReqLineCount();
        this.getPartsReqLineData();

        getCountOfPartsReqLines({ sCountQuery: `SELECT count() FROM SVMXC__Parts_Request_Line__c WHERE RecordTypeId='${this.partsReqLineProdLineRecordTypeId}' AND SVMXC__Parts_Request__c = '${this.partsRequestId}'` })
            .then((data) => {
                this.dispatchEvent(new CustomEvent('disableaddproductsevent', {
                    detail: { disable: data >= 20 ? true : false }
                }));
                this.dispatchEvent(new CustomEvent('disableatpcheckevent', {
                    detail: { disable: data == 0 ? true : false }
                }));
              //  console.log('partsReqLineCount', data);
            }).catch((error) => {
              //  console.log(error);
            });
    }
    
    /**
         * to get the parts request line records count 
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
             //   console.log(error);
            }
        } else {
           // console.log('Query is Blank');
        }
    }

    /**
      * to get the parts request line records 
      * */
    getPartsReqLineData() {
        let sQuery = this.prepareSOQLQuery(false);
        //console.log('preparesQuery',sQuery)
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

                                if (tempRec[relativeFieldActualName] != null && lookupField.type == null) {
                                    tempRec[colName] = JSON.stringify(tempRec[relativeName][relativeFieldName]).replaceAll('"', '');
                                    tempRec[relativeFieldActualName] = '/' + tempRec[relativeName].Id;
                                } else if (tempRec[relativeName][relativeFieldName] != null && lookupField.type == 'Image') {
                                    tempRec[colName] = tempRec[relativeName][relativeFieldName];
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
                        this.isLoading = false;

                        this.recordsToDisplay = tempRecs.map(item => {
                            return {
                                ...item,
                                "columnColor": "slds-box slds-theme_shade"
                            }
                        })
                        //sort by product
                        const cloneData = [...this.recordsToDisplay];
                        cloneData.sort(this.sortBy(this.sortedBy, this.sortDirection === 'asc' ? 1 : -1));
                        this.recordsToDisplay = cloneData;
                        //console.log('record to display',JSON.stringify(this.recordsToDisplay));
                        this.forwardOffsetPartReqLineIds[this.pageNumber - 1] = tempRecs[tempRecs.length - 1].Id;
                        this.backwardOffsetPartReqLineIds[this.pageNumber - 1] = tempRecs[0].Id;
                    } else {
                        this.isLoading = false;
                        this.recordsToDisplay = [];
                    }
                })
                .catch((error) => {
                  //  console.log(error);
                });
        } else {
          //  console.log('No Query is selected');
        }
    }

    /**
    * This method prepares the SOQL Query based on user selected filters
    */
    prepareSOQLQuery(isCountQuery) {
        //variable to store complete query
        let sQuery;
        //variable to store the Select Clause
        let selectClause = 'SELECT Id,Name, ';
        //variable to store the From Clause
        let fromClause = 'From SVMXC__Parts_Request_Line__c WHERE ';
        //variable to store the Where Clause
        let whereClause = `SVMXC__Parts_Request__c = '${this.partsRequestId}' AND RecordTypeId='${this.partsReqLineProdLineRecordTypeId}' `;
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
      * to update the parts request line record with quantity required entered in cell
      * also to throw validation on the quantity required cell
      * */
    handleOnCellChange(event) {
        let draftValues = event.detail.draftValues
        let hasErrors = false;
        let rowErrors = {};
        draftValues.forEach(row => {
            let messages = [];
            let fieldNames = [];

            if (!row.SVMXC__Quantity_Required2__c || isNaN(row.SVMXC__Quantity_Required2__c) || parseFloat(row.SVMXC__Quantity_Required2__c) < 1) {
                messages.push(`${ATP_QtyRequiredNull_Validation}`);
                fieldNames.push('SVMXC__Quantity_Required2__c');
            }

            if (messages.length > 0) {
                hasErrors = true;
                rowErrors[row.Id] = {
                    title: `We found ${messages.length} errors.`,
                    messages: messages,
                    fieldNames: fieldNames
                };
            }
        });

        if (hasErrors) {
            this.errors = {
                rows: rowErrors,
                table: {
                    title: 'Error while updating parts request line. Fix the errors and try again.',
                    messages: Object.values(rowErrors).flatMap(error => error.messages)
                }
            };

        } else {
            this.errors = null;
            updatePartsReqLines({ recordsToUpdate: event.detail.draftValues })
                .then(() => {
                    this.dispatchEvent(new CustomEvent('queryrecords'));
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "Success",
                            message: ATP_PartsReqLineUpdated_Message,
                            variant: "success",
                        }),
                    );
                    window.clearTimeout(this.delayTimeOut);
                    this.delayTimeOut = setTimeout(async () => {
                        this.template.querySelector('c-atp_custom_datatable_datatype').draftValues = [];
                    }, 500);
                })
                .catch(error => {
                  //  console.log('Error updating records:', error)
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
      * to delete the selected parts request line records
      * */
    @api async handleDelSelRecords() {
        let selectedRecords = this.template.querySelector('c-atp_custom_datatable_datatype').getSelectedRows();
        if (selectedRecords.length > 0 && selectedRecords.length <= 200) {
            const result = await LightningConfirm.open({
                message:`${ATP_DeleteConfirmation_Message}`,
                theme: 'warning',
                label: 'warning',
            });
            if (result) {
                let ids = '';
                selectedRecords.forEach(currentItem => {
                    ids = ids + ',' + currentItem.Id;
                });
                this.selectedIds = ids.replace(/^,/, '');
                this.lstSelectedRecords = selectedRecords;

                deletePartsRequestLineRec({ partsReqLineIds: this.selectedIds })
                    .then(() => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: "Success",
                                message: `${ATP_DeletedLines_Message}`,
                                variant: "success",
                            }),
                        );
                        this.dispatchEvent(new CustomEvent('queryrecords'));
                    })
                    .catch(error => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: ATP_DeleteLinesFailed_Message,
                                message: error.body.message,
                                variant: "error",
                            }),
                        );
                    })
            }
        } else if (selectedRecords.length > 200) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: ATP_AddProdLimit_Message,
                    variant: "error",
                }),
            );
        } else {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: ATP_SelectProduct_Message,
                }),
            );
        }
    }

    /**
        * to get product Ids String from the selected parts request lines
        * this method is called from parent
        */
    @api getSelectedPartsReqLines() {
        this.publishATPPlatformEvent()
        let selectedRecords = this.template.querySelector('c-atp_custom_datatable_datatype').getSelectedRows();
            const productIdsString = this.recordsToDisplay.map(item => {
                const productId = item.SVMXC__Product__c.replace(/^\//, '');
                return `'${productId}'`;
            }).join(', ');
            return productIdsString;
    }

    /**
      * Tto publishe the atp check platform event
      */
    publishATPPlatformEvent() {

        publishPlatformEvent({ partsReqId: this.partsRequestId })
            .then(() => {
                // console.log('platform event published successfully');
            })
            .catch(error => {
                // console.log('Error publishing platform event', error)
            })
    }

    /**
      * to get parts request line records based on serach term
      */
    @api handleSearchRecords(searchKey) {
        this.searchKey = searchKey;
        this.getPartsReqLineCount();
        this.getPartsReqLineData();
    }

    /**
     * to sort column clicked by user
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
     * to sort the  column 
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
        * to handle the change in combo box of record per page
        * this will get the parts request line data as per new page size
        */
    handleRecordsPerPage(event) {
        this.pageSize = Number(event.target.value);
        this.pageNumber = 1;
        this.totalPages = Math.ceil(this.totalRecords / event.target.value);
        this.lastPageCount = (this.totalRecords % this.pageSize) === 0 ? this.pageSize : this.totalRecords % this.pageSize;
        this.getPartsReqLineData();
    }

    /**
     * to hadle previous button click
     * this will take to previous page
     */
    goToPreviousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.getPartsReqLineData();
    }

    /**
     * to handle next button click
     * this will take next page
     */
    goToNextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.getPartsReqLineData();
    }

    /**
     * to handle first button click
     * this will take to first page
     */
    goToFirstPage() {
        this.pageNumber = 1;
        this.getPartsReqLineData();
    }

    /**
     * to handle last button click
     * this will take to last Page
     */
    goToLastPage() {
        this.pageNumber = this.totalPages;
        this.getPartsReqLineData();
    }

    //variable to indicate if First and Previous button to be disabled or enabled
    get disableFirst() {
        return this.pageNumber == 1;
    }
    //variable to indicate if Last and Next button to be disabled or enabled
    get disableLast() {
        return this.pageNumber == this.totalPages;
    }

    //variable to check if Display Pagination Options or not
    get disablePagination() {
        return false
    }
}