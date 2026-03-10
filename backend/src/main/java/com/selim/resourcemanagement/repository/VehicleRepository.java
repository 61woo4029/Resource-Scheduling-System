package com.selim.resourcemanagement.repository;

import com.selim.resourcemanagement.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByIsActiveTrueOrderByVehicleType();
}
