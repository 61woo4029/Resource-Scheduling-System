package com.selim.resourcemanagement.service;

import com.selim.resourcemanagement.dto.MenuDto;
import com.selim.resourcemanagement.entity.Menu;
import com.selim.resourcemanagement.repository.MenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuRepository menuRepository;

    @Transactional(readOnly = true)
    public List<MenuDto.Response> getMenus() {
        return menuRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MenuDto.Response> getMenuTree() {
        List<Menu> topMenus = menuRepository.findByParentMenuIsNullAndIsActiveTrueOrderByDisplayOrderAsc();
        return topMenus.stream().map(this::toDtoWithChildren).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MenuDto.Response> getMyMenus(String role) {
        return menuRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .filter(m -> m.getRequiredRoles() == null || m.getRequiredRoles().contains(role))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public MenuDto.Response createMenu(MenuDto.CreateRequest request) {
        Menu menu = Menu.builder()
                .menuName(request.getMenuName())
                .menuUrl(request.getMenuUrl())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .icon(request.getIcon())
                .requiredRoles(request.getRequiredRoles())
                .build();

        if (request.getParentMenuId() != null) {
            Menu parent = menuRepository.findById(request.getParentMenuId())
                    .orElseThrow(() -> new IllegalArgumentException("상위 메뉴를 찾을 수 없습니다."));
            menu.setParentMenu(parent);
        }

        return toDto(menuRepository.save(menu));
    }

    @Transactional
    public MenuDto.Response updateMenu(Long id, MenuDto.CreateRequest request) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("메뉴를 찾을 수 없습니다."));
        if (request.getMenuName() != null) menu.setMenuName(request.getMenuName());
        if (request.getMenuUrl() != null) menu.setMenuUrl(request.getMenuUrl());
        if (request.getDisplayOrder() != null) menu.setDisplayOrder(request.getDisplayOrder());
        if (request.getIcon() != null) menu.setIcon(request.getIcon());
        if (request.getRequiredRoles() != null) menu.setRequiredRoles(request.getRequiredRoles());
        return toDto(menuRepository.save(menu));
    }

    @Transactional
    public void deleteMenu(Long id) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("메뉴를 찾을 수 없습니다."));
        menu.setIsActive(false);
        menuRepository.save(menu);
    }

    private MenuDto.Response toDto(Menu m) {
        return MenuDto.Response.builder()
                .menuId(m.getMenuId()).menuName(m.getMenuName())
                .menuUrl(m.getMenuUrl())
                .parentMenuId(m.getParentMenu() != null ? m.getParentMenu().getMenuId() : null)
                .displayOrder(m.getDisplayOrder())
                .icon(m.getIcon()).requiredRoles(m.getRequiredRoles())
                .isActive(m.getIsActive())
                .build();
    }

    private MenuDto.Response toDtoWithChildren(Menu m) {
        List<MenuDto.Response> children = m.getChildren().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .map(this::toDtoWithChildren)
                .collect(Collectors.toList());
        MenuDto.Response dto = toDto(m);
        dto.setChildren(children);
        return dto;
    }
}
