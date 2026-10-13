package com.example.personcrud.repository;

import com.example.personcrud.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {
    List<Person> findByLastNameStartingWithIgnoreCase(String lastName);
    List<Person> findByLastNameIgnoreCase(String lastName);

    @Query("SELECT p FROM Person p WHERE LOWER(p.lastName) LIKE LOWER(CONCAT(:lastName, '%')) AND TYPE(p) = :type")
    List<Person> findByLastNamePrefixAndType(@Param("lastName") String lastName, @Param("type") Class<? extends Person> type);

    @Query("SELECT p FROM Person p WHERE TYPE(p) = :type")
    List<Person> findAllByType(@Param("type") Class<? extends Person> type);

    @Query("SELECT p FROM Person p WHERE TYPE(p) = :type")
    org.springframework.data.domain.Page<Person> findAllByType(@Param("type") Class<? extends Person> type, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT p FROM Person p WHERE p.id = :id AND TYPE(p) = :type")
    java.util.Optional<Person> findByIdAndType(@Param("id") Long id, @Param("type") Class<? extends Person> type);
}
