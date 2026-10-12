package com.example.personcrud.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Immutable Course data transfer record.
 */
public record CourseDto(
        Long id,

        @NotBlank
        @Size(max = 100)
        String name,

        Long teacherId,

        List<Long> studentIds
) {
    public CourseDto {
        if (studentIds == null) {
            studentIds = List.of();
        }
    }

    public CourseDto(Long id, String name, Long teacherId) {
        this(id, name, teacherId, List.of());
    }
}
