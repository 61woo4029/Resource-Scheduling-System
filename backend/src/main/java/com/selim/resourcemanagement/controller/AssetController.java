package com.selim.resourcemanagement.controller;

import com.selim.resourcemanagement.dto.ApiResponse;
import com.selim.resourcemanagement.dto.AssetDto;
import com.selim.resourcemanagement.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @GetMapping
    public ApiResponse<?> getAssets(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String asset_number,
            @RequestParam(required = false) String user_name,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(assetService.getAssets(category, asset_number, user_name, status, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getAsset(@PathVariable Long id) {
        return ApiResponse.success(assetService.getAsset(id));
    }

    private static final List<String> ALLOWED_UPLOAD_TYPES = List.of(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
    );
    private static final long MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

    @PreAuthorize("hasAnyRole('ASSET_ADMIN', 'SYSTEM_ADMIN')")
    @PostMapping
    public ApiResponse<?> createAsset(@RequestBody AssetDto.CreateRequest request,
                                       @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success("자산이 등록되었습니다.", assetService.createAsset(request, userDetails.getUsername()));
    }

    @PreAuthorize("hasAnyRole('ASSET_ADMIN', 'SYSTEM_ADMIN')")
    @PutMapping("/{id}")
    public ApiResponse<?> updateAsset(@PathVariable Long id,
                                       @RequestBody AssetDto.CreateRequest request,
                                       @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success("자산이 수정되었습니다.", assetService.updateAsset(id, request, userDetails.getUsername()));
    }

    @PreAuthorize("hasAnyRole('ASSET_ADMIN', 'SYSTEM_ADMIN')")
    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteAsset(@PathVariable Long id,
                                       @AuthenticationPrincipal UserDetails userDetails) {
        assetService.deleteAsset(id, userDetails.getUsername());
        return ApiResponse.success("자산이 삭제되었습니다.");
    }

    @PreAuthorize("hasAnyRole('ASSET_ADMIN', 'SYSTEM_ADMIN')")
    @DeleteMapping("/batch")
    public ApiResponse<?> deleteAssets(@RequestBody AssetDto.BatchDeleteRequest request,
                                        @AuthenticationPrincipal UserDetails userDetails) {
        assetService.deleteAssets(request.getIds(), userDetails.getUsername());
        return ApiResponse.success("자산이 일괄 삭제되었습니다.");
    }

    @PreAuthorize("hasAnyRole('ASSET_ADMIN', 'SYSTEM_ADMIN')")
    @PostMapping("/upload")
    public ApiResponse<?> uploadAssets(@RequestParam("file") MultipartFile file,
                                        @RequestParam("category") String category,
                                        @AuthenticationPrincipal UserDetails userDetails) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어 있습니다.");
        }
        if (file.getSize() > MAX_UPLOAD_SIZE) {
            throw new IllegalArgumentException("파일 크기는 5MB를 초과할 수 없습니다.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_UPLOAD_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Excel 파일(.xlsx, .xls)만 업로드할 수 있습니다.");
        }
        return ApiResponse.success("자산 업로드가 완료되었습니다.",
                assetService.uploadAssets(file, category, userDetails.getUsername()));
    }

    @PreAuthorize("hasAnyRole('ASSET_ADMIN', 'SYSTEM_ADMIN')")
    @GetMapping("/template/{category}")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable String category) throws IOException {
        byte[] data = assetService.downloadTemplate(category);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=asset_template_" + category + ".xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }

    @PreAuthorize("hasAnyRole('ASSET_ADMIN', 'SYSTEM_ADMIN')")
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAssets(@RequestParam(required = false) String category) throws IOException {
        byte[] data = assetService.exportAssets(category);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=assets_export.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }
}
