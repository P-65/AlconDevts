import { LightningElement,api } from 'lwc';
//import NavigationMixin
import { NavigationMixin } from 'lightning/navigation';
//import for custom label
import ATP_PlaceOrderButton_Label from '@salesforce/label/c.ATP_PlaceOrderButton_Label'
import ATP_ResubmitOrderButton_Label from '@salesforce/label/c.ATP_ResubmitOrderButton_Label'
import ATP_TRUNK_Label from '@salesforce/label/c.ATP_TRUNK_Label'
import ATP_LOCAL_Label from '@salesforce/label/c.ATP_LOCAL_Label'
import ATP_SC_Label from '@salesforce/label/c.ATP_SC_Label'
export default class Atp_open_lines_button_panel_component extends NavigationMixin(LightningElement) {
  //variable for partsrequest record id
  @api partsRequestId
  //variable for default source values
  defaultSearchBySourceValues
  //variable for source values
  value = [];
  //variable for enable or disable place order button
  disableButton 
  //variable for search term
  searchTerm;
  //variable for place order button label
  placeOrderButtonLabel
  //variable for acive tab value
  activeTabValue
  //variable for disable place order button
  disablePlaceOrderButton
  //variable for disable Resubmit button
  disableResubmitButton
  //variable for source options
  sourceOptions = [
    { label: ATP_LOCAL_Label, value: ATP_LOCAL_Label },
    { label: ATP_SC_Label, value: ATP_SC_Label },
    { label: ATP_TRUNK_Label, value: ATP_TRUNK_Label },
  ];
  //to get comma separeated source values
  selectedSourceValues() {
    return this.value.join(',');
  }
  /**
    * to update source value on value change
    * to dispatch event to query records based on source values
  */
  handleChange(e) {
    this.value = e.detail.value; 
    this.dispatchEvent(new CustomEvent('searcbysourceopenlinesevent', {
      detail: this.value
    }));
  }
  /**
    * to populate default source values
    * to query records using default source values
  */
  @api addFilterBySourceValues(sourceValues) {
    this.defaultSearchBySourceValues = sourceValues
    this.value = this.defaultSearchBySourceValues
    this.dispatchEvent(new CustomEvent('searcbysourceopenlinesevent', {
      detail: this.value
    }));
  }
  /**
    * to handle search term change
    * to query records using search term
     */
  handleSearchRecords(event) {
    this.searchTerm = event.target.value;
    window.clearTimeout(this.delayTimeOut);
    this.delayTimeOut = setTimeout(async () => {
      this.dispatchEvent(new CustomEvent('searchopenlinesevent', {
        detail: { value: this.searchTerm }
      }));
    }, 500);
  }
  /**
    * to handle refresh button click
    * to query records using default source values,default search term,clear datatable errors
  */
  handleRefresh() {
    this.value = this.defaultSearchBySourceValues;
    this.searchTerm = '';
    this.dispatchEvent(new CustomEvent('refreshevent'));
  }
  /**
    * to handle cancel button click
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
    * to handle place order/resubmit button click
  */
  handlePlaceOrder() {
    if(this.activeTabValue==1){
      this.dispatchEvent(new CustomEvent("placeorderevent"))
    }else if(this.activeTabValue==2){
      this.dispatchEvent(new CustomEvent("resubmitevent"))
    }
  }
  /**
     * to enable/disable place order button
     * this method exposed to parent to disable/enable place order button
    */
  @api disablePlaceOrder(disable) {
    this.disablePlaceOrderButton=disable
    if(this.activeTabValue==1){
      this.disableButton = this.disablePlaceOrderButton 
    }
  }
  /**
     * to enable/disable resubmit button
     * this method exposed to parent to disable resubmit button
    */
  @api disableResubmit(disable) {
    this.disableResubmitButton=disable
    if(this.activeTabValue==2){
      this.disableButton = this.disableResubmitButton 
    }
  }
  /**
     * to change button label on tab change
     * to enable/disable button based on tab
    */
  @api handleTabChange(tabValue){
    this.activeTabValue=tabValue
  if(this.activeTabValue==1){
    this.placeOrderButtonLabel=ATP_PlaceOrderButton_Label
    this.disableButton = this.disablePlaceOrderButton
  }else if(this.activeTabValue==2){
   this.placeOrderButtonLabel=ATP_ResubmitOrderButton_Label
   this.disableButton = this.disableResubmitButton 
  }
  }
}