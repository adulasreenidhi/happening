package com.happening.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.happening.entity.City;

public interface CityRepository extends JpaRepository<City, Long> {
}
