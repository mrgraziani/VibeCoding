package com.example.personcrud.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class CourseDto {

    private Long id;

    @NotBlank
    @Size(max = 100)
    private String name;

    private Long teacherId;

    private List<Long> studentIds = new ArrayList<>();

    public CourseDto() {
    }

    public CourseDto(Long id, String name, Long teacherId, List<Long> studentIds) {
        this.id = id;
        this.name = name;
        this.teacherId = teacherId;
        this.studentIds = studentIds;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public List<Long> getStudentIds() {
        return studentIds;
    }

    public void setStudentIds(List<Long> studentIds) {
        this.studentIds = studentIds;
    }
}
