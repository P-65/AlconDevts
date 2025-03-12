import { LightningElement, wire, api, track } from 'lwc';
//apex method to get columns from metadata
import getColumns from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getCustomMetadata';
//apex method to get count of parts request lines
import getCountOfPartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getCountOfPartsReqLines';
//apex method to get parts request lines
import getPartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getPartsReqLines';
//apex method to get get products data
import getPartsData from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.getPartsData';
//apex method to create parts request lines
import createPartsReqLines from '@salesforce/apex/Alcon_Parts_Request_AvailCheckController.createPartsReqLines';
//import to update,getfiedlvalue of parts request record
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
//import to show toast event
import { ShowToastEvent } from "lightning/platformShowToastEvent";
//import naviagetion
import { NavigationMixin } from 'lightning/navigation';
//import for parts request fields
import SALES_ORG_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Sales_Org__c';
import OWNER_PLANT_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Owner_Plant_AC__c';
import WORK_ORDER_FIELD from '@salesforce/schema/SVMXC__Parts_Request__c.Work_Order_AC__c';
//parts request fields
const FIELDS = [ SALES_ORG_FIELD,OWNER_PLANT_FIELD,WORK_ORDER_FIELD];

export default class Atp_add_part_datatable_component extends NavigationMixin(LightningElement) {
    //variable for the parts request record id
    @api partsRequestId
    //variable for record type id
    @api partsReqLineProdLineRecordTypeId
    //variable for records to display in datatable
    @track recordsToDisplay = [];
    //variable for datatable columns
    columns = [];
    //current sort direction
    sortDirection = 'asc';
    //current sorted by column
    sortedBy = 'Name';
    //variable for storing lookup field definations to be used to convert it to URL.
    lookupFieldsName = [];
    //variable to store default value fields
    defaultValuefields = [];
    //array to store forward offset Product Ids
    forwardOffsetPartReqLineIds = [];
    //array to store backward offset Product Ids
    backwardOffsetPartReqLineIds = [];
    //fields to be queried for Product
    fieldsToQuery;
    //variable to store the Selected Fields
    selectedFieldsForSearch = [];
    //search key entered by User
    searchKey;
    //search by family key entered by user
    searchByFamKey;
    //total no of Records
    totalRecords = 0;
    //no.of records to be displayed per page
    pageSize;
    //total no.of pages
    totalPages = 0;
    //page number    
    pageNumber = 1;
    //count of records on the last page
    lastPageCount;
    //variable for spinner
    isLoading = false;
    //for current user sales org value
    currentUserSalesOrg
    //variable for current user plant value
    currentUserPlant
    //variable for work order value
    workOrder
    //variable for Number of Parts Request Line Records
    partsReqLineCount
    //variable for existing parts reqline products
    commaSeparatedProdIds
    //variable for page size options
    pageSizeOptions = [
        { label: 1000, value: 1000 },
        { label: 500, value: 500 },
        { label: 100, value: 100 },
        { label: 50, value: 50},
        { label: 25, value:25 },
    ];

    /**
     * to get the users sales org,plant,wo
     * This will be fired on load
     */
    @wire(getRecord, { recordId: '$partsRequestId', fields: FIELDS })
    currentUserInfo({ error, data }) {
        if (data) {
            this.currentUserSalesOrg = getFieldValue(data, SALES_ORG_FIELD);
            this.currentUserPlant= getFieldValue(data, OWNER_PLANT_FIELD);
            this.workOrder=getFieldValue(data, WORK_ORDER_FIELD);
            this.getColumns();
        } else if (error) {
            this.error = error;
        }
    }

    /**
     * to get the columns from metadata
     */
    getColumns() {
        getColumns({
        })
            .then((data) => {
                //get all columns which are for context "Add Product Screen"
                let itemSearchCols = data.filter(col => col.Context__c == 'Add Product Screen' && !col.Hidden__c);
                //get default page size for datatable
                let pageSizeData=data.filter(col => col.Context__c == 'Datatable Page Size');
                if(pageSizeData){
                this.pageSize = pageSizeData[0].Default_Datatable_Page_Size__c
                }
                //sort all columns by order field
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
                            pictureUrl: { fieldName: col.API_Name__c },
                        }
                        colItem.cellAttributes = {
                            alignment: "center"
                        }
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
                    //Add the column for querying data
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

                    if (col.Type__c != 'Image'&& col.Type__c != 'Number'&&col.Type__c != 'Date' && col.Type__c != 'Boolean' &&col.Type__c != 'Text Area' && col.API_Name__c != null) {
                        this.selectedFieldsForSearch = [...this.selectedFieldsForSearch, col.API_Name__c];
                    }
                });
                getCountOfPartsReqLines({ sCountQuery: `SELECT count() FROM SVMXC__Parts_Request_Line__c WHERE RecordTypeId='${this.partsReqLineProdLineRecordTypeId}' AND SVMXC__Parts_Request__c = '${this.partsRequestId}'` })
                    .then((data) => {
                        this.partsReqLineCount = data
                    }).catch((error) => {
                      //  console.log(error); 
                    });
                 getPartsReqLines({ sQuery: `SELECT SVMXC__Product__c FROM SVMXC__Parts_Request_Line__c WHERE RecordTypeId='${this.partsReqLineProdLineRecordTypeId}' AND SVMXC__Parts_Request__c = '${this.partsRequestId}'` })
                 .then((data) => {
                 let products=data
                 if(products.length > 0){
                 this.commaSeparatedProdIds = products.map(product => `'${product.SVMXC__Product__c}'`).join(',');
                 }
                 this.getPartsCount();
                 this.getPartsData();
                 }).catch((error) => {
                 //  console.log(error);
                 });
                     
            }).catch((error) => {
               // console.log(error);
            });
    }

    /**
     * to get count of product records
     */
    async getPartsCount() {
        let sQuery = this.prepareSOQLQuery(true);
        if (sQuery) {
            try {
                this.totalRecords = await getCountOfPartsReqLines({ sCountQuery: sQuery });
                this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
                this.pageNumber = 1;
                this.lastPageCount = (this.totalRecords % this.pageSize) === 0 ? this.pageSize : this.totalRecords % this.pageSize;
            }
            catch (error) {
              //  console.log(error);
            }
        } else {
           // console.log('Query is Blank');
        }
    }

    /**
    * to fetch Product Records
    */
    getPartsData() {         
        let sQuery = this.prepareSOQLQuery(false);
        //console.log('preparesQuery', sQuery)
        if (sQuery) {
            this.isLoading = true;
            getPartsData({
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
                                    tempRec[colName] = JSON.stringify(tempRec[relativeName][relativeFieldName]).replaceAll('"', '');;
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
                        })
                        this.isLoading = false;
                        this.forwardOffsetPartReqLineIds[this.pageNumber - 1] = tempRecs[tempRecs.length - 1].Id;
                        this.backwardOffsetPartReqLineIds[this.pageNumber - 1] = tempRecs[0].Id;
                    } else {
                        this.isLoading = false;
                        this.recordsToDisplay = [];
                    }
                })
                .catch((error) => {
                 //   console.log(error);
                });
        } else {
          //  console.log('No Query is selected');
        }

   
    }


    /**
    * to prepare SOQL Query based on user selected filters
    */
    prepareSOQLQuery(isCountQuery) {
        //variable to store complete query
        let sQuery;
        //variable to store the Select Clause
        let selectClause = 'SELECT Id,Name, ';
        //variable to store the From Clause
        let fromClause = 'From Product2 WHERE ';
        //variable to store the Where Clause
        let whereClause
        //variable to store the Limit Clause
        let limitClause = '';
        //variable to store the Order clause
        let orderClause = '';
        if( this.commaSeparatedProdIds){
            whereClause=`((C_SubFranchise__c in(null,'TSV','ACC','OTH','SGS','CNS') and Family not in('Instrument','Service Product','Test Equipment','Accessory')) OR (C_SubFranchise__c in(null,'TSV','ACC','OTH','SGS','CNS') and Family = 'Accessory' and Orderable_AC__c != null and (NOT(Orderable_AC__c like '%Not Orderable%'))))  AND Id NOT IN (${this.commaSeparatedProdIds}) AND Id IN(SELECT Product__c From SAP_Material_Extension__c WHERE Name ='${this.currentUserSalesOrg}'AND Type__c ='Sales Org' AND Orderable__c=true) AND Id IN(SELECT Product__c From SAP_Material_Extension__c WHERE Name ='${this.currentUserPlant}'AND Type__c ='Plant' AND Orderable__c=true)`;
        }else{
            whereClause=`((C_SubFranchise__c in(null,'TSV','ACC','OTH','SGS','CNS') and Family not in('Instrument','Service Product','Test Equipment','Accessory')) OR (C_SubFranchise__c in(null,'TSV','ACC','OTH','SGS','CNS') and Family = 'Accessory' and Orderable_AC__c != null and (NOT(Orderable_AC__c like '%Not Orderable%'))))  AND Id IN(SELECT Product__c From SAP_Material_Extension__c WHERE Name ='${this.currentUserSalesOrg}'AND Type__c ='Sales Org' AND Orderable__c=true) AND Id IN(SELECT Product__c From SAP_Material_Extension__c WHERE Name ='${this.currentUserPlant}'AND Type__c ='Plant' AND Orderable__c=true)`;
        }

        //create the Select Clause
        if (isCountQuery) {
            selectClause = `SELECT count() FROM Product2 WHERE `;
        } else {
            if (this.fieldsToQuery) {
                selectClause = selectClause + this.fieldsToQuery.slice(0, -1) + ' ' + fromClause + '';

            } else {
                selectClause = selectClause + fromClause;
            }
        }

        //to create the where clause from Search Key
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
                    }
                );
                }
            });
            searchKeyWhereClause += ')';
            whereClause = whereClause + searchKeyWhereClause;
        }

        if (this.searchByFamKey && this.searchByFamKey.length > 0) {
            const hasNone = this.searchByFamKey.includes('None');
            const filteredKeys = this.searchByFamKey.filter(family => family !== 'None');
            let likeClauses = '';
            if (filteredKeys.length > 0) {
                likeClauses = filteredKeys.map(family => `Family LIKE '%${family}%'`).join(' OR ');
            }
            let nullClause = '';
            if (hasNone) {
                nullClause = 'Family = NULL';
            }
            let combinedClause = '';
            if (likeClauses && nullClause) {
                combinedClause = `(${likeClauses} OR ${nullClause})`;
            } else if (likeClauses) {
                combinedClause = `(${likeClauses})`;
            } else if (nullClause) {
                combinedClause = `(${nullClause})`;
            }
            whereClause = `${whereClause} AND ${combinedClause}`;
        }
        if (!isCountQuery && this.pageNumber > 1 && this.pageNumber < this.totalPages) {
            if (this.forwardOffsetPartReqLineIds[this.pageNumber - 2])
                whereClause = '' + whereClause + ' AND ID > \'' + this.forwardOffsetPartReqLineIds[this.pageNumber - 2] + '\'';
            else
                whereClause = '' + whereClause + ' AND ID < \'' + this.backwardOffsetPartReqLineIds[this.pageNumber] + '\'';
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
        this.dispatchEvent(new CustomEvent('disableaddproductevent', {
            detail: { disable: selectedRows.length > 0? false : true }
        })); 
    }


    /**
    * to add selected prodcts to the parts request
    */
    @api handleAddSelRecords() {
        let selectedRecords = this.template.querySelector('c-atp_custom_datatable_datatype').getSelectedRows();
        let remaining = 20 - this.partsReqLineCount
        if (selectedRecords.length > 0) {
            if (selectedRecords.length <= remaining && remaining >= 0) {
                let ids = '';
                selectedRecords.forEach(currentItem => {
                    ids = ids + ',' + currentItem.Id;
                });
                this.selectedIds = ids.replace(/^,/, '');
                this.lstSelectedRecords = selectedRecords;
                createPartsReqLines({ prodIds: this.selectedIds, partsReqId: this.partsRequestId })
                    .then(() => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: "Success",
                                message: "Added Product(s) Successfully",
                                variant: "success",
                            }),
                        );
                        this.dispatchEvent(new CustomEvent('addedproductsevent'));
                        this.dispatchEvent(new CustomEvent('closemodalevent'));
                    })
                    .catch(error => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: "Add Products Failed",
                                message: error.body.message,
                                variant: "error",
                            }),
                        );
                    })
            } else if (selectedRecords.length > remaining && remaining > 0) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: `You Can Add Only ${remaining} More Product(s)`,
                        //message: error.body.message,
                        variant: "error",
                    }),
                );
            } else if (remaining <= 0) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: `You Can have Maximum 20 Parts Request Lines`,
                        //message: error.body.message,
                        variant: "error",
                    }),
                );
            }
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Select atleast one Product",
                    //message: error.body.message,
                    // variant: "error",

                }),
            );
        }
    }

    /**
    * to filter the prodct records based on search key
    * this method is called from parent
    */
    @api handleSearchRecords(searchKey) {
        this.searchKey = searchKey;
        this.getPartsCount();
        this.getPartsData();
    }

    /**
        * to filter the prodct records based on product family values
        * this method is called from parent
        */
    @api handleSearchRecByFam(searchKey) {
        this.searchByFamKey = searchKey;
        this.getPartsCount();
        this.getPartsData();
    }

    /**
     * to sort data when the column sorting is clicked by user
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
        * this will get the products data as per new page size
        */
    handleRecordsPerPage(event) {
        this.pageSize = Number(event.target.value);
        this.pageNumber = 1;
        this.totalPages = Math.ceil(this.totalRecords / event.target.value);
        this.lastPageCount = (this.totalRecords % this.pageSize) === 0 ? this.pageSize : this.totalRecords % this.pageSize;
        this.getPartsData();
    }

    /**
     * to handle previous button is click
     * this will take to previous set of records
     */
    goToPreviousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.getPartsData();
    }

    /**
     * to handle Next Button click
     * this will take to next set of records
     */
    goToNextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.getPartsData();
    }

    /**
     * to handle first button click
     * this will take to first page 
     */
    goToFirstPage() {
        this.pageNumber = 1;
        this.getPartsData();
    }

    /**
     * to handle last button click
     * this will take to last Page 
     */
    goToLastPage() {
        this.pageNumber = this.totalPages;
        this.getPartsData();
    }

    //variable to indicate if first and previous button to be disabled or enabled
    get disableFirst() {
        return this.pageNumber == 1;
    }

    //variable to indicate if last and next button to be disabled or enabled
    get disableLast() {
        return this.pageNumber == this.totalPages;
    }

    //variable to check if display pagination options or not
    get disablePagination() {
        return this.totalRecords > 0;
    }
}