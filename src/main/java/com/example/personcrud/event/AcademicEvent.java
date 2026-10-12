package com.example.personcrud.event;

/**
 * Sealed hierarchy of academic domain events.
 * Permitted records are co-declared in the same compilation unit.
 */
public sealed interface AcademicEvent {

    Long courseId();

    record StudentEnrolledEvent(Long courseId, Long studentId, String courseName) implements AcademicEvent {}

    record TeacherAssignedEvent(Long courseId, Long teacherId, String courseName) implements AcademicEvent {}

    record CourseCreatedEvent(Long courseId, String courseName, Long teacherId) implements AcademicEvent {}
}
