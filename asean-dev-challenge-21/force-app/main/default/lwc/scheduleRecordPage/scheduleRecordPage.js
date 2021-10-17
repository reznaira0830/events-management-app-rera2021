import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

import SCHEDULE_NAME_FIELD from '@salesforce/schema/Schedule__c.Name';
import SCHEDULE_AREA_FIELD from '@salesforce/schema/Schedule__c.Area__c';
import SCHEDULE_STATUS_FIELD from '@salesforce/schema/Schedule__c.Status__c';
import SCHEDULE_START_FIELD from '@salesforce/schema/Schedule__c.Start__c';
import SCHEDULE_END_FIELD from '@salesforce/schema/Schedule__c.End__c';
import SCHEDULE_START_TIME_FIELD from '@salesforce/schema/Schedule__c.Start_Time__c';
import SCHEDULE_END_TIME_FIELD from '@salesforce/schema/Schedule__c.End_Time__c';
import SCHEDULE_EVENT_FIELD from '@salesforce/schema/Schedule__c.Event__c';

import getAttendeesBySchedule from '@salesforce/apex/ScheduleLWCHandler.getAttendeesBySchedule';
import cancelAttendee from '@salesforce/apex/ScheduleLWCHandler.cancelAttendee';
import getContactsByName from '@salesforce/apex/ScheduleLWCHandler.getContactsByName';
import saveNewAttendees from '@salesforce/apex/ScheduleLWCHandler.saveNewAttendees';

const SCHEDULE_RECORD_FIELDS = [SCHEDULE_NAME_FIELD, SCHEDULE_EVENT_FIELD, SCHEDULE_AREA_FIELD, SCHEDULE_STATUS_FIELD, SCHEDULE_START_FIELD, SCHEDULE_END_FIELD, SCHEDULE_START_TIME_FIELD, SCHEDULE_END_TIME_FIELD];

export default class ScheduleRecordPage extends LightningElement {
    @api recordId;

    @track selectedContactsList = [];

    scheduleFields = SCHEDULE_RECORD_FIELDS;
    error;

    attendeesList;
    isSelected;
    openAddAttendeeModal;
    attendeeSearchValue = '';
    attendeeSearchList = [];
    contactsMap = [];
    selectedContactsMap = [];
    selectedContact;
    selectedAttendeeToRemove;
    openCancelModal;
    cancellationReason = '';

    get hasAttendeeSearchList(){ return this.attendeeSearchList.length > 0 ? true : false }
    
    get attendeeSearchNoResult(){ return !this.attendeeSearchList.length > 0 && this.attendeeSearchValue != '' ? true : false }

    get hasSelectedContactsList(){ return this.selectedContactsList.length > 0 ? true : false }
    
    get selectedContactsListNoResult(){ return !this.selectedContactsList.length > 0 || this.selectedContactsList == [] }

    @wire(getAttendeesBySchedule, { schedId: '$recordId' })
    getAttendeesBySchedule(result) {
        if (result.data) {
            this.attendeesList = result;
            this.error = undefined;
            console.log(this.attendeesList);
        } else if (result.error) {
            this.error = result.error;
            this.attendeesList = undefined;
        }
    }

    handleCancelReasonInput(event){
        this.cancellationReason = event.target.value;
    }

    handleCancelAttendee(event){
        this.selectedAttendeeToRemove =  event.target.dataset.row;
        this.openCancelModal = true;
    }

    handleCloseModal(){
        this.openCancelModal = false;
        this.openAddAttendeeModal = false;
        this.cancellationReason = '';
        this.selectedAttendeeToRemove = '';
        this.attendeeSearchList = [];
        this.attendeeSearchValue = '';
    }

    handleSaveCancellation(){
        let message = '';
        cancelAttendee({
            attendeeId: this.selectedAttendeeToRemove,
            cancellationReason: this.cancellationReason
        })
        .then((result) => {
            message = result;
            this.error = undefined;
            const schedAction = new ShowToastEvent({
                title: "Success!",
                message: message,
                variant: "success"
            });
            this.dispatchEvent(schedAction);
            
            this.openCancelModal = false;
            this.cancellationReason = '';
            this.selectedAttendeeToRemove = '';
            
            return refreshApex(this.attendeesList);
        })
        .catch((error) => {
            this.error = error;
            console.log(error);
        });
    }

    handleAddAttendees(){
        this.openAddAttendeeModal = true;
        this.attendeeSearchValue = '';
        this.attendeeSearchList = [];
        this.contactsMap = [];
        this.selectedContact = '';
        this.selectedContactsMap = [];
        this.selectedContactsList = [];
    }

    handleAttendeeSearch(event){
        this.attendeeSearchValue = event.target.value;
        
        if(this.attendeeSearchValue != ''){
            getContactsByName({
                searchName: this.attendeeSearchValue
            })
            .then((result) => {
                this.attendeeSearchList = result;
                this.contactsMap = [];
                result.forEach( contact => {
                    //this.contactsMap.push({value: contact, key:contact.Id});
                    this.contactsMap[contact.Id] = contact;
                });
                console.log('this.contactsMap');
                console.log(this.contactsMap);
            })
            .catch((error) => {
                this.error = error;
                console.log(error);
            });
        }
            
    }

    handleSelectContact(event){
        this.selectedContact = event.target.dataset.id;
        if(this.selectedContact != undefined){
            console.log(this.selectedContact);
            let selectedContactInMap = this.contactsMap[this.selectedContact];
            //this.selectedContactsList = [...this.selectedContactsList, selectedContactInMap];
            this.selectedContactsMap[this.selectedContact] = selectedContactInMap;
            this.selectedContactsList = Object.values(this.selectedContactsMap);
            
            this.attendeeSearchList = [];
            this.attendeeSearchValue = '';
        }
    }

    handleRemoveContact(event){
        let toRemove = event.target.dataset.row;
        console.log(toRemove);
        delete this.selectedContactsMap[toRemove]; 
        this.selectedContactsList = Object.values(this.selectedContactsMap);
        console.log(this.selectedContactsList);
    }

    handleSaveAddAttendees(){
        let contactIds = Object.keys(this.selectedContactsMap);
        let message;
        saveNewAttendees({
            contactIds: contactIds,
            schedId: this.recordId
        })
        .then((result) => {
            message = result;
            this.error = undefined;
            const action = new ShowToastEvent({
                title: "Success!",
                message: message,
                variant: "success"
            });
            this.dispatchEvent(action);

            this.openAddAttendeeModal = false;
            this.attendeeSearchValue = '';
            this.attendeeSearchList = [];
            this.contactsMap = [];
            this.selectedContact = '';
            this.selectedContactsMap = [];
            this.selectedContactsList = [];

            return refreshApex(this.attendeesList);
        })
        .catch((error) => {
            this.error = error;
            console.log(error);
        });
    }
}