package com.selim.resourcemanagement.repository;

import com.selim.resourcemanagement.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByIsActiveTrueOrderByDepartmentName();
    List<Department> findAllByOrderByDepartmentName();
}
