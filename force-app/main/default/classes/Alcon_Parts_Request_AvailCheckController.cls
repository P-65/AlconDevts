/* ===========================================================================================
@test class:Alcon_Parts_Request_AvailCheckContr_Test
DATE                    DEVELOPER                   COMMENTS

5-Jun-2024              Rithesh                     P20S-927,P20S-933,P20S-993,P20S-1055,P20S-1061
                                                    P20S-981,P20S-939,P20S-957,P20S-1079,P20S-1073
                                                    P20S-1012,P20S-945,P20S-884
25-Nov-2024             Rithesh                     P20S-1193                                                    
============================================================================================ */

public class Alcon_Parts_Request_AvailCheckController {
    //P20S-927,P20S-933,P20S-939,P20S-945 - to fetch columns for datatable from Prophet Availablility Check Controls Metadata
    @AuraEnabled(cacheable = true)
    public static List < Availability_Check_Controls__mdt > getCustomMetadata() {
        try {
            return [SELECT Order__c,
                           MasterLabel,
                           Object_API_Name__c,
                           API_Name__c,
                           Type__c,
                           Relationship_Name_c__c,
                           Lookup_Object_API_Name__c,
                           Context__c,
                           Fixed_Width__c,
                           Is_Editable__c,
                           Is_Sortable__c,
                           Default_Value__c,
                           Hidden__c,
                           Perform_Availability_Check_Delay__c,
                           Default_Datatable_Page_Size__c
                    FROM Availability_Check_Controls__mdt
                    ORDER BY Order__c
                    LIMIT 200
                   ];
        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException(e.getMessage());
        }

    }

    //P20S-927,P20S-939,P20S-945 -to fetch count of parts request line records
    @AuraEnabled
    public static Integer getCountOfPartsReqLines(String sCountQuery) {
        try {
            Integer recordCount = Database.countQuery(sCountQuery);
            return recordCount;
        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException(e.getMessage());
        }
    }

    //P20S-927,P20S-939,P20S-945 -to fetch parts request line records
    @AuraEnabled
    public static List < SVMXC__Parts_Request_Line__c > getPartsReqLines(String sQuery) {
        try {
            return Database.query(sQuery);
        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException(e.getMessage());
        }
    }

    //P20S-927 - to delete parts request lines
    @AuraEnabled
    public static void deletePartsReqLines(String partsReqLineIds) {
        List < SVMXC__Parts_Request_Line__c > partsReqLineRecToDelete=new List < SVMXC__Parts_Request_Line__c >();
        try {
            List < String > partsReqLineIdList = partsReqLineIds.split(',');
            for (String idString: partsReqLineIdList) {
                SVMXC__Parts_Request_Line__c partsReqLine=new SVMXC__Parts_Request_Line__c();
                partsReqLine.Id=Id.valueOf(idString.trim());
                partsReqLineRecToDelete.add(partsReqLine);
            }

            if (partsReqLineRecToDelete?.size() > 0) {
                Delete partsReqLineRecToDelete;
            }
        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException('Error while deleting parts request line records' + e.getMessage());
        }
    }

    //P20S-933 - to fetch the product records
    @AuraEnabled
    public static List < Product2 > getPartsData(String sQuery) {
        List<Product2> partRecords=new List<Product2>();
        try {
            for(Product2 prod:Database.query(sQuery)){
                partRecords.add(prod);
            }
            return partRecords;
        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException(e.getMessage());
        }
    }

    //P20S-933,P20S-1061 -to create parts request line(s) on add part
    @AuraEnabled
    public static void createPartsReqLines(String prodIds, String partsReqId) {
        List < SVMXC__Parts_Request_Line__c > PartsReqLineToInsert = new List < SVMXC__Parts_Request_Line__c > ();

        try {
            List < String > prodIdStringList = prodIds.split(',');
            Id prodLineRecTypId = Schema.SObjectType.SVMXC__Parts_Request_Line__c.getRecordTypeInfosByDeveloperName().get('Product_Line').getRecordTypeId();
            for (String idString: prodIdStringList) {
                SVMXC__Parts_Request_Line__c partsReqLine = new SVMXC__Parts_Request_Line__c(RecordTypeId = prodLineRecTypId, 
                                                                                             Requested_Part__c = Id.valueOf(idString.trim()),
                                                                                             SVMXC__Product__c = Id.valueOf(idString.trim()), 
                                                                                             SVMXC__Parts_Request__c = partsReqId, 
                                                                                             SVMXC__Quantity_Required2__c = 1);
                PartsReqLineToInsert.add(partsReqLine);
            }
          
            if (PartsReqLineToInsert?.size() > 0) {
                Insert PartsReqLineToInsert;
            }

        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException('Error while creating parts request line records' + e.getMessage());
        }
    }

    //P20S-993 - method to retrive all the picklist values for a given picklist field
    @AuraEnabled(cacheable = true)
    public static Map < String, String > fetchPicklistValues(String fieldName, String objectName) {
        Map < String, String > mapOfPicklistLabelsAndValues = new Map < String, String > ();
        try {
            Map < String, Schema.SObjectField > fmap = Schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap();

            for (Schema.PicklistEntry entry: fmap.get(fieldName).getDescribe().getPicklistValues()) {
                mapOfPicklistLabelsAndValues.put(entry.getLabel(), entry.getValue());
            }

            return mapOfPicklistLabelsAndValues;
        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException(e.getMessage());
        }
    }

    //P20S-1055-to display part recommendation message in lwc ui
    @AuraEnabled
    public static string getPartRecommendation(String partsReqId) {
        try {
            List < String > newPartBilTypes = new List < String > {'BILLABLE','BILLABLE_W/DISCOUNT','CONTRACT_50/50','CONTRACT_LABOR_ONLY','CONTRACT_LIMITED'};
            SVMXC__Parts_Request__c partsReq = [SELECT Id, 
                                                       Name, 
                                                       Work_Order_AC__r.SVMXC__Billing_Type__c, 
                                                       Work_Order_AC__r.SVMXC__Order_Type__c
                                                FROM SVMXC__Parts_Request__c
                                                WHERE Id =: partsReqId
                                               ];
            if (newPartBilTypes.contains(partsReq.Work_Order_AC__r.SVMXC__Billing_Type__c)) {
                return 'new';
            } else if ((partsReq.Work_Order_AC__r.SVMXC__Billing_Type__c == 'CONTRACT_FULL' || partsReq.Work_Order_AC__r.SVMXC__Billing_Type__c == 'CONTRACT_PARTS_ONLY') || ((partsReq.Work_Order_AC__r.SVMXC__Billing_Type__c == 'CONTRACT_PM_ONLY' || partsReq.Work_Order_AC__r.SVMXC__Billing_Type__c == 'CONTRACT_PM_W/DISCOUNT') && partsReq.Work_Order_AC__r.SVMXC__Order_Type__c == 'Preventive Maintenance')) {
                return 'epart';
            } else {
                return ' ';
            }
        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException(e.getMessage());
        }
    }

    //P20S-957 - to fetch location data
    @AuraEnabled
    public static List < SVMXC__Site__c > getLocData(String sQuery) {
        try {
            return Database.query(sQuery);
        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException(e.getMessage());
        }
    }

    //P20S-927,P20S-939 - to update parts request line
    @AuraEnabled
    public static void updatePartsReqLines(List < SVMXC__Parts_Request_Line__c > recordsToUpdate) {
        try {
            if (recordsToUpdate?.size() > 0) {
                update recordsToUpdate;
            }
        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException(e.getMessage());
        }
    }

    //P20S-927,P20S-981 - to delete parts request line(s)
    @AuraEnabled
    public static void deleteATPPartsReqLines(String partsReqId) {
        try {
            Id atpcheckLineRecTypId = Schema.SObjectType.SVMXC__Parts_Request_Line__c.getRecordTypeInfosByDeveloperName().get('ATP_Check_Line').getRecordTypeId();
            List < SVMXC__Parts_Request_Line__c > recordsToDelete = [SELECT Id, 
                                                                            Name
                                                                     FROM SVMXC__Parts_Request_Line__c
                                                                     WHERE SVMXC__Parts_Request__c =: partsReqId AND SVMXC__Line_Status__c = 'Open' AND RecordTypeId =: atpcheckLineRecTypId AND Rejection_Reason__c = null
                                                                     ];
            if (recordsToDelete?.size() > 0) {
                Delete recordsToDelete;
            }

        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException('Error while deleting parts request line records' + e.getMessage());
        }
    }

    //P20S-981,P20S-1012 - to delete unselected atp lines and update selected lines
    @AuraEnabled
    public static void deleteUpdateOpenPartsReqLines(String partsReqId, String partsReqLineIds) {
        List < Id > partsReqLineIdsToUpdate = new List < Id > ();
        List < SVMXC__Parts_Request_Line__c > partsReqLinesToUpdate = new List < SVMXC__Parts_Request_Line__c > ();
        List < SVMXC__Parts_Request_Line__c > partsReqLinesToDelete = new List < SVMXC__Parts_Request_Line__c > ();
        Map < Id, Parts_Request_Interface__e > partsReqestInterfaceMap = new Map < Id, Parts_Request_Interface__e > ();
        List < Platform_Events_Logger__c > logsToInsertList = new List < Platform_Events_Logger__c > ();
        try {
            List < String > partsReqLineIdList = partsReqLineIds.split(',');
            Id atpcheckLineRecTypId = Schema.SObjectType.SVMXC__Parts_Request_Line__c.getRecordTypeInfosByDeveloperName().get('ATP_Check_Line').getRecordTypeId();

            for (String idString: partsReqLineIdList) {
                partsReqLineIdsToUpdate.add(Id.valueOf(idString.trim()));
            }

            List < SVMXC__Parts_Request_Line__c > partsReqLineRecords = [SELECT Id, 
                                                                                Name, 
                                                                                SVMXC__Parts_Request__c, 
                                                                                SVMXC__Parts_Request__r.Group_Shipment_AC__c, 
                                                                                Source__c, 
                                                                                Urgency_Code__c
                                                                         FROM SVMXC__Parts_Request_Line__c
                                                                         WHERE SVMXC__Parts_Request__c =: partsReqId AND SVMXC__Line_Status__c = 'Open'
                                                                         AND RecordTypeId =: atpcheckLineRecTypId AND Rejection_Reason__c = null
                                                                         FOR UPDATE
                                                                         ];

            for (SVMXC__Parts_Request_Line__c partsReqLine: partsReqLineRecords) {
                if (partsReqLineIdsToUpdate.contains(partsReqLine.Id)) {
                    partsReqLinesToUpdate.add(partsReqLine);
                } else {
                    partsReqLinesToDelete.add(partsReqLine);
                }
            }

            for (SVMXC__Parts_Request_Line__c partsReqLine: partsReqLinesToUpdate) {
                if ((partsReqLine.SVMXC__Parts_Request__r.Group_Shipment_AC__c || !partsReqLine.SVMXC__Parts_Request__r.Group_Shipment_AC__c) && (partsReqLine.Urgency_Code__c == System.Label.ATP_UDCR_Label||partsReqLine.Urgency_Code__c == System.Label.ATP_BP_Label) && (partsReqLine.Source__c == System.Label.ATP_LOCAL_Label || partsReqLine.Source__c == System.Label.ATP_SC_Label)) {

                    partsReqLine.SVMXC__Line_Status__c = 'Pending Approval';

                } else if (partsReqLine.SVMXC__Parts_Request__r.Group_Shipment_AC__c && partsReqLine.Urgency_Code__c == System.Label.ATP_None_Label  && (partsReqLine.Source__c == System.Label.ATP_LOCAL_Label || partsReqLine.Source__c == System.Label.ATP_SC_Label)) {

                    partsReqLine.SVMXC__Line_Status__c = 'Order Submitted';

                } else if (!partsReqLine.SVMXC__Parts_Request__r.Group_Shipment_AC__c && partsReqLine.Urgency_Code__c == System.Label.ATP_None_Label && (partsReqLine.Source__c == System.Label.ATP_LOCAL_Label || partsReqLine.Source__c == System.Label.ATP_SC_Label)) {

                    partsReqLine.SVMXC__Line_Status__c = 'Order Submitted';

                    if (partsReqestInterfaceMap.containsKey(partsReqLine.SVMXC__Parts_Request__c)) {
                        Parts_Request_Interface__e event = new Parts_Request_Interface__e();
                        event.PR_ID__c = partsReqLine.SVMXC__Parts_Request__c;
                        event.PRL_IDS__c = partsReqestInterfaceMap.get(partsReqLine.SVMXC__Parts_Request__c).PRL_IDS__c + ',\'' + partsReqLine.id + '\'';
                        partsReqestInterfaceMap.put(partsReqId, event);
                    } else {
                        Parts_Request_Interface__e event = new Parts_Request_Interface__e();
                        event.PRL_IDS__c = '\'' + partsReqLine.id + '\'';
                        event.PR_ID__c = partsReqLine.SVMXC__Parts_Request__c;
                        partsReqestInterfaceMap.put(partsReqId, event);
                    }
                } else if ( partsReqLine.Urgency_Code__c == System.Label.ATP_None_Label && partsReqLine.Source__c == System.Label.ATP_TRUNK_Label) {

                    partsReqLine.SVMXC__Line_Status__c = 'Pending Approval';

                }
            }

            if (partsReqLinesToDelete?.size() > 0) {
                Delete partsReqLinesToDelete;
            }

            if (partsReqLinesToUpdate?.size() > 0) {
                Update partsReqLinesToUpdate;
            }

            if (!partsReqestInterfaceMap.isEmpty() && partsReqestInterfaceMap.values()?.size() > 0) {
                List < Database.SaveResult > sr = EventBus.publish(partsReqestInterfaceMap.values());
                for (Database.SaveResult res: sr) {
                    if (!res.isSuccess()) {
                        throw new AuraHandledException('Failed to publish parts req interface platform event');
                    }
                }
            }

            for (Parts_Request_Interface__e event: partsReqestInterfaceMap.values()) {
                Platform_Events_Logger__c log = new Platform_Events_Logger__c();
                log.Parts_Request__c = event.PR_ID__c;
                log.Parts_Request_Line_Ids__c = event.PRL_IDS__c;
                log.Replay_Id__c = event.EventUuid;
                log.Type__c = 'Parts Order';
                logsToInsertList.add(log);
            }

            if (!logsToInsertList.isEmpty()) {
                insert logsToInsertList;
            }

        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException('Error while deleting or updating parts request line records' + e.getMessage());
        }
    }

    //P20S-945 - to publish parts request interface platform event on resubmit
    @AuraEnabled
    public static void publishResubmitPlatformEvent(String partsReqId, String partsReqLineIds) {
        List < Id > partsReqLineIdsToUpdate = new List < Id > ();
        List < SVMXC__Parts_Request_Line__c > partsReqLinesToUpdate = new List < SVMXC__Parts_Request_Line__c > ();
        Map < Id, Parts_Request_Interface__e > partsReqestInterfaceMap = new Map < Id, Parts_Request_Interface__e > ();
        List < Platform_Events_Logger__c > logsToInsertList = new List < Platform_Events_Logger__c > ();
        try {
            List < String > partsReqLineIdList = partsReqLineIds.split(',');
            for (String idString: partsReqLineIdList) {
                partsReqLineIdsToUpdate.add(Id.valueOf(idString.trim()));
            }

            for (Id atpLineId: partsReqLineIdsToUpdate) {
                SVMXC__Parts_Request_Line__c partsReqLine = new SVMXC__Parts_Request_Line__c(
                    Id = atpLineId,
                    SAP_PO_Number_AC__c = null,
                    SAP_PO_Line_No_AC__c = null,
                    SAP_Error_Message_AC__c = null,
                    Estimated_Delivery_Date__c = null
                );
                partsReqLinesToUpdate.add(partsReqLine);
                if (partsReqestInterfaceMap.containsKey(partsReqId)) {
                    Parts_Request_Interface__e event = new Parts_Request_Interface__e();
                    event.PR_ID__c = partsReqId;
                    event.PRL_IDS__c = partsReqestInterfaceMap.get(partsReqId).PRL_IDS__c + ',\'' + atpLineId + '\'';
                    partsReqestInterfaceMap.put(partsReqId, event);
                } else {
                    Parts_Request_Interface__e event = new Parts_Request_Interface__e();
                    event.PRL_IDS__c = '\'' + atpLineId + '\'';
                    event.PR_ID__c = partsReqId;
                    partsReqestInterfaceMap.put(partsReqId, event);
                }

            }

            if (partsReqLinesToUpdate?.size() > 0) {
                Update partsReqLinesToUpdate;
            }

            if (!partsReqestInterfaceMap.isEmpty() && partsReqestInterfaceMap.values()?.size() > 0) {
                List < Database.SaveResult > sr = EventBus.publish(partsReqestInterfaceMap.values());
                for (Database.SaveResult res: sr) {
                    if (!res.isSuccess()) {
                        throw new AuraHandledException('Failed to publish parts req interface platform event');
                    }
                }
            }

            for (Parts_Request_Interface__e event: partsReqestInterfaceMap.values()) {
                Platform_Events_Logger__c log = new Platform_Events_Logger__c();
                log.Parts_Request__c = event.PR_ID__c;
                log.Parts_Request_Line_Ids__c = event.PRL_IDS__c;
                log.Replay_Id__c = event.EventUuid;
                log.Type__c = 'Parts Order';
                logsToInsertList.add(log);
            }

            if (!logsToInsertList.isEmpty()) {
                insert logsToInsertList;
            }

        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException(e.getMessage());
        }
    }

    //P20S-927,P20S-981 - to publish atp check platform event
    @AuraEnabled
    public static void publishPlatformEvent(String partsReqId) {
        try {
            ATP_Check_Interface__e atpCheckEvent = new ATP_Check_Interface__e();
            atpCheckEvent.PR_ID__c = partsReqId;
            Database.SaveResult sr = EventBus.publish(atpCheckEvent);
            if (!sr.isSuccess()) {
                throw new AuraHandledException('Failed to publish atp check platform event');
            }
            Platform_Events_Logger__c log = new Platform_Events_Logger__c();
            log.Parts_Request__c = atpCheckEvent.PR_ID__c;
            log.Replay_Id__c = atpCheckEvent.EventUuid;
            log.Type__c = 'ATP Check';
            insert log;
        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException(e.getMessage());
        }
    }

    //P20S-1079,P20S-1073 - to fetch parts order from service center metadata
    @AuraEnabled
    public static List < Parts_Order_From_Service_Center__mdt > getSCMetadata(String salesOrg) {
        List < Parts_Order_From_Service_Center__mdt > partsOrderFromSCList = new List < Parts_Order_From_Service_Center__mdt > ();
        try {
            if (salesOrg != null) {
                partsOrderFromSCList = [SELECT MasterLabel,
                                               Sales_Org__c,
                                               Allow_Order_From_SC__c,
                                               UDCR_Back_Order_for_Local__c,
                                               UDCR_Back_Order_for_SC__c,
                                               NON_UDCR_Back_Order_for_Local__c,
                                               NON_UDCR_Back_Order_for_SC__c
                                        FROM Parts_Order_From_Service_Center__mdt
                                        WHERE Sales_Org__c =: salesOrg
                                        Limit 1
                                       ];
            }
            return partsOrderFromSCList;
        } catch (Exception e) {
            Alcon_Custom_Exception.updateExceptionHistory(e);
            throw new AuraHandledException(e.getMessage());
        }
    }

    //P20S-884-to fetch value to allow/restrict expense order for brazil
    @AuraEnabled
    public static String getCustomSettingValue(){
        try {
             Alcon_CS2_Settings_AC__c setting=Alcon_CS2_Settings_AC__c.getOrgDefaults();
             return setting.Prophet_BR_Expense_Order__c;
        } catch (Exception e) {
             Alcon_Custom_Exception.updateExceptionHistory(e);
             throw new AuraHandledException(e.getMessage());
        }
    }
}