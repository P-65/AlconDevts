import LightningDataTable from "lightning/datatable";
import customPickListTemplate from "./atp_custom_picklist.html";
import customPickListEditTemplate from "./atp_custom_picklist_edit.html";
import customImageTemplate from "./atp_custom_image.html";
export default class Atp_custom_datatable_datatype extends LightningDataTable {
static customTypes={
    customPicklist: {
        template: customPickListTemplate,
       editTemplate: customPickListEditTemplate,
        standardCellLayout: true,
        typeAttributes: ["options", "value", "context"]
        },
        customImage: {
            template: customImageTemplate,
            standardCellLayout: true,
            typeAttributes: ['pictureUrl']
    }
}

}