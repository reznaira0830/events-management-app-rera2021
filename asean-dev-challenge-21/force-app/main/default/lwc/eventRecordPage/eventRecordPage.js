import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

import EVENT_NAME_FIELD from '@salesforce/schema/Event__c.Name';
import EVENT_DESC_FIELD from '@salesforce/schema/Event__c.Description__c';
import EVENT_SPONSOR_FIELD from '@salesforce/schema/Event__c.Sponsor__c';
import EVENT_TYPE_FIELD from '@salesforce/schema/Event__c.Type__c';
import getSchedulesByEvent from '@salesforce/apex/EventLWCHandler.getSchedulesByEvent';
import updateSingleSchedule from '@salesforce/apex/EventLWCHandler.updateSingleSchedule';
import updateBulkSchedule from '@salesforce/apex/EventLWCHandler.updateBulkSchedule';
import getContactsByName from '@salesforce/apex/ScheduleLWCHandler.getContactsByName';
import saveNewSchedule from '@salesforce/apex/EventLWCHandler.saveNewSchedule';

const EVENT_RECORD_FIELDS = [EVENT_NAME_FIELD, EVENT_TYPE_FIELD, EVENT_SPONSOR_FIELD, EVENT_DESC_FIELD];

const AREA_OPTIONS = [
    { label: 'North Hall', value: 'North Hall' },
    { label: 'South Hall', value: 'South Hall' },
    { label: 'East Hall', value: 'East Hall' },
    { label: 'West Hall', value: 'West Hall' },
    { label: 'Virtual', value: 'Virtual' }
];

const DAYS_OF_THE_WEEK = [
    { label: 'Monday', value: 'Monday' },
    { label: 'Tuesday', value: 'Tuesday' },
    { label: 'Wednesday', value: 'Wednesday' },
    { label: 'Thursday', value: 'Thursday' },
    { label: 'Friday', value: 'Friday' },
    { label: 'Saturday', value: 'Saturday' },
    { label: 'Sunday', value: 'Sunday' },
];

export default class EventRecordPage extends NavigationMixin(LightningElement) {
    @api recordId;

    @track selectedContactsList = [];

    eventFields = EVENT_RECORD_FIELDS;
    areaOptions = AREA_OPTIONS;
    daysOfTheWeek = DAYS_OF_THE_WEEK;
    today = new Date();
    startDate = this.today.getFullYear() + '-' + String(this.today.getMonth() + 1).padStart(2, '0') + '-' + String(this.today.getDate()).padStart(2, '0');
    startTime = '00:00:00.000Z';
    endTime = '01:00:00.000Z';
    
    error;
    schedId;
    schedulesList;
    selectAll = false;
    isSelected = false;
    openScheduleEventModal;
    schedulePage = true;
    attendeePage = false;
    selectedArea;
    isRecurring;
    selectedDays = [];
    endDate;

    attendeeSearchValue = '';
    attendeeSearchList = [];
    contactsMap = [];
    selectedContactsMap = [];
    selectedContact;
    selectedAttendeeToRemove;

    get getSelectedDays (){ return this.selectedDays.join(','); }

    get hasSelectedDays(){ return this.selectedDays.length > 0; }

    get hasAttendeeSearchList(){ return this.attendeeSearchList.length > 0 ? true : false }
    
    get attendeeSearchNoResult(){ return !this.attendeeSearchList.length > 0 && this.attendeeSearchValue != '' ? true : false }

    get hasSelectedContactsList(){ return this.selectedContactsList.length > 0 ? true : false }
    
    get selectedContactsListNoResult(){ return !this.selectedContactsList.length > 0 || this.selectedContactsList == [] }

    @wire(getSchedulesByEvent, { eventId: '$recordId' })
    getSchedulesByEvent(result) {
        if (result.data) {
            this.schedulesList = result;
            this.error = undefined;
            console.log(this.schedulesList);
        } else if (result.error) {
            this.error = result.error;
            this.schedulesList = undefined;
        }
    }

    handleViewEvent(event) {
        this.schedId = event.target.dataset.row;

        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.schedId,
                objectApiName: 'Schedule__c',
                actionName: 'view'
            }
        });
    }

    handleSelectAll(event){
        this.selectAll = event.target.checked;
        
        let schedsTemp = this.schedulesList.data;
        let currentSched;
        let str;
        
        schedsTemp.forEach( sched => {
            str = '[data-id=' + sched.schedId + ']';
            currentSched = this.template.querySelector(str);

            if(!currentSched.disabled){
                currentSched.checked = this.selectAll;
            }
        });
    }

    handleSingleEventUpdate(event){
        this.schedId = event.target.dataset.row;
        let action = event.target.dataset.label;
        let message = '';
        updateSingleSchedule({
            schedId: this.schedId,
            action: action
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
            this.selectAll = false;
            this.isSelected = false;
            return refreshApex(this.schedulesList);
        })
        .catch((error) => {
            this.error = error;
        });
    }

    handleBulkSchedUpdate(event){
        let schedsTemp = this.schedulesList.data;
        let action = event.target.dataset.label;
        let schedsForUpdate = [];
        let currentEvt;
        let str;
        let message = '';
        
        schedsTemp.forEach( sch => {
            str = '[data-id=' + sch.schedId + ']';
            currentEvt = this.template.querySelector(str);

            if(currentEvt.checked){
                schedsForUpdate.push(sch.schedId);
            }
        });
        
        updateBulkSchedule({
            schedIdsList: schedsForUpdate,
            action: action
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
            this.selectAll = false;
            this.isSelected = false;

            let schedsTemp = this.schedulesList.data;
            let currentSched;
            let str;
            
            schedsTemp.forEach( sched => {
                str = '[data-id=' + sched.schedId + ']';
                currentSched = this.template.querySelector(str);
                currentSched.checked = false;
            });
            return refreshApex(this.schedulesList);
        })
        .catch((error) => {
            this.error = error;
            console.log(this.error);
        });
    }

    handleScheduleEvent(){
        this.openScheduleEventModal = true;
        this.schedulePage = true;
        this.attendeePage = false;
        this.isRecurring = false;
        this.selectedDays = [];
        this.endDate = '';
        this.attendeeSearchValue = '';
        this.attendeeSearchList = [];
        this.contactsMap = [];
        this.selectedContactsMap = [];
        this.selectedContact = '';
    }

    handleCloseModal(){
        this.openScheduleEventModal = false;
        this.isRecurring = false;
        this.selectedDays = [];
        this.endDate = '';
        this.schedulePage = true;
        this.attendeePage = false;
        this.attendeeSearchValue = '';
        this.attendeeSearchList = [];
        this.contactsMap = [];
        this.selectedContactsMap = [];
        this.selectedContact = '';
    }

    handleNext(){
        this.schedulePage = false;
        this.attendeePage = true;

        if(this.selectedArea != null && this.startDate != null && this.startTime !=null && this.endTime != null){
            if(this.isRecurring && this.endDate != null || !this.isRecurring){
                this.schedulePage = false;
                this.attendeePage = true;
            }

        }
    }

    handleBack(){
        this.schedulePage = true;
        this.attendeePage = false;
    }

    handleRecurringEvent(event){
        this.isRecurring = event.target.checked;
        this.selectedDays = [];
        this.endDate = '';
    }

    handleDaysSelection(event){
        this.selectedDays = event.detail.value;
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
            this.selectedContactsMap[this.selectedContact] = selectedContactInMap;
            this.selectedContactsList = Object.values(this.selectedContactsMap);
            
            this.attendeeSearchList = [];
            this.attendeeSearchValue = '';
        }
    }
    
    handleSelectArea(event){
        this.selectedArea = event.target.value;
    }

    handleStartDate(event){
        this.startDate = event.target.value;
    }

    handleStartTime(event){
        this.startTime = event.target.value;
    }

    handleEndTime(event){
        this.endTime = event.target.value;
    }

    handleEndDate(event){
        this.endDate = event.target.value;
    }

    handleSaveSchedule(){
        let message = '';
        let contactIds = Object.keys(this.selectedContactsMap);
        let schedMap = {
            'area' : this.selectedArea,
            'sd' : this.startDate,
            'ed' : this.endDate,
            'st' : this.startTime,
            'et' : this.endTime,
            'days' : this.selectedDays,
            'contacts' : contactIds,
            'recurring' : this.isRecurring
        };

        console.log(schedMap);

        saveNewSchedule({
            schedDetailsMap: schedMap,
            eventId: this.recordId
        })
        .then((result) => {
            message = result;
            const action = new ShowToastEvent({
                title: "Success!",
                message: message,
                variant: "success"
            });
            this.dispatchEvent(action);

            this.openScheduleEventModal = false;
            this.isRecurring = false;
            this.selectedDays = [];
            this.endDate = '';
            this.schedulePage = true;
            this.attendeePage = false;
            this.attendeeSearchValue = '';
            this.attendeeSearchList = [];
            this.contactsMap = [];
            this.selectedContactsMap = [];
            this.selectedContact = '';

            return refreshApex(this.schedulesList);
        })
        .catch((error) => {
            this.error = error;
            console.log(error);
        });
    }
}