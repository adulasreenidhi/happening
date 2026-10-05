package com.happening.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import com.happening.entity.City;

public interface CityRepository extends JpaRepository<City, Long> {
    List<City> findAllByOrderByNameAsc();
}
