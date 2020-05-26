import { LightningElement, wire, api, track } from "lwc";
import createCases from "@salesforce/apex/CaseController.createCaseRecords";
import { NavigationMixin } from "lightning/navigation";
import TYPE_FIELD from "@salesforce/schema/Case.Type";
import CASE_OBJECT from "@salesforce/schema/Case";

import { getPicklistValues } from "lightning/uiObjectInfoApi";
import { getObjectInfo } from "lightning/uiObjectInfoApi";
export default class CreateMultipleCases extends NavigationMixin(
  LightningElement
) {
  @api recordId;

  value = "inProgress";
  finished = true;
  @track subject = "";
  @track description = "";
  @track type = "";
  @track parentId = true;

  counter = 0;
  currentIndex = -1;
  cases = [];
  disable = true;
  @track finalCases;

  @wire(getObjectInfo, { objectApiName: CASE_OBJECT })
  objectInfo;

  @wire(getPicklistValues, {
    recordTypeId: "$objectInfo.data.defaultRecordTypeId",
    fieldApiName: TYPE_FIELD
  })
  TypePicklistValues;

  get disabled() {
    return this.counter === 0 ? true : false;
  }

  get finishDisabled() {
    return this.cases.length > 0 ? false : true;
  }

  get finalListCount() {
    return this.finalCases.length;
  }

  get nextDisabled() {
    if (this.subject === "" || this.description === "" || this.type === "") {
      return true;
    } else {
      return false;
    }
  }

  navigateToRecord(event) {
    event.preventDefault();
    event.stopPropagation();
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: event.target.dataset.recordId,
        objectApiName: "Case",
        actionName: "view"
      }
    });
  }
  insertRecords() {
    createCases({ caseRecords: this.cases, recordId: this.recordId })
      .then((result) => {
        this.finished = false;

        this.finalCases = result;
        this.cases = [];
        this.counter = 0;
        this.subject = "";
        this.description = "";
        this.type = "";
        this.template.querySelector("lightning-input.cb").checked = false;
        console.log(this.finalCases);
      })
      .catch((error) => {
        console.log(error);
        //this.error = error;
      });
  }

  onChecboxChange(event) {
    this.isChecked = event.target.checked;
  }

  handleChange(event) {
    const field = event.target.name;
    if (field === "subject") {
      this.subject = event.target.value;
      this.updateField("subject", event.target.value);
    } else if (field === "description") {
      this.description = event.target.value;
      this.updateField("description", event.target.value);
    } else if (field === "type") {
      this.type = event.target.value;
      this.updateField("type", event.target.value);
    } else if (field === "masterId") {
      this.parentId = event.target.checked;
      this.updateField("masterId", event.target.checked);
    }
  }

  updateField(field, value) {
    if (this.currentIndex != -1) {
      if (field === "subject") {
        this.cases[this.currentIndex].Subject = value;
      } else if (field === "description") {
        this.cases[this.currentIndex].Description = value;
      } else if (field === "type") {
        this.cases[this.currentIndex].Type = value;
      } else if (field === "masterId") {
        let rId = value === true ? this.recordId : null;
        this.cases[this.currentIndex].ParentId = rId;
      }
    }
  }

  refreshComponent(event) {
    this.subject = "";
    this.description = "";
    this.type = "";
    this.template.querySelector("lightning-input.cb").checked = false;
    this.parentId = false;
    this.finished = true;
    this.disable = true;
    this.counter = 0;
    this.cases = [];
    this.finalCases = [];
    this.currentIndex = -1;
  }

  handleNext(event) {
    if (this.counter < this.cases.length - 1) {
      const count = ++this.counter;
      this.currentIndex = count;

      this.subject = this.cases[count].Subject;
      this.description = this.cases[count].Description;
      this.type = this.cases[count].Type;
      if (this.cases[count].ParentId !== null) {
        this.template.querySelector("lightning-input.cb").checked = true;
      } else {
        this.template.querySelector("lightning-input.cb").checked = false;
      }
    } else if (this.counter === this.cases.length - 1) {
      this.subject = "";
      this.description = "";
      this.type = "";
      this.template.querySelector("lightning-input.cb").checked = true;
      this.counter++;
      this.currentIndex = -1;
      this.parentId = false;
    } else {
      let rId = this.parentId === true ? this.recordId : null;
      this.case = {
        Subject: this.subject,
        Description: this.description,
        Type: this.type,
        ParentId: rId
      };

      this.cases.push(this.case);
      this.subject = "";
      this.description = "";
      this.type = "";
      this.parentId = false;
      this.template.querySelector("lightning-input.cb").checked = true;
      this.counter++;
      this.currentIndex = -1;
    }
  }

  handlePrevious(event) {
    if (this.counter > 0) {
      const count = --this.counter;
      this.currentIndex = count;
      this.subject = this.cases[count].Subject;
      this.description = this.cases[count].Description;
      this.type = this.cases[count].Type;
      if (this.cases[count].ParentId !== null) {
        this.template.querySelector("lightning-input.cb").checked = true;
      } else {
        this.template.querySelector("lightning-input.cb").checked = false;
      }
    }
  }
}
