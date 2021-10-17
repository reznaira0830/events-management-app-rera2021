public with sharing class ScheduleLWCHandler {
    @AuraEnabled (cacheable = true)
    public static List<Event_Attendee__c> getAttendeesBySchedule(Id schedId){
        return MainDataManager.getAttendeesBySchedule(schedId);
    }

    @AuraEnabled
    public static String cancelAttendee(Id attendeeId, String cancellationReason){
        Event_Attendee__c attendee = MainDataManager.getAttendeeById(attendeeId);
        String message = '';

        if(attendee != null){
            attendee.Status__c = 'Cancelled';
            attendee.Cancellation_Reason__c = cancellationReason;
            message = attendee.Contact__r.Name + ' is successfully cancelled.';
        
            UPDATE attendee;
        }else{
            message = 'Cancellation for ' + attendee.Contact__r.Name + ' failed.'; 
        }

        return message;
    }

    @AuraEnabled (cacheable = true)
    public static List<Contact> getContactsByName(String searchName){
        return MainDataManager.getContactsByName(searchName);
    }

    @AuraEnabled
    public static String saveNewAttendees(List<Id> contactIds, Id schedId){
        String message = '';
        List<Event_Attendee__c> eventAttendees = new List<Event_Attendee__c>();
        System.debug('contactIds');
        System.debug(contactIds);
        if(contactIds.size() <> 0){
            for(Id conId : contactIds){
                Event_Attendee__c attendee = new Event_Attendee__c(
                    Contact__c = conId,
                    Schedule__c = schedId
                );
                eventAttendees.add(attendee);
            }
        
            if(eventAttendees.size() > 0){
                message = 'Attendees are successfully added.';
                INSERT eventAttendees;
            }
                
        }else{
            message = 'Failed to add attendees.';
        }

        return message;
    }
}