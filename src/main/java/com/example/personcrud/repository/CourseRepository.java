package com.example.personcrud.repository;

import com.example.personcrud.model.Course;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    @Override
    @EntityGraph(attributePaths = {"teacher", "students"})
    List<Course> findAll();

    @EntityGraph(attributePaths = {"teacher", "students"})
    List<Course> findByTeacherId(Long teacherId);

    @Query("SELECT DISTINCT c FROM Course c LEFT JOIN FETCH c.teacher LEFT JOIN FETCH c.students s WHERE :studentId IN (SELECT st.id FROM c.students st)")
    List<Course> findByStudentId(@Param("studentId") Long studentId);
}

