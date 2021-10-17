public with sharing class MainDataManager {
    
    public static Event__c getEventById(Id eventId){
        try {
            return [SELECT Id, Name FROM Event__c WHERE Id = :eventId];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static List<Schedule__c> getSchedulesByEvent(Id eventId){
        try {
            List<Schedule__c> schedsByEventList = [SELECT Id, Name, Area__c, End__c, End_Time__c, Event__c, Start__c, Start_Time__c, Status__c
                                                    FROM Schedule__c
                                                    WHERE Event__c = :eventId];
            return schedsByEventList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static List<Schedule__c> getScheduleByIds(Set<Id> schedIds){
        try {
            return [SELECT Id, Name, Area__c, End__c, End_Time__c, Event__c, Start__c, Start_Time__c, Status__c
                                                    FROM Schedule__c
                                                    WHERE Id IN :schedIds];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static List<Event_Attendee__c> getAttendeesBySchedule(Id schedId){
        try {
            return [SELECT Id, Name, Schedule__c, Contact__c, Contact__r.Name, Contact__r.Phone, Contact__r.Email, Status__c
                                                    FROM Event_Attendee__c
                                                    WHERE Schedule__c = :schedId AND Status__c != 'Cancelled'];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static Event_Attendee__c getAttendeeById(Id attendeeId){
        try {
            return [SELECT Id, Name, Schedule__c, Contact__c, Contact__r.Name, Contact__r.Phone, Contact__r.Email, Status__c
                                                    FROM Event_Attendee__c
                                                    WHERE Id = :attendeeId];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static List<Contact> getContactsByName(String searchName){
        String searchNameStr = '%' + searchName + '%';
        try {
            return [SELECT Id, Name, Phone, Email, Account.Name
                FROM Contact
                WHERE Name LIKE :searchNameStr ORDER BY Name ASC];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}