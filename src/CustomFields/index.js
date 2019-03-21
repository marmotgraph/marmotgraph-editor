import { FormStore } from "hbp-quickfire";

import KgInputTextField from "./KgInputTextField";
import KgTextAreaField from "./KgTextAreaField";
import KgDropdownSelectField from "./KgDropdownSelectField";

FormStore.registerCustomField("KgInputText", KgInputTextField, FormStore.typesMapping.InputText);
FormStore.registerCustomField("KgTextArea", KgTextAreaField, FormStore.typesMapping.TextArea);
FormStore.registerCustomField("KgDropdownSelect", KgDropdownSelectField, FormStore.typesMapping.DropdownSelect);

export default {
  KgInputTextField:{
    component:KgInputTextField,
    store:FormStore.typesMapping.InputText
  },
  KgTextAreaField:{
    component:KgTextAreaField,
    store:FormStore.typesMapping.TextArea
  },
  KgDropdownSelectField:{
    component:KgDropdownSelectField,
    store:FormStore.typesMapping.DropdownSelect
  }
};