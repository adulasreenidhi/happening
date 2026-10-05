package com.happening.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import com.happening.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByOrderByNameAsc();
}
