package com.selim.resourcemanagement.repository;

import com.selim.resourcemanagement.entity.Asset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {
    boolean existsByAssetNumber(String assetNumber);

    @Query("SELECT a FROM Asset a WHERE a.isDeleted = false " +
           "AND (:category IS NULL OR a.category = :category) " +
           "AND (:assetNumber IS NULL OR a.assetNumber LIKE %:assetNumber%) " +
           "AND (:userName IS NULL OR a.userName LIKE %:userName%) " +
           "AND (:status IS NULL OR a.status = :status)")
    Page<Asset> findAssetsWithFilters(@Param("category") String category,
                                      @Param("assetNumber") String assetNumber,
                                      @Param("userName") String userName,
                                      @Param("status") String status,
                                      Pageable pageable);

    @Query("SELECT a FROM Asset a WHERE a.isDeleted = false " +
           "AND (:category IS NULL OR a.category = :category)")
    List<Asset> findForExport(@Param("category") String category);
}
