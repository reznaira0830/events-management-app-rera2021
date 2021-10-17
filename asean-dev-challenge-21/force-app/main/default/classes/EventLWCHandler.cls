public with sharing class EventLWCHandler {
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

    @AuraEnabled
    public static String saveNewSchedule(Map<String, Object> schedDetailsMap, Id eventId){
        String message = '';
        Event__c event = MainDataManager.getEventById(eventId);
        List<Schedule__c> newSchedList = new List<Schedule__c>();
        List<Event_Attendee__c> newAttendeeList = new List<Event_Attendee__c>();

        Boolean isRecurring = (Boolean)schedDetailsMap.get('recurring');
        Date startDate = Date.valueOf((String)schedDetailsMap.get('sd'));
        Date endDate = isRecurring ? Date.valueOf((String)schedDetailsMap.get('ed')) : startDate;
        String[] startTimeSplit = String.valueOf(schedDetailsMap.get('st')).split(':');
        Time startTime = Time.newInstance( Integer.valueOf(startTimeSplit[0]), Integer.valueOf(startTimeSplit[1]), 0, 0);
        String[] endTimeSplit = String.valueOf(schedDetailsMap.get('et')).split(':');
        Time endTime = Time.newInstance( Integer.valueOf(endTimeSplit[0]), Integer.valueOf(endTimeSplit[1]), 0, 0);

        if(isRecurring){
            Date st = startDate;

            while(st <= endDate){
                for(Object day : (List<Object>)schedDetailsMap.get('days')){
                    Datetime dt = DateTime.newInstance(st, Time.newInstance(0, 0, 0, 0));
                    String dayOfWeek = dt.format('EEEE');

                    if(String.valueOf(day) == dayOfWeek){
                        Schedule__c newSched = new Schedule__c(
                            Name = event.Name + ' ' + st.format(),
                            Area__c = (String)schedDetailsMap.get('area'),
                            End__c = st,
                            End_Time__c = endTime,
                            Event__c = event.Id,
                            Start__c = st,
                            Start_Time__c = startTime
                        );

                        newSchedList.add(newSched);
                    }
                }
                st = st.addDays(1);
            }
        }else{
            Schedule__c newSched = new Schedule__c(
                Name = event.Name + ' ' + startDate.format(),
                Area__c = (String)schedDetailsMap.get('area'),
                End__c = endDate,
                End_Time__c = endTime,
                Event__c = event.Id,
                Start__c = startDate,
                Start_Time__c = startTime
            );
            newSchedList.add(newSched);
        }

        if(newSchedList.size() > 0){
            INSERT newSchedList;

            for(Schedule__c sched : newSchedList){
                for(Object contactId : (List<Object>)schedDetailsMap.get('contacts')){
                    Event_Attendee__c attendee = new Event_Attendee__c(
                        Contact__c = (Id)contactId,
                        Schedule__c = sched.Id
                    );
                    newAttendeeList.add(attendee);
                }
            }
            if(newAttendeeList.size() > 0){
                INSERT newAttendeeList;
                message = 'New schedule for ' + event.Name + ' was successfully added.';
            }
        }else{
            message = 'New schedule for ' + event.Name + ' failed to be added.';
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