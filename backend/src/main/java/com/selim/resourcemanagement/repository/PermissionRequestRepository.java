package com.selim.resourcemanagement.repository;

import com.selim.resourcemanagement.entity.PermissionRequest;
import com.selim.resourcemanagement.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PermissionRequestRepository extends JpaRepository<PermissionRequest, Long> {
    Page<PermissionRequest> findByStatusOrderByRequestedAtDesc(String status, Pageable pageable);
    List<PermissionRequest> findByUserOrderByRequestedAtDesc(User user);
    long countByStatus(String status);
}
