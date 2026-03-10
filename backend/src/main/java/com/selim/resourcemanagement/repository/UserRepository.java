package com.selim.resourcemanagement.repository;

import com.selim.resourcemanagement.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.isActive = true " +
           "AND (:search IS NULL OR u.name LIKE %:search% OR u.email LIKE %:search%) " +
           "AND (:departmentId IS NULL OR u.department.departmentId = :departmentId) " +
           "AND (:role IS NULL OR u.role = :role)")
    Page<User> findUsersWithFilters(@Param("search") String search,
                                    @Param("departmentId") Long departmentId,
                                    @Param("role") String role,
                                    Pageable pageable);
}
