package com.selim.resourcemanagement.repository;

import com.selim.resourcemanagement.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuRepository extends JpaRepository<Menu, Long> {
    List<Menu> findByIsActiveTrueOrderByDisplayOrderAsc();
    List<Menu> findByParentMenuIsNullAndIsActiveTrueOrderByDisplayOrderAsc();
}
