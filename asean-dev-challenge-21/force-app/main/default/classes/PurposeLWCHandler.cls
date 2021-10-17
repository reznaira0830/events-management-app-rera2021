public with sharing class PurposeLWCHandler {
    @AuraEnabled (cacheable = true)
    public static List<ScheduleWrapper> getSchedulesByEvent(Id eventId){
        List<Schedule__c> schedulesByEventList = MainDataManager.getSchedulesByEvent(eventId);
        List<ScheduleWrapper> schedulesByEventListWr = new List<ScheduleWrapper>();

        for(Schedule__c sched : schedulesByEventList){
            Boolean disabledStatus = sched.Status__c == 'Complete' || sched.Status__c == 'Cancelled' ? true : false;
            ScheduleWrapper schedWrap = new ScheduleWrapper(sched, disabledStatus);
            schedulesByEventListWr.add(schedWrap);
        }

        return schedulesByEventListWr;
    }

    @AuraEnabled
    public static String updateSingleSchedule(Id schedId, String action){
        Set<Id> schedIds = new Set<Id>{schedId};
        List<Schedule__c> schedRecord = MainDataManager.getScheduleByIds(schedIds);
        String message = '';

        if(schedRecord != null){
            if(action == 'complete'){
                schedRecord[0].Status__c = 'Complete';
                message = schedRecord[0].Name + ' is successfully completed.';
            }else if(action == 'cancel'){
                schedRecord[0].Status__c = 'Cancelled';
                message = schedRecord[0].Name + ' is successfully cancelled.';
            }
            UPDATE schedRecord[0];
        }else{
            message = schedRecord[0].Name + ' failed to be updated.';
        }

        return message;
    }

    @AuraEnabled
    public static String updateBulkSchedule(List<Id> schedIdsList, String action){
        String message = '';
        String status = '';
        Set<Id> schedIds = new Set<Id>();

        if(schedIdsList.size() <> 0){
            if(action == 'complete'){
                status = 'Complete';
                message = 'Event Schedules were successfully completed.';
            }else if(action == 'cancel'){
                status = 'Cancelled';
                message = 'Event Schedules were successfully cancelled.';
            }
            
            for(Id schedId : schedIdsList){
                schedIds.add(schedId);
            }

            List<Schedule__c> schedsList = MainDataManager.getScheduleByIds(schedIds);

            if(schedsList.size() <> 0){
                for(Schedule__c sched : schedsList){
                    sched.Status__c = status;
                }

                UPDATE schedsList;
            }else{
                message = 'Event Schedules failed to be updated.';
            }
        }

        return message;
    }

    public class ScheduleWrapper {
        @AuraEnabled
        public Id schedId;
        @AuraEnabled
        public String schedName;
        @AuraEnabled
        public String schedArea;
        @AuraEnabled
        public Date schedStart;
        @AuraEnabled
        public Date schedEnd;
        @AuraEnabled
        public Time schedStartTime;
        @AuraEnabled
        public Time schedEndTime;
        @AuraEnabled
        public Id schedPurpose;
        @AuraEnabled
        public String schedStatus;
        @AuraEnabled
        public Boolean schedIsComplete;  
        @AuraEnabled
        public Boolean schedIsCancelled;
        @AuraEnabled
        public Boolean schedIsSelected;

        public ScheduleWrapper(Schedule__c sched, Boolean disabledStatus){
            schedId = sched.Id;
            schedName = sched.Name;
            schedArea = sched.Area__c;
            schedStart = sched.Start__c;
            schedEnd = sched.End__c;
            schedStartTime = sched.Start_Time__c;
            schedEndTime = sched.End_Time__c;
            schedPurpose = sched.Event__c;
            schedStatus = sched.Status__c;
            schedIsComplete = disabledStatus;  
            schedIsCancelled = disabledStatus;
            schedIsSelected = false;
        }
    }
}