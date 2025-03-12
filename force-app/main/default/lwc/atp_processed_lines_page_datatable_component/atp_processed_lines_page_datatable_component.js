import { LightningElement, wire, api, track } from 'lwc';
//apex method to get the Columns from Metadata
import getColumns from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getCustomMetadata';
//apex method to get count of parts request lines
import getCountOfPartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getCountOfPartsReqLines';
//apex method to get parts request records
import getPartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getPartsReqLines';
//import for Navigationmixin
import { NavigationMixin } from 'lightning/navigation';
//import to show toast message
import { ShowToastEvent } from "lightning/platformShowToastEvent";
//import for lightning confirm
import LightningConfirm from 'lightning/confirm';
//import to publish Resubmit Platform Event
import publishResubmitPlatformEvent from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.publishResubmitPlatformEvent';
//import for custom labels
import ATP_LineStatusNotOrderFailed_Validation from '@salesforce/label/c.ATP_LineStatusNotOrderFailed_Validation'
import ATP_ResubmitOrderConfirmationMessage from '@salesforce/label/c.ATP_ResubmitOrderConfirmationMessage'
import ATP_OrderFailed_Label from '@salesforce/label/c.ATP_OrderFailed_Label'
import ATP_SelectALine_Message from '@salesforce/label/c.ATP_SelectALine_Message'

export default class Atp_processed_lines_page_datatable_component extends NavigationMixin(LightningElement) {
    //variable for parts request record id
    partsRequestId
    //variable for record type id
    partsReqLineAtpCheckLineRecordTypeId
    //variable for parts request line product ids string
    @api productIdsString
    //variable for records to display
    @track recordsToDisplay = [];
    //variable for data table columns
    columns = [];
    //variable for current sort direction
    sortDirection = 'asc';
    //variable for current sorted by column
    sortedBy = 'Requested Part';
    //variable for storing lookup field definations to be used to convert it to URL.
    lookupFieldsName = [];
    //variable to store default value fields
    defaultValuefields = [];
    //variable to store forward offset atp parts request line Ids
    forwardOffsetPartReqLineIds = [];
    //variable to store backward offset atp parts request line Ids
    backwardOffsetPartReqLineIds = [];
    //variable for fields to be queried
    fieldsToQuery;
    //Variable to store the Selected Fields
    selectedFieldsForSearch = [];
    //variable for Search key entered by User
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
    //variable for selected Source Values
    selectedSourceValues;
    //variable for storing errors to display on datatable
    errors = {};
    //variable for storing row ids with errors 
    errorRowIds = [];
    //variable for page size options
    pageSizeOptions = [
        { label: 1000, value: 1000 },
        { label: 500, value: 500 },
        { label: 100, value: 100 },
        { label: 50, value: 50},
        { label: 25, value:25 },
    ];

    /**
     * to get the Processed Lines Table Columns
     * this will be fired on load
     */
    @wire(getColumns)
    getColumns({ error, data }) {
        if (data) {
            //get all columns which are for context 'Processed Lines Datatable'
            let itemSearchCols = data.filter(col => col.Context__c == 'Processed Lines Datatable'&& !col.Hidden__c);
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

                if (col.Type__c != 'Number'&&col.Type__c != 'Date' && col.Type__c != 'Boolean' &&col.Type__c != 'Text Area' && col.API_Name__c != null) {
                    this.selectedFieldsForSearch = [...this.selectedFieldsForSearch, col.API_Name__c];
                }
            });
            if (this.fieldsToQuery) {
                this.dispatchEvent(new CustomEvent('queryprocessedlinesevent'));
            }
        } else if (error) {

           // console.log(error);
        }
    }
    /**
        * to get atp lines records and its count
        * this method called from parent
        */
    @api handleQueryRecords(recordId,recordTypeId) {
        this.partsRequestId = recordId;
        this.partsReqLineAtpCheckLineRecordTypeId=recordTypeId;
        this.getPartsReqLineCount();
        this.getActualLinesData()
    }

    /**
      * To get atp lines records count
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
              //  console.log(error);
            }
        } else {
         //   console.log('Query is Blank');
        }
    }


    /**
      * To get atp lines records 
      */
    getActualLinesData() {
        let sQuery = this.prepareSOQLQuery(false);
        //console.log('preparesQuery', sQuery)
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
                                let colApiName = lookupField.colApiName;
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

                        this.recordsToDisplay = tempRecs.map(item => {

                            return {
                                ...item,
                                "columnColor": "slds-box slds-theme_shade"
                            }
                        });

                        //sort by sap material no
                        const cloneData = [...this.recordsToDisplay];
                        cloneData.sort(this.sortBy(this.sortedBy, this.sortDirection === 'asc' ? 1 : -1));
                        this.recordsToDisplay = cloneData;
                        this.isLoading = false;
                        this.forwardOffsetPartReqLineIds[this.pageNumber - 1] = tempRecs[tempRecs.length - 1].Id;
                        this.backwardOffsetPartReqLineIds[this.pageNumber - 1] = tempRecs[0].Id;
                    } else {
                        this.recordsToDisplay = [];
                        this.isLoading = false;
                    }
                })
                .catch((error) => {
              //      console.log(error);
                });
        } else {
         //   console.log('No Query is selected');
        }
    }


    /**
      * to prepare the SOQL Query based on user selected filters
      */
    prepareSOQLQuery(isCountQuery) {
        //variable to store complete query
        let sQuery;
        //variable to store the Select Clause
        let selectClause = 'SELECT Id, ';
        //variable to store the From Clause
        let fromClause = 'From SVMXC__Parts_Request_Line__c WHERE ';
        //variable to store the Where Clause
        let whereClause = `SVMXC__Parts_Request__c = '${this.partsRequestId}' AND RecordTypeId='${this.partsReqLineAtpCheckLineRecordTypeId}' AND SVMXC__Line_Status__c!='Open'  `;
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

        //now create the Where clause from Search Key
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
                //add other fields 
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
      * to handle row selection
      */
    handleRowSelection(event){
        const selectedRows = event.detail.selectedRows;
        let selectedRowIds = selectedRows.map(row => row.Id);
        let matchingIds = selectedRowIds.filter(id => this.errorRowIds.includes(id));
        this.dispatchEvent(new CustomEvent('disableresumbitevent', {
            detail: { disable: matchingIds.length > 0? true : false }
        })); 
    }

    /**
      * to resubmit selected processed lines
      */
    @api async handleResubmit(){
        let selectedRecords = this.template.querySelector('lightning-datatable').getSelectedRows();
        if (selectedRecords.length > 0) {
                let hasErrors = false;
                let rowErrors = {};
                selectedRecords.forEach(row => {
                    let messages = [];
                    let fieldNames = [];
                        if (row.SVMXC__Line_Status__c != ATP_OrderFailed_Label){
                            messages.push(`${ATP_LineStatusNotOrderFailed_Validation}`);
                            fieldNames.push('SVMXC__Line_Status__c');
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
                            title: 'Error while resubmitting order. Fix the errors and try again.',
                            messages: Object.values(rowErrors).flatMap(error => error.messages)
                        }
                    };
                } else {
                    const result = await LightningConfirm.open({
                        message: `${ATP_ResubmitOrderConfirmationMessage}`,
                        //  variant: 'headerless',
                        theme: 'warning',
                        label: 'warning',
                    });
                    if (result) {
                        this.errors = null;
                        this.errorRowIds=[]
                        const selectedRecordsIds = selectedRecords.map(record => record.Id).join(',');
                        publishResubmitPlatformEvent({ partsReqId: this.partsRequestId, partsReqLineIds: selectedRecordsIds })
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
                                // this.dispatchEvent(
                                //     new ShowToastEvent({
                                //         title: "Error While Updating Parts Req Line Record(s)",
                                //         message: error.body.message,
                                //         variant: "error",
                                //         mode: 'sticky'
                                //     }),
                                // );
                            }) 
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
      * to filter atp lines record using search key
      * this method called from parent
      */
    @api handleSearchRecords(searchKey) {
        this.searchKey = searchKey;
        this.getPartsReqLineCount();
        this.getActualLinesData();
    }

    /**
      * to refresh open atp line records
      */
    @api handleRefresh() {
        this.searchKey = '';
        this.selectedSourceValues ='';
        this.getPartsReqLineCount();
        this.getActualLinesData();
        this.errors = null;
        this.errorRowIds=[]
        this.dispatchEvent(new CustomEvent('disableresumbitevent', {
            detail: { disable:  false }
        })); 
    }

    /**
      * to filter atp lines record using source values
      * this method called from parent
      */
    @api handleSearchBySourceProcessedLines(selectedValues) {
        this.selectedSourceValues = selectedValues;
        this.getPartsReqLineCount();
        this.getActualLinesData();
    }


    /**
     * to sort column clicked by user
     * depending on the column selected and sorting direction, data will be sorted
     */
    onHandleSort(event) {
        console.log('sortevent')
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
      * to handle change in combo box of Record Per Page
      * this will get the Asset data as per new Page Size
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
     * to handle previous button is click
     * this will take to previous page
     */
    goToPreviousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.getActualLinesData();
    }

    /**
     * to handle next button click
     * this will take to next page
     */
    goToNextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.getActualLinesData();
    }

    /**
     * to handle first button is click
     * this will take to first page
     */
    goToFirstPage() {
        this.pageNumber = 1;
        this.getActualLinesData();
    }

    /**
     * to handle last Button click
     * This will take to last page of pagination
     */
    goToLastPage() {
        this.pageNumber = this.totalPages;
        this.getActualLinesData();
    }

    //Variable to indicate if first and previous button to be disabled or enabled
    get disableFirst() {
        return this.pageNumber == 1;
    }

    //Variable to indicate if last and next button to be disabled or enabled
    get disableLast() {
        return this.pageNumber == this.totalPages;
    }

    //Variable to check if display pagination options or not
    get disablePagination() {
        return this.totalRecords > 0;
    }

}