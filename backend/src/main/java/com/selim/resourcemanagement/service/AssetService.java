package com.selim.resourcemanagement.service;

import com.selim.resourcemanagement.dto.AssetDto;
import com.selim.resourcemanagement.dto.PageResponse;
import com.selim.resourcemanagement.entity.Asset;
import com.selim.resourcemanagement.entity.User;
import com.selim.resourcemanagement.repository.AssetRepository;
import com.selim.resourcemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<AssetDto.Response> getAssets(String category, String assetNumber, String userName, String status, int page, int size) {
        Page<Asset> assets = assetRepository.findAssetsWithFilters(
                StringUtils.hasText(category) ? category : null,
                StringUtils.hasText(assetNumber) ? assetNumber : null,
                StringUtils.hasText(userName) ? userName : null,
                StringUtils.hasText(status) ? status : null,
                PageRequest.of(page, size));
        return PageResponse.of(assets.map(this::toDto));
    }

    @Transactional(readOnly = true)
    public AssetDto.Response getAsset(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("자산을 찾을 수 없습니다."));
        return toDto(asset);
    }

    @Transactional
    public AssetDto.Response createAsset(AssetDto.CreateRequest request, String creatorEmail) {
        if (assetRepository.existsByAssetNumber(request.getAssetNumber())) {
            throw new IllegalArgumentException("이미 등록된 자산관리번호입니다.");
        }
        User creator = userRepository.findByEmail(creatorEmail).orElse(null);
        Asset asset = buildAsset(request, creator);
        return toDto(assetRepository.save(asset));
    }

    @Transactional
    public AssetDto.Response updateAsset(Long id, AssetDto.CreateRequest request, String updaterEmail) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("자산을 찾을 수 없습니다."));
        User updater = userRepository.findByEmail(updaterEmail).orElse(null);

        if (!asset.getAssetNumber().equals(request.getAssetNumber()) && assetRepository.existsByAssetNumber(request.getAssetNumber())) {
            throw new IllegalArgumentException("이미 등록된 자산관리번호입니다.");
        }

        asset.setAssetNumber(request.getAssetNumber());
        asset.setCategory(request.getCategory());
        asset.setUserName(request.getUserName());
        asset.setStatus(request.getStatus());
        asset.setPurchaseMonth(request.getPurchaseMonth());
        asset.setManufacturer(request.getManufacturer());
        asset.setModelName(request.getModelName());
        asset.setSerialNumber(request.getSerialNumber());
        asset.setOs(request.getOs());
        asset.setCpu(request.getCpu());
        asset.setRam(request.getRam());
        asset.setSsd(request.getSsd());
        asset.setHdd(request.getHdd());
        asset.setNotes(request.getNotes());
        asset.setUpdatedBy(updater);

        return toDto(assetRepository.save(asset));
    }

    @Transactional
    public void deleteAsset(Long id, String deleterEmail) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("자산을 찾을 수 없습니다."));
        User deleter = userRepository.findByEmail(deleterEmail).orElse(null);
        asset.setIsDeleted(true);
        asset.setDeletedBy(deleter);
        asset.setDeletedAt(LocalDateTime.now());
        assetRepository.save(asset);
    }

    @Transactional
    public void deleteAssets(List<Long> ids, String deleterEmail) {
        User deleter = userRepository.findByEmail(deleterEmail).orElse(null);
        for (Long id : ids) {
            assetRepository.findById(id).ifPresent(asset -> {
                asset.setIsDeleted(true);
                asset.setDeletedBy(deleter);
                asset.setDeletedAt(LocalDateTime.now());
                assetRepository.save(asset);
            });
        }
    }

    @Transactional
    public AssetDto.UploadResponse uploadAssets(MultipartFile file, String category, String creatorEmail) throws IOException {
        User creator = userRepository.findByEmail(creatorEmail).orElse(null);
        List<AssetDto.ErrorInfo> errors = new ArrayList<>();
        int success = 0;
        int total = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                total++;
                try {
                    String assetNumber = getCellValue(row, 0);
                    if (!StringUtils.hasText(assetNumber)) {
                        errors.add(new AssetDto.ErrorInfo(i + 1, "자산관리번호 누락"));
                        continue;
                    }
                    if (assetRepository.existsByAssetNumber(assetNumber)) {
                        errors.add(new AssetDto.ErrorInfo(i + 1, "자산관리번호 중복"));
                        continue;
                    }
                    Asset asset = Asset.builder()
                            .assetNumber(assetNumber)
                            .category(category)
                            .userName(getCellValue(row, 1))
                            .status(getCellValue(row, 2))
                            .manufacturer(getCellValue(row, 3))
                            .modelName(getCellValue(row, 4))
                            .serialNumber(getCellValue(row, 5))
                            .createdBy(creator)
                            .build();
                    assetRepository.save(asset);
                    success++;
                } catch (Exception e) {
                    errors.add(new AssetDto.ErrorInfo(i + 1, e.getMessage()));
                }
            }
        }

        return AssetDto.UploadResponse.builder()
                .total(total).success(success).failed(total - success).errors(errors).build();
    }

    public byte[] downloadTemplate(String category) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("자산템플릿");
            Row headerRow = sheet.createRow(0);
            String[] headers = {"자산관리번호", "사용자명", "상태", "제조사", "모델명", "시리얼번호", "OS", "CPU", "RAM", "SSD", "HDD", "기타"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportAssets(String category) throws IOException {
        List<Asset> assets = assetRepository.findForExport(StringUtils.hasText(category) ? category : null);
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("자산목록");
            Row headerRow = sheet.createRow(0);
            String[] headers = {"자산관리번호", "카테고리", "사용자명", "상태", "구입년월", "제조사", "모델명", "시리얼번호", "OS", "CPU", "RAM", "SSD", "HDD", "기타"};
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }
            int rowNum = 1;
            for (Asset a : assets) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(a.getAssetNumber());
                row.createCell(1).setCellValue(a.getCategory());
                row.createCell(2).setCellValue(a.getUserName());
                row.createCell(3).setCellValue(a.getStatus());
                row.createCell(4).setCellValue(a.getPurchaseMonth() != null ? a.getPurchaseMonth() : "");
                row.createCell(5).setCellValue(a.getManufacturer() != null ? a.getManufacturer() : "");
                row.createCell(6).setCellValue(a.getModelName() != null ? a.getModelName() : "");
                row.createCell(7).setCellValue(a.getSerialNumber() != null ? a.getSerialNumber() : "");
                row.createCell(8).setCellValue(a.getOs() != null ? a.getOs() : "");
                row.createCell(9).setCellValue(a.getCpu() != null ? a.getCpu() : "");
                row.createCell(10).setCellValue(a.getRam() != null ? a.getRam() : "");
                row.createCell(11).setCellValue(a.getSsd() != null ? a.getSsd() : "");
                row.createCell(12).setCellValue(a.getHdd() != null ? a.getHdd() : "");
                row.createCell(13).setCellValue(a.getNotes() != null ? a.getNotes() : "");
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private String getCellValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> "";
        };
    }

    private Asset buildAsset(AssetDto.CreateRequest r, User creator) {
        return Asset.builder()
                .assetNumber(r.getAssetNumber()).category(r.getCategory())
                .userName(r.getUserName()).status(r.getStatus())
                .purchaseMonth(r.getPurchaseMonth()).manufacturer(r.getManufacturer())
                .modelName(r.getModelName()).serialNumber(r.getSerialNumber())
                .os(r.getOs()).cpu(r.getCpu()).ram(r.getRam())
                .ssd(r.getSsd()).hdd(r.getHdd()).notes(r.getNotes())
                .createdBy(creator).build();
    }

    private AssetDto.Response toDto(Asset a) {
        return AssetDto.Response.builder()
                .assetId(a.getAssetId()).assetNumber(a.getAssetNumber())
                .category(a.getCategory()).userName(a.getUserName()).status(a.getStatus())
                .purchaseMonth(a.getPurchaseMonth()).manufacturer(a.getManufacturer())
                .modelName(a.getModelName()).serialNumber(a.getSerialNumber())
                .os(a.getOs()).cpu(a.getCpu()).ram(a.getRam())
                .ssd(a.getSsd()).hdd(a.getHdd()).notes(a.getNotes())
                .build();
    }
}
